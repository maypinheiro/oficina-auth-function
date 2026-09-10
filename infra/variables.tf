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

variable "backend_listener_arn" {
  description = "ARN do listener privado do ALB/NLB que encaminha para a API no EKS."
  type        = string
}

variable "vpc_link_subnet_ids" {
  description = "Sub-redes privadas usadas pelo VPC Link do API Gateway."
  type        = list(string)
}

variable "vpc_link_security_group_ids" {
  description = "Security groups do VPC Link com acesso ao listener privado."
  type        = list(string)
}

variable "cors_allowed_origins" {
  description = "Origens explicitamente autorizadas a consumir o Gateway."
  type        = list(string)
  validation {
    condition     = length(var.cors_allowed_origins) > 0
    error_message = "Informe ao menos uma origem CORS autorizada."
  }
}

variable "throttling_burst_limit" {
  type    = number
  default = 50
}

variable "throttling_rate_limit" {
  type    = number
  default = 25
}

variable "tags" {
  description = "Tags comuns dos recursos."
  type        = map(string)
  default = {
    Project   = "oficina"
    ManagedBy = "terraform"
  }
}

variable "datadog_lambda_layer_arn" {
  description = "ARN versionado da Datadog Lambda Library para Node.js."
  type        = string
}

variable "datadog_extension_layer_arn" {
  description = "ARN versionado da Datadog Lambda Extension."
  type        = string
}

variable "datadog_api_key_secret_arn" {
  description = "Secret ARN contendo a API key do Datadog."
  type        = string
  sensitive   = true
}

variable "datadog_site" {
  type    = string
  default = "datadoghq.com"
}

variable "trace_sample_rate" {
  type    = number
  default = 1
  validation {
    condition     = var.trace_sample_rate >= 0 && var.trace_sample_rate <= 1
    error_message = "trace_sample_rate deve estar entre 0 e 1."
  }
}
