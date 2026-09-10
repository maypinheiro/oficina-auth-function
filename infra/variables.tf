variable "aws_region" {
  type    = string
  default = "us-east-1"
}

variable "environment" {
  type = string

  validation {
    condition     = contains(["hml", "prod"], var.environment)
    error_message = "environment deve ser hml ou prod."
  }
}

variable "lambda_role_arn" {
  description = "Role permitida pelo Learner Lab para execução das Lambdas."
  type        = string
}

variable "private_subnet_ids" {
  type = list(string)
}

variable "lambda_security_group_ids" {
  type = list(string)
}

variable "database_secret_arn" {
  type      = string
  sensitive = true
}

variable "jwt_private_key_secret_arn" {
  type      = string
  sensitive = true
}

variable "jwt_public_key_base64" {
  type      = string
  sensitive = true
}

variable "artifact_path" {
  type    = string
  default = "../artifact/oficina-auth.zip"
}

variable "source_code_hash" {
  description = "SHA-256 base64 do ZIP, fornecido pela pipeline."
  type        = string
  default     = null
}
