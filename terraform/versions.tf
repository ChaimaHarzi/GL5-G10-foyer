terraform {
  required_version = ">= 1.10" # needed for S3 native state locking

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.59"
    }
  }

  # The bucket is given by Jenkins at "terraform init" (-backend-config),
  # so each teammate can use their own bucket.
  backend "s3" {
    key          = "tpfoyer/eks.tfstate"
    use_lockfile = true
  }
}
