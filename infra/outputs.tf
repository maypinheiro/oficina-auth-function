output "authenticate_function_name" { value = aws_lambda_function.authenticate.function_name }
output "authenticate_invoke_arn" { value = aws_lambda_function.authenticate.invoke_arn }
output "authorizer_function_name" { value = aws_lambda_function.authorize.function_name }
output "authorizer_invoke_arn" { value = aws_lambda_function.authorize.invoke_arn }
output "api_gateway_id" { value = aws_apigatewayv2_api.gateway.id }
output "api_gateway_endpoint" { value = aws_apigatewayv2_api.gateway.api_endpoint }
output "api_gateway_stage_invoke_url" { value = aws_apigatewayv2_stage.default.invoke_url }
