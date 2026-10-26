provider "aws" {
  region = var.region

  default_tags {
    tags = {
      Project   = "tpFoyer"
      ManagedBy = "terraform"
    }
  }
}

data "aws_availability_zones" "available" {
  state = "available"
}

locals {
  azs = slice(data.aws_availability_zones.available.names, 0, 2)
}

# Network: 2 public subnets (load balancers, NAT) + 2 private subnets (nodes)
module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "~> 6.7"

  name = "${var.cluster_name}-vpc"
  cidr = var.vpc_cidr
  azs  = local.azs

  public_subnets  = [for i, az in local.azs : cidrsubnet(var.vpc_cidr, 8, i)]
  private_subnets = [for i, az in local.azs : cidrsubnet(var.vpc_cidr, 8, i + 10)]

  enable_nat_gateway = true
  single_nat_gateway = true # one NAT gateway instead of one per AZ: cheaper

  # Tags used by Kubernetes to place load balancers
  public_subnet_tags  = { "kubernetes.io/role/elb" = 1 }
  private_subnet_tags = { "kubernetes.io/role/internal-elb" = 1 }
}

# EKS cluster + one managed node group
module "eks" {
  source  = "terraform-aws-modules/eks/aws"
  version = "~> 21.29"

  name               = var.cluster_name
  kubernetes_version = var.kubernetes_version

  endpoint_public_access                   = true # Jenkins runs outside AWS
  enable_cluster_creator_admin_permissions = true # the AWS user of Jenkins becomes cluster admin

  # No customer KMS key (it costs money and blocks re-creation for 30 days after a destroy)
  create_kms_key    = false
  encryption_config = null

  vpc_id     = module.vpc.vpc_id
  subnet_ids = module.vpc.private_subnets

  addons = {
    vpc-cni            = { before_compute = true }
    kube-proxy         = {}
    coredns            = {}
    aws-ebs-csi-driver = {} # creates EBS volumes for PersistentVolumeClaims (MySQL)
  }

  eks_managed_node_groups = {
    default = {
      instance_types = [var.node_instance_type]
      min_size       = 1
      max_size       = 3
      desired_size   = var.node_count

      # The EBS CSI driver uses the node role to create volumes
      iam_role_additional_policies = {
        ebs = "arn:aws:iam::aws:policy/service-role/AmazonEBSCSIDriverPolicy"
      }
    }
  }
}
