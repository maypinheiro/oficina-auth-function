output "authenticate_function_name" { value = aws_lambda_function.authenticate.function_name }
output "authenticate_invoke_arn" { value = aws_lambda_function.authenticate.invoke_arn }
output "authorizer_function_name" { value = aws_lambda_function.authorize.function_name }
output "authorizer_invoke_arn" { value = aws_lambda_function.authorize.invoke_arn }
