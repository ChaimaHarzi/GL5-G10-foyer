
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