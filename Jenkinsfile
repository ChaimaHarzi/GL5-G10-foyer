#!/usr/bin/env groovy

def gv

pipeline {
    agent any

    tools {
        maven 'maven-3.10'
    }

    options {
        timestamps()
        disableConcurrentBuilds()
    }

    parameters {
        choice(name: 'TF_ACTION', choices: ['apply', 'destroy'],
               description: 'apply = create/update the AWS infrastructure, destroy = delete it')
        string(name: 'RELEASE_VERSION', defaultValue: '',
               description: 'Empty = publish the SNAPSHOT to maven-snapshots. A version (e.g. 1.0.0) = publish a release to maven-releases')
    }

    environment {
        // Repository name on Docker Hub; the account (namespace) is taken from the
        // 'docker-hub-repo' credential of the Jenkins running the pipeline.
        IMAGE_REPO = 'tpfoyer'
        FRONT_IMAGE_REPO = 'tpfoyer-front'
        TF_VAR_cluster_name='tpfoyer-eks-chaima'
        // S3 bucket holding the Terraform state (created once by hand, see step 2).
        TF_STATE_BUCKET = 'tpfoyer-tfstate-chaima-058264229450'

        // Who receives the build notifications (success and failure).
        NOTIFY_EMAIL = 'chaima.harzi@etudiant-fst.utm.tn'
    }

    stages {
        stage('INIT') {
            steps {
                script {
                    gv = load 'script.groovy'
                    env.IMAGE_NAME = gv.resolveImageName()
                    env.FRONT_IMAGE_NAME = gv.resolveImageName(env.FRONT_IMAGE_REPO)
                    echo "Docker images: ${env.IMAGE_NAME} (back), ${env.FRONT_IMAGE_NAME} (front)"
                }
            }
        }

        stage('CHECKOUT GIT') {
            steps {
                script {
                    gv.checkoutGit()
                }
            }
        }

        // Build, test and publish the application: not needed when we only destroy the infrastructure.
        stage('BUILD, TEST & PUBLISH') {
            when { expression { params.TF_ACTION != 'destroy' } }
            stages {
                stage('MVN CLEAN') {
                    steps {
                        script {
                            gv.mavenClean()
                        }
                    }
                }

                stage('UNIT TESTS') {
                    steps {
                        script {
                            gv.unitTests()
                        }
                    }
                    post {
                        always {
                            junit(
                                testResults: 'target/surefire-reports/*.xml',
                                allowEmptyResults: true
                            )
                        }
                    }
                }

                stage('INTEGRATION TESTS') {
                    steps {
                        script {
                            gv.integrationTests()
                        }
                    }
                    post {
                        always {
                            junit(
                                testResults: 'target/failsafe-reports/*.xml',
                                allowEmptyResults: true
                            )
                        }
                    }
                }

                stage('FRONT TESTS') {
                    steps {
                        script {
                            gv.frontTests()
                        }
                    }
                    post {
                        always {
                            junit(
                                testResults: 'frontend/reports/junit/*.xml',
                                allowEmptyResults: true
                            )
                        }
                    }
                }

                stage('ARTIFACT CONSTRUCTION') {
                    steps {
                        script {
                            gv.buildArtifact()
                        }
                    }
                }

                stage('MVN SONARQUBE') {
                    steps {
                        script {
                            gv.sonarQube()
                        }
                    }
                }

                stage('PUBLISH TO NEXUS') {
                    steps {
                        script {
                            gv.publishToNexus()
                        }
                    }
                }

                stage('BUILDING OUR IMAGE') {
                    steps {
                        script {
                            gv.buildImage()
                        }
                    }
                }

                stage('BUILDING FRONT IMAGE') {
                    steps {
                        script {
                            gv.buildFrontImage()
                        }
                    }
                }

                stage('DEPLOY OUR IMAGE') {
                    steps {
                        script {
                            gv.deployImage()
                        }
                    }
                }

                stage('DEPLOY FRONT IMAGE') {
                    steps {
                        script {
                            gv.deployFrontImage()
                        }
                    }
                }
            }
        }

        stage('Test AWS Credentials') {
            steps {
                script {
                    gv.testAwsCredentials()
                }
            }
        }

        // Runs "terraform apply" or "terraform destroy" depending on TF_ACTION.
        stage('SETUP TERRAFORM') {
            steps {
                script {
                    gv.setupTerraform()
                }
            }
        }

        // Connect to the cluster and deploy: impossible once the cluster is destroyed.
        stage('KUBERNETES') {
            when { expression { params.TF_ACTION != 'destroy' } }
            stages {
                stage('UPDATE KUBECONFIG') {
                    steps {
                        script {
                            gv.updateKubeconfig()
                        }
                    }
                }

                stage('DEPLOY TO AWS KUBERNETES') {
                    steps {
                        script {
                            gv.deployToAwsKubernetes()
                        }
                    }
                }
            }
        }
    }

    post {
        success {
            echo 'Pipeline completed successfully!'
            emailext(
                to: env.NOTIFY_EMAIL,
                subject: "SUCCESS: ${env.JOB_NAME} #${env.BUILD_NUMBER} (${params.TF_ACTION ?: 'apply'})",
                mimeType: 'text/html',
                body: """
                    <h2 style="color:#2e7d32">Build #${env.BUILD_NUMBER} succeeded</h2>
                    <p>
                      <b>Job:</b> ${env.JOB_NAME}<br>
                      <b>Action:</b> ${params.TF_ACTION ?: 'apply'}<br>
                      <b>Docker images:</b> ${params.TF_ACTION == 'destroy' ? '-' : env.IMAGE_NAME + ':' + env.BUILD_NUMBER + ' (back), ' + env.FRONT_IMAGE_NAME + ':' + env.BUILD_NUMBER + ' (front)'}<br>
                      <b>Duration:</b> ${currentBuild.durationString}
                    </p>
                    <p>
                      <a href="${env.BUILD_URL}">Open the build</a> |
                      <a href="${env.BUILD_URL}console">Console output</a> |
                      <a href="http://localhost:9000/dashboard?id=tpFoyer-17">SonarQube</a>
                    </p>
                """
            )
        }
        failure {
            echo 'Pipeline failed. Check the logs of the failed stage.'
            emailext(
                to: env.NOTIFY_EMAIL,
                subject: "FAILURE: ${env.JOB_NAME} #${env.BUILD_NUMBER} (${params.TF_ACTION ?: 'apply'})",
                mimeType: 'text/html',
                attachLog: true,
                compressLog: true,
                body: """
                    <h2 style="color:#c62828">Build #${env.BUILD_NUMBER} failed</h2>
                    <p>
                      <b>Job:</b> ${env.JOB_NAME}<br>
                      <b>Action:</b> ${params.TF_ACTION ?: 'apply'}<br>
                      <b>Duration:</b> ${currentBuild.durationString}
                    </p>
                    <p>The full build log is attached (build.log.gz).</p>
                    <p>
                      <a href="${env.BUILD_URL}">Open the build</a> |
                      <a href="${env.BUILD_URL}console">Console output</a>
                    </p>
                """
            )
        }
        always {
            echo 'Pipeline execution finished.'
        }
    }
}