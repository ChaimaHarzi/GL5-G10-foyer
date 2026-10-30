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

# AWS Academy Learner Lab: IAM roles cannot be created and iam:GetRole is denied,
# so the cluster and the nodes use the existing "LabRole". Its ARN is built from
# the account id (sts:GetCallerIdentity is always allowed).
data "aws_caller_identity" "current" {}

locals {
  azs          = slice(data.aws_availability_zones.available.names, 0, 2)
  lab_role_arn = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:role/LabRole"
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

# EKS cluster (control plane managed by AWS)
resource "aws_eks_cluster" "this" {
  name     = var.cluster_name
  version  = var.kubernetes_version
  role_arn = local.lab_role_arn

  vpc_config {
    subnet_ids              = module.vpc.private_subnets
    endpoint_public_access  = true # Jenkins runs outside AWS
    endpoint_private_access = true # the nodes reach the API inside the VPC
  }

  access_config {
    authentication_mode                         = "API_AND_CONFIG_MAP"
    bootstrap_cluster_creator_admin_permissions = true # the AWS role of Jenkins becomes cluster admin
  }
}

# Network add-ons: needed before the nodes can become ready
resource "aws_eks_addon" "before_nodes" {
  for_each     = toset(["vpc-cni", "kube-proxy"])
  cluster_name = aws_eks_cluster.this.name
  addon_name   = each.key
}

# Lets pods read the node role through the instance metadata (hop limit 2):
# the EBS CSI driver has no role of its own, so it uses LabRole through the node.
resource "aws_launch_template" "node" {
  name_prefix = "${var.cluster_name}-node-"

  metadata_options {
    http_endpoint               = "enabled"
    http_tokens                 = "required"
    http_put_response_hop_limit = 2
  }
}

# Worker nodes (EC2) in the private subnets
resource "aws_eks_node_group" "default" {
  cluster_name    = aws_eks_cluster.this.name
  node_group_name = "default"
  node_role_arn   = local.lab_role_arn
  subnet_ids      = module.vpc.private_subnets
  instance_types  = [var.node_instance_type]

  scaling_config {
    min_size     = 1
    max_size     = 3
    desired_size = var.node_count
  }

  launch_template {
    id      = aws_launch_template.node.id
    version = aws_launch_template.node.latest_version
  }

  depends_on = [aws_eks_addon.before_nodes]
}

# Add-ons that run as pods, so they wait for the nodes
resource "aws_eks_addon" "after_nodes" {
  for_each     = toset(["coredns", "aws-ebs-csi-driver"]) # EBS driver: disks for PersistentVolumeClaims (MySQL)
  cluster_name = aws_eks_cluster.this.name
  addon_name   = each.key

  depends_on = [aws_eks_node_group.default]
}
