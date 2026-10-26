apiVersion: v1
kind: Config
clusters:
  - name: ${cluster_name}
    cluster:
      server: ${endpoint}
      certificate-authority-data: ${ca_data}
contexts:
  - name: ${cluster_name}
    context:
      cluster: ${cluster_name}
      user: ${cluster_name}
current-context: ${cluster_name}
users:
  - name: ${cluster_name}
    user:
      exec:
        apiVersion: client.authentication.k8s.io/v1beta1
        command: aws-iam-authenticator
        args: ["token", "-i", "${cluster_name}"]
