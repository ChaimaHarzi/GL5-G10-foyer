
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

// Front tests (Angular, Karma + Jasmine): they run inside "docker build", in the "test" stage of
// frontend/Dockerfile, because Node and Chromium are in that image and not on Jenkins.
// A failing test makes the build fail. The JUnit report is then copied out of the image for Jenkins.
def frontTests() {
    def image = "tpfoyer-front-test:${env.BUILD_NUMBER}"
    def container = "front-test-${env.BUILD_NUMBER}"
    sh "docker build --target test -t ${image} frontend"
    sh """
        rm -rf frontend/reports
        docker create --name ${container} ${image}
        docker cp ${container}:/app/reports frontend/reports
        docker rm ${container}
        docker rmi ${image}
    """
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
// With RELEASE_VERSION set, the version is changed only in this workspace (the pom in git stays -SNAPSHOT),
// and "clean" leaves a single jar in target/ for the Dockerfile.
def publishToNexus() {
    withCredentials([usernamePassword(credentialsId: 'nexus-creds',
            usernameVariable: 'NEXUS_USER',
            passwordVariable: 'NEXUS_PASS')]) {
        def releaseVersion = params.RELEASE_VERSION?.trim()
        if (releaseVersion) {
            //Le plugin versions remplace <version>0.0.1-SNAPSHOT</version> par <version>1.0.0</version> dans le pom.xml, dans le workspace Jenkins seulement. Le pom sur GitHub ne change pas, et le prochain checkout -f le remettra en SNAPSHOT.
            sh "mvn -B -ntp versions:set -DnewVersion=${releaseVersion} -DgenerateBackupPoms=false"
            sh 'mvn -B -ntp -s ci-settings.xml clean deploy -DskipTests'
        } else {
            //lle refait donc tout le parcours : compile (rien à faire), test (sauté avec -DskipTests), package (le jar), verify, install (copie dans ~/.m2 de Jenkins), puis deploy, qui envoie le jar et le pom à Nexus.
            sh 'mvn -B -ntp -s ci-settings.xml deploy -DskipTests'
        }
    }
}

// Docker image name "<docker hub account>/<repository>" (IMAGE_REPO for the back, FRONT_IMAGE_REPO for the front):
// the account is the username of the 'docker-hub-repo' credential, so each Jenkins pushes to the account
// it is allowed to write to.
def resolveImageName(String repository = env.IMAGE_REPO) {
    def name
    withCredentials([usernamePassword(credentialsId: 'docker-hub-repo',
            usernameVariable: 'DOCKER_USER',
            passwordVariable: 'DOCKER_PASS')]) {
        name = "${env.DOCKER_USER.toLowerCase()}/${repository}".toString()
    }
    return name
}

// Docker: builds the image from the Dockerfile, tagged with the Jenkins build number and "latest".
def buildImage() {
    sh "docker build -t ${env.IMAGE_NAME}:${env.BUILD_NUMBER} -t ${env.IMAGE_NAME}:latest ."
}

// Front image: Angular built in production mode and served by Nginx (frontend/Dockerfile, stage "final").
// Same tags as the back: the build number and "latest".
def buildFrontImage() {
    sh "docker build -t ${env.FRONT_IMAGE_NAME}:${env.BUILD_NUMBER} -t ${env.FRONT_IMAGE_NAME}:latest frontend"
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

// Docker Hub: pushes the front image with both tags, with the same credential as the back.
// The repository is created by Docker Hub at the first push (public: the image only holds the static site).
def deployFrontImage() {
    withCredentials([usernamePassword(credentialsId: 'docker-hub-repo',
            usernameVariable: 'DOCKER_USER',
            passwordVariable: 'DOCKER_PASS')]) {
        sh 'echo "$DOCKER_PASS" | docker login -u "$DOCKER_USER" --password-stdin'
        sh "docker push ${env.FRONT_IMAGE_NAME}:${env.BUILD_NUMBER}"
        sh "docker push ${env.FRONT_IMAGE_NAME}:latest"
    }
    sh 'docker logout'
}

// Wraps EKS commands: injects the AWS keys from the Jenkins credentials and points kubectl
// at the kubeconfig written in step 11 (kept in the workspace of this build).
def withEks(Closure body) {
    withCredentials([
            string(credentialsId: 'jenkins_aws_access_key_id', variable: 'AWS_ACCESS_KEY_ID'),
            string(credentialsId: 'jenkins_aws_secret_access_key', variable: 'AWS_SECRET_ACCESS_KEY'),
            string(credentialsId: 'jenkins_aws_session_token', variable: 'AWS_SESSION_TOKEN')

    ]) {
        withEnv(['AWS_DEFAULT_REGION=us-west-2',
                 "KUBECONFIG=${env.WORKSPACE}/kubeconfig"]) {
            body()
        }//kubeconfig : l adreesse https de l api du cluster ,certificat ,qui est autorisé ..
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
            sh 'terraform init -input=false -reconfigure -backend-config="bucket=$TF_STATE_BUCKET"'
            if (params.TF_ACTION == 'destroy') {
                // The load balancer and the MySQL disk are created by Kubernetes, not by Terraform:
                // delete the application first, so AWS removes them before Terraform deletes the network.
                sh '''
                    if terraform output -raw kubeconfig > "$KUBECONFIG" 2>/dev/null; then
                      kubectl delete namespace tpfoyer --ignore-not-found --timeout=10m
                      kubectl wait --for=delete pv --all --timeout=5m || true
                    fi
                '''
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

// Step 12: deploys MySQL, the back and the front on EKS, then waits until the new versions are running.
// Each build deploys its own image tags, which makes Kubernetes perform rolling updates.
def deployToAwsKubernetes() {
    withEks {
        sh 'kubectl apply -f k8s/namespace.yaml -f k8s/storageclass.yaml'

        // MySQL user and password from the 'mysql-creds' Jenkins credential, stored in a Kubernetes Secret (never in git)
        withCredentials([usernamePassword(credentialsId: 'mysql-creds',
                usernameVariable: 'DB_USERNAME',
                passwordVariable: 'DB_PASSWORD')]) {
            sh '''
                kubectl -n tpfoyer create secret generic mysql-credentials \
                  --from-literal=username="$DB_USERNAME" \
                  --from-literal=password="$DB_PASSWORD" \
                  --dry-run=client -o yaml | kubectl apply -f -
            '''
        }

        sh 'kubectl apply -f k8s/mysql.yaml'
        sh 'kubectl -n tpfoyer rollout status statefulset/mysql --timeout=5m'

        // __IMAGE__ in app.yaml becomes the image pushed by this build
        sh "sed 's|__IMAGE__|${env.IMAGE_NAME}:${env.BUILD_NUMBER}|' k8s/app.yaml | kubectl apply -f -"
        sh 'kubectl -n tpfoyer rollout status deployment/tpfoyer --timeout=10m'

        // The front after the back: at start-up, Nginx resolves the Service "tpfoyer" of its proxy_pass
        sh "sed 's|__IMAGE__|${env.FRONT_IMAGE_NAME}:${env.BUILD_NUMBER}|' k8s/front.yaml | kubectl apply -f -"
        sh 'kubectl -n tpfoyer rollout status deployment/tpfoyer-front --timeout=5m'

        sh 'kubectl -n tpfoyer get pods,svc'
        // The only public address is the load balancer of the front; it is known a few seconds after
        // the Service is created, and answers 1 to 3 minutes later (AWS DNS)
        sh '''
            for i in $(seq 1 30); do
              HOST=$(kubectl -n tpfoyer get svc tpfoyer-front -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')
              [ -n "$HOST" ] && break
              sleep 10
            done
            echo "Application: http://$HOST/"
            echo "Swagger:     http://$HOST/tpFoyer17/swagger-ui/index.html"
        '''
    }
}

return this