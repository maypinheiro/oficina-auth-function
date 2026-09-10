provider "aws" {
  region = var.aws_region
  default_tags {
    tags = {
      Project     = "techchallenge-oficina"
      Environment = var.environment
      ManagedBy   = "terraform"
      CostCenter  = "fiap-fase3"
      Repository  = "oficina-auth-function"
    }
  }
}
