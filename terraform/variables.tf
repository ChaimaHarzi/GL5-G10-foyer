variable "region" {
  description = "AWS region of the infrastructure"
  type        = string
  default     = "us-west-2"
}

variable "cluster_name" {
  description = "Name of the EKS cluster"
  type        = string
  default     = "tpfoyer-eks"
}

variable "kubernetes_version" {
  description = "Kubernetes version of the cluster"
  type        = string
  default     = "1.36"
}

variable "vpc_cidr" {
  description = "IP range of the VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "node_instance_type" {
  description = "EC2 type of the worker nodes (x86, because the Docker image is linux/amd64)"
  type        = string
  default     = "t3.medium"
}

variable "node_count" {
  description = "Number of worker nodes"
  type        = number
  default     = 2
}
