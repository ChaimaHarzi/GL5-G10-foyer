
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