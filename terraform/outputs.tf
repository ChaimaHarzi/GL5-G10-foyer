output "cluster_name" {
  value = aws_eks_cluster.this.name
}

output "cluster_endpoint" {
  value = aws_eks_cluster.this.endpoint
}

# Kubeconfig written by Jenkins in step 11 (uses aws-iam-authenticator, no aws CLI needed)
output "kubeconfig" {
  value = templatefile("${path.module}/kubeconfig.tpl", {
    cluster_name = aws_eks_cluster.this.name
    endpoint     = aws_eks_cluster.this.endpoint
    ca_data      = aws_eks_cluster.this.certificate_authority[0].data
  })
}
