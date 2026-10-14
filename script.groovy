
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

def unitTests() {
    sh 'mvn -B -ntp test'
}

def sonarQube() {
    echo 'Doing step 5: Simulating SonarQube code analysis...'
}

def publishToNexus() {
    echo 'Doing step 6: Simulating publication of the JAR to Nexus...'
}

def buildImage() {
    echo 'Doing step 7: Simulating Docker image construction...'
}

def deployImage() {
    echo 'Doing step 8: Simulating Docker image deployment...'
}

def testAwsCredentials() {
    echo 'Doing step 9: Simulating AWS credentials validation...'
}

def setupTerraform() {
    echo 'Doing step 10: Simulating Terraform infrastructure provisioning...'
}

def updateKubeconfig() {
    echo 'Doing step 11: Simulating Kubernetes kubeconfig update...'
}

def deployToAwsKubernetes() {
    echo 'Doing step 12: Simulating deployment to AWS Kubernetes...'
}

return this