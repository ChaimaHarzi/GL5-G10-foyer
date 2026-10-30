output "cluster_name" {
  value = module.eks.cluster_name
}

output "cluster_endpoint" {
  value = module.eks.cluster_endpoint
}

# Kubeconfig written by Jenkins in step 11 (uses aws-iam-authenticator, no aws CLI needed)
output "kubeconfig" {
  value = templatefile("${path.module}/kubeconfig.tpl", {
    cluster_name = module.eks.cluster_name
    endpoint     = module.eks.cluster_endpoint
    ca_data      = module.eks.cluster_certificate_authority_data
  })
}
