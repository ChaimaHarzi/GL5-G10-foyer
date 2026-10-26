
def checkoutGit() {
    checkout scm
    echo 'Git checkout completed successfully.'
}

def mavenClean() {
    sh 'mvn -B -ntp clean'
}

def buildArtifact() {
    sh 'mvn -B -ntp -DskipTests package'

    archiveArtifacts(
            artifacts: 'target/*.jar',
            fingerprint: true
    )
}

// Unit tests: *Test.java (Mockito, no Spring context), run by Surefire
def unitTests() {
    sh 'mvn -B -ntp test'
}

// Integration tests: *IT.java (Spring context + H2), run by Failsafe.
// Reuses the classes compiled by the unit test stage.
// JaCoCo appends their coverage to the unit test coverage, then writes the report for SonarQube.
def integrationTests() {
    sh 'mvn -B -ntp jacoco:prepare-agent failsafe:integration-test failsafe:verify jacoco:report'
}

// SonarQube: static analysis of the code + coverage read from the JaCoCo report
// (target/site/jacoco/jacoco.xml, produced by the test stages).
def sonarQube() {
    withCredentials([string(credentialsId: 'sonar-token', variable: 'SONAR_TOKEN')]) {
        sh '''
            mvn -B -ntp sonar:sonar \
              -Dsonar.host.url=http://sonarqube:9000 \
              -Dsonar.token=$SONAR_TOKEN \
              -Dsonar.projectKey=tpFoyer-17 \
              -Dsonar.projectName=tpFoyer-17
        '''
    }
}

// Nexus: publishes the jar (maven-snapshots for -SNAPSHOT versions, maven-releases otherwise).
// Credentials come from the 'nexus-creds' Jenkins credential and are read by ci-settings.xml.
def publishToNexus() {
    withCredentials([usernamePassword(credentialsId: 'nexus-creds',
            usernameVariable: 'NEXUS_USER',
            passwordVariable: 'NEXUS_PASS')]) {
        sh 'mvn -B -ntp -s ci-settings.xml deploy -DskipTests'
    }
}

// Docker image name "<docker hub account>/<IMAGE_REPO>": the account is the username of the
// 'docker-hub-repo' credential, so each Jenkins pushes to the account it is allowed to write to.
def resolveImageName() {
    def name
    withCredentials([usernamePassword(credentialsId: 'docker-hub-repo',
            usernameVariable: 'DOCKER_USER',
            passwordVariable: 'DOCKER_PASS')]) {
        name = "${env.DOCKER_USER.toLowerCase()}/${env.IMAGE_REPO}".toString()
    }
    return name
}

// Docker: builds the image from the Dockerfile, tagged with the Jenkins build number and "latest".
def buildImage() {
    sh "docker build -t ${env.IMAGE_NAME}:${env.BUILD_NUMBER} -t ${env.IMAGE_NAME}:latest ."
}

// Docker Hub: logs in with the 'docker-hub-repo' credential and pushes both tags.
def deployImage() {
    withCredentials([usernamePassword(credentialsId: 'docker-hub-repo',
            usernameVariable: 'DOCKER_USER',
            passwordVariable: 'DOCKER_PASS')]) {
        sh 'echo "$DOCKER_PASS" | docker login -u "$DOCKER_USER" --password-stdin'
        sh "docker push ${env.IMAGE_NAME}:${env.BUILD_NUMBER}"
        sh "docker push ${env.IMAGE_NAME}:latest"
    }
    sh 'docker logout'
}

// Wraps EKS commands: injects the AWS keys from the Jenkins credentials and points kubectl
// at the kubeconfig written in step 11 (kept in the workspace of this build).
def withEks(Closure body) {
    withCredentials([
            string(credentialsId: 'jenkins_aws_access_key_id', variable: 'AWS_ACCESS_KEY_ID'),
            string(credentialsId: 'jenkins_aws_secret_access_key', variable: 'AWS_SECRET_ACCESS_KEY')
    ]) {
        withEnv(['AWS_DEFAULT_REGION=us-west-2',
                 "KUBECONFIG=${env.WORKSPACE}/kubeconfig"]) {
            body()
        }
    }
}

// Step 9: checks that the tools exist and the credentials are injected (values stay masked).
def testAwsCredentials() {
    withEks {
        sh 'kubectl version --client'
        sh 'aws-iam-authenticator version'
        sh 'terraform version'
        sh 'test -n "$AWS_ACCESS_KEY_ID" && echo "AWS access key is set"'
    }
}

// Step 10: creates or updates the AWS infrastructure described in terraform/ (VPC + EKS cluster + nodes).
// The state is stored in the S3 bucket TF_STATE_BUCKET, so every build sees the same infrastructure.
// With TF_ACTION=destroy, everything is deleted instead.
def setupTerraform() {
    withEks {
        dir('terraform') {
            sh 'terraform init -input=false -backend-config="bucket=$TF_STATE_BUCKET"'
            if (params.TF_ACTION == 'destroy') {
                sh 'terraform destroy -input=false -auto-approve -lock-timeout=10m'
            } else {
                sh 'terraform plan -input=false -lock-timeout=10m -out=tfplan'
                sh 'terraform apply -input=false -lock-timeout=10m tfplan'
            }
        }
    }
}

// Step 11: writes the kubeconfig of the cluster created by Terraform, then checks the connection.
def updateKubeconfig() {
    withEks {
        dir('terraform') {
            sh 'terraform output -raw kubeconfig > "$KUBECONFIG"'
        }
        sh 'kubectl config current-context'
        sh 'kubectl cluster-info'
    }
}

// Step 12: read-only connection test against the cluster (nothing is created).
def deployToAwsKubernetes() {
    withEks {
        sh 'kubectl get nodes'
        sh 'kubectl get pods -A'
        sh 'kubectl auth can-i create deployments'
    }
}

return this
