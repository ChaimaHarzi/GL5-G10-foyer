
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

// GitOps: writes the images of this build in k8s/kustomization.yaml and pushes the commit to GITOPS_BRANCH.
// ArgoCD reads this file and deploys these images: git says which version runs on EKS.
// The 'github-pat' token is given to git by a credential helper: it never appears in a URL or in .git/config.
// "[skip ci]": this commit must not start a new build if a webhook is added one day.
def updateManifests() {
    withCredentials([usernamePassword(credentialsId: 'github-pat',
            usernameVariable: 'GITHUB_USER',
            passwordVariable: 'GITHUB_TOKEN')]) {
        sh '''
            sed -i \
              -e "/name: tpfoyer-back$/,/newTag:/{s|newName: .*|newName: $IMAGE_NAME|;s|newTag: .*|newTag: '$BUILD_NUMBER'|}" \
              -e "/name: tpfoyer-front$/,/newTag:/{s|newName: .*|newName: $FRONT_IMAGE_NAME|;s|newTag: .*|newTag: '$BUILD_NUMBER'|}" \
              k8s/kustomization.yaml
            git diff k8s/kustomization.yaml
            git -c user.name=Jenkins -c user.email=jenkins@tpfoyer.local \
              commit -m "Deploy images #$BUILD_NUMBER [skip ci]" k8s/kustomization.yaml

            # Commits pushed to the branch since the checkout of this build are kept: ours goes on top of them
            # (--autostash: the pom.xml changed by a release build stays as it is in the workspace)
            HELPER='!f() { echo "username=$GITHUB_USER"; echo "password=$GITHUB_TOKEN"; }; f'
            git -c credential.helper= -c credential.helper="$HELPER" fetch origin "$GITOPS_BRANCH"
            git -c user.name=Jenkins -c user.email=jenkins@tpfoyer.local rebase --autostash FETCH_HEAD
            git -c credential.helper= -c credential.helper="$HELPER" push origin "HEAD:refs/heads/$GITOPS_BRANCH"
        '''
    }
    // The commit ArgoCD must deploy, checked by the stage SYNC & VERIFY
    env.GITOPS_REVISION = sh(script: 'git rev-parse HEAD', returnStdout: true).trim()
    echo "Images of build #${env.BUILD_NUMBER} written in git: commit ${env.GITOPS_REVISION}"
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
                // The load balancers (front, Grafana, ArgoCD) and the MySQL disk are created by Kubernetes, not by Terraform:
                // delete the application, the monitoring and ArgoCD first, so AWS removes them before Terraform deletes the network.
                // The ArgoCD Application goes first: otherwise ArgoCD would recreate the application while it is deleted
                // ("|| true": the Application type does not exist if ArgoCD was never installed).
                sh '''
                    if terraform output -raw kubeconfig > "$KUBECONFIG" 2>/dev/null; then
                      kubectl -n argocd delete applications.argoproj.io --all --ignore-not-found || true
                      kubectl delete namespace tpfoyer monitoring argocd --ignore-not-found --timeout=10m
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

// Configures the cluster with Ansible (ansible/cluster.yml): namespace, StorageClass, MySQL Secret,
// then metrics-server (role metrics_server), Prometheus and Grafana (role monitoring),
// then ArgoCD and the application it follows (role argocd).
// Ansible runs here, in the Jenkins container, and reaches the EKS API with the same kubeconfig and AWS keys as kubectl.
// The logins of the 'mysql-creds', 'grafana-admin' and 'github-pat' credentials are given as environment variables (never in git).
def configureCluster() {
    withEks {
        withCredentials([
                usernamePassword(credentialsId: 'mysql-creds',
                        usernameVariable: 'DB_USERNAME',
                        passwordVariable: 'DB_PASSWORD'),
                usernamePassword(credentialsId: 'grafana-admin',
                        usernameVariable: 'GRAFANA_ADMIN_USER',
                        passwordVariable: 'GRAFANA_ADMIN_PASSWORD'),
                usernamePassword(credentialsId: 'github-pat',
                        usernameVariable: 'GITHUB_USER',
                        passwordVariable: 'GITHUB_TOKEN')
        ]) {
            // ANSIBLE_CONFIG: use ansible.cfg even if the folder is world-writable (Ansible ignores it otherwise)
            dir('ansible') {
                sh 'ANSIBLE_CONFIG="$PWD/ansible.cfg" ansible-playbook cluster.yml'
            }
        }
    }
}

// Step 12 (GitOps): ArgoCD deploys MySQL, the back and the front from git; Jenkins only checks the result.
// Asks ArgoCD to read git now (instead of within 3 minutes), then waits until the cluster runs the commit of
// UPDATE MANIFESTS (Synced) and every pod is ready after the rolling updates (Healthy). Fails after 10 minutes.
def syncAndVerify() {
    withEks {
        sh 'kubectl -n argocd annotate application tpfoyer argocd.argoproj.io/refresh=normal --overwrite'
        sh '''
            for i in $(seq 1 60); do
              STATE=$(kubectl -n argocd get application tpfoyer \
                -o jsonpath='{.status.sync.revision} {.status.sync.status} {.status.health.status}')
              echo "ArgoCD: $STATE"
              [ "$STATE" = "$GITOPS_REVISION Synced Healthy" ] && exit 0
              sleep 10
            done
            echo "ArgoCD did not deploy commit $GITOPS_REVISION within 10 minutes:"
            kubectl -n argocd get application tpfoyer -o jsonpath='{.status.operationState.message}{"\\n"}{.status.conditions}{"\\n"}'
            exit 1
        '''

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
            GRAFANA=$(kubectl -n monitoring get svc monitoring-grafana -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')
            echo "Grafana:     http://$GRAFANA/   (login: Jenkins credential grafana-admin)"
            ARGOCD=$(kubectl -n argocd get svc argocd-server -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')
            echo "ArgoCD:      http://$ARGOCD/   (login: admin, password in the Secret argocd-initial-admin-secret)"
        '''
    }
}

return this