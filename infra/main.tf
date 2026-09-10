locals { prefix = "oficina-auth-${var.environment}" }

resource "aws_cloudwatch_log_group" "authenticate" {
  name              = "/aws/lambda/${local.prefix}-authenticate"
  retention_in_days = var.environment == "prod" ? 14 : 3
}

resource "aws_cloudwatch_log_group" "authorize" {
  name              = "/aws/lambda/${local.prefix}-authorize"
  retention_in_days = var.environment == "prod" ? 14 : 3
}

resource "aws_lambda_function" "authenticate" {
  function_name    = "${local.prefix}-authenticate"
  role             = var.lambda_role_arn
  runtime          = "nodejs22.x"
  handler          = "dist/handlers/authenticate.handler"
  filename         = var.artifact_path
  source_code_hash = var.source_code_hash
  memory_size      = 256
  timeout          = 10
  layers           = [var.datadog_lambda_layer_arn, var.datadog_extension_layer_arn]
  tracing_config { mode = "Active" }
  environment {
    variables = {
      DATABASE_SECRET_ARN        = var.database_secret_arn
      JWT_PRIVATE_KEY_SECRET_ARN = var.jwt_private_key_secret_arn
      JWT_ISSUER                 = "oficina-auth"
      JWT_AUDIENCE               = "oficina-api"
      JWT_EXPIRES_IN_SECONDS     = "900"
      DD_SERVICE                 = "oficina-auth"
      DD_ENV                     = var.environment
      DD_VERSION                 = coalesce(var.source_code_hash, "unknown")
      DD_SITE                    = var.datadog_site
      DD_API_KEY_SECRET_ARN      = var.datadog_api_key_secret_arn
      DD_TRACE_SAMPLE_RATE       = tostring(var.trace_sample_rate)
      DD_LOGS_INJECTION          = "true"
      DD_CAPTURE_LAMBDA_PAYLOAD  = "false"
      AWS_LAMBDA_EXEC_WRAPPER    = "/opt/datadog_wrapper"
    }
  }
  vpc_config {
    subnet_ids         = var.private_subnet_ids
    security_group_ids = var.lambda_security_group_ids
  }
  depends_on = [aws_cloudwatch_log_group.authenticate]
}

resource "aws_lambda_function" "authorize" {
  function_name    = "${local.prefix}-authorize"
  role             = var.lambda_role_arn
  runtime          = "nodejs22.x"
  handler          = "dist/handlers/authorize.handler"
  filename         = var.artifact_path
  source_code_hash = var.source_code_hash
  memory_size      = 128
  timeout          = 5
  layers           = [var.datadog_lambda_layer_arn, var.datadog_extension_layer_arn]
  tracing_config { mode = "Active" }
  environment {
    variables = {
      JWT_PUBLIC_KEY_BASE64   = var.jwt_public_key_base64
      JWT_ISSUER              = "oficina-auth"
      JWT_AUDIENCE            = "oficina-api"
      DD_SERVICE              = "oficina-authorizer"
      DD_ENV                  = var.environment
      DD_VERSION              = coalesce(var.source_code_hash, "unknown")
      DD_SITE                 = var.datadog_site
      DD_API_KEY_SECRET_ARN   = var.datadog_api_key_secret_arn
      DD_TRACE_SAMPLE_RATE    = tostring(var.trace_sample_rate)
      DD_LOGS_INJECTION       = "true"
      AWS_LAMBDA_EXEC_WRAPPER = "/opt/datadog_wrapper"
    }
  }
  depends_on = [aws_cloudwatch_log_group.authorize]
}
