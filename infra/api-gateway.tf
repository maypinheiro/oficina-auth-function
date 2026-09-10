locals {
  gateway_prefix = "oficina-gateway-${var.environment}"
}

resource "aws_apigatewayv2_api" "gateway" {
  name          = local.gateway_prefix
  protocol_type = "HTTP"
  cors_configuration {
    allow_headers = ["authorization", "content-type", "x-correlation-id"]
    allow_methods = ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]
    allow_origins = var.cors_allowed_origins
    max_age       = 300
  }
  tags = var.tags
}

resource "aws_cloudwatch_log_group" "api_gateway" {
  name              = "/aws/apigateway/${local.gateway_prefix}"
  retention_in_days = var.environment == "prod" ? 14 : 3
  tags              = var.tags
}

resource "aws_apigatewayv2_vpc_link" "backend" {
  name               = "${local.gateway_prefix}-vpc-link"
  subnet_ids         = var.vpc_link_subnet_ids
  security_group_ids = var.vpc_link_security_group_ids
  tags               = var.tags
}

resource "aws_apigatewayv2_integration" "authenticate" {
  api_id                 = aws_apigatewayv2_api.gateway.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.authenticate.invoke_arn
  payload_format_version = "2.0"
  timeout_milliseconds   = 10000
}

resource "aws_apigatewayv2_integration" "backend" {
  api_id                 = aws_apigatewayv2_api.gateway.id
  integration_type       = "HTTP_PROXY"
  integration_method     = "ANY"
  integration_uri        = var.backend_listener_arn
  connection_type        = "VPC_LINK"
  connection_id          = aws_apigatewayv2_vpc_link.backend.id
  payload_format_version = "1.0"
  timeout_milliseconds   = 29000
}

resource "aws_apigatewayv2_authorizer" "client" {
  api_id                            = aws_apigatewayv2_api.gateway.id
  name                              = "${local.gateway_prefix}-client-authorizer"
  authorizer_type                   = "REQUEST"
  authorizer_uri                    = "arn:aws:apigateway:${var.aws_region}:lambda:path/2015-03-31/functions/${aws_lambda_function.authorize.invoke_arn}/invocations"
  identity_sources                  = ["$request.header.Authorization"]
  authorizer_payload_format_version = "2.0"
  enable_simple_responses           = true
  authorizer_result_ttl_in_seconds  = 60
}

resource "aws_apigatewayv2_route" "authenticate" {
  api_id             = aws_apigatewayv2_api.gateway.id
  route_key          = "POST /auth/clientes"
  authorization_type = "NONE"
  target             = "integrations/${aws_apigatewayv2_integration.authenticate.id}"
}

resource "aws_apigatewayv2_route" "health" {
  api_id             = aws_apigatewayv2_api.gateway.id
  route_key          = "GET /health"
  authorization_type = "NONE"
  target             = "integrations/${aws_apigatewayv2_integration.backend.id}"
}

# Temporario durante a migracao para identidades individuais no Cognito.
resource "aws_apigatewayv2_route" "legacy_admin_auth" {
  api_id             = aws_apigatewayv2_api.gateway.id
  route_key          = "POST /auth"
  authorization_type = "NONE"
  target             = "integrations/${aws_apigatewayv2_integration.backend.id}"
}

resource "aws_apigatewayv2_route" "public_business_flow" {
  api_id             = aws_apigatewayv2_api.gateway.id
  route_key          = "ANY /public/{proxy+}"
  authorization_type = "NONE"
  target             = "integrations/${aws_apigatewayv2_integration.backend.id}"
}

resource "aws_apigatewayv2_route" "docs" {
  for_each           = toset(["GET /docs", "GET /docs/{proxy+}"])
  api_id             = aws_apigatewayv2_api.gateway.id
  route_key          = each.value
  authorization_type = "NONE"
  target             = "integrations/${aws_apigatewayv2_integration.backend.id}"
}

resource "aws_apigatewayv2_route" "protected_default" {
  api_id             = aws_apigatewayv2_api.gateway.id
  route_key          = "$default"
  authorization_type = "CUSTOM"
  authorizer_id      = aws_apigatewayv2_authorizer.client.id
  target             = "integrations/${aws_apigatewayv2_integration.backend.id}"
}

resource "aws_apigatewayv2_stage" "default" {
  api_id      = aws_apigatewayv2_api.gateway.id
  name        = "$default"
  auto_deploy = true
  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.api_gateway.arn
    format = jsonencode({
      requestId        = "$context.requestId"
      routeKey         = "$context.routeKey"
      status           = "$context.status"
      responseLength   = "$context.responseLength"
      integrationError = "$context.integrationErrorMessage"
      sourceIp         = "$context.identity.sourceIp"
      userAgent        = "$context.identity.userAgent"
    })
  }
  default_route_settings {
    detailed_metrics_enabled = true
    throttling_burst_limit   = var.throttling_burst_limit
    throttling_rate_limit    = var.throttling_rate_limit
  }
  tags = var.tags
}

resource "aws_lambda_permission" "api_gateway_authenticate" {
  statement_id  = "AllowApiGatewayAuthenticate"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.authenticate.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.gateway.execution_arn}/*/POST/auth/clientes"
}

resource "aws_lambda_permission" "api_gateway_authorizer" {
  statement_id  = "AllowApiGatewayAuthorizer"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.authorize.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.gateway.execution_arn}/authorizers/${aws_apigatewayv2_authorizer.client.id}"
}
