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
    }

    environment {
        // Repository name on Docker Hub; the account (namespace) is taken from the
        // 'docker-hub-repo' credential of the Jenkins running the pipeline.
        IMAGE_REPO = 'tpfoyer'
        // S3 bucket holding the Terraform state (created once by hand, see step 2).
        TF_STATE_BUCKET = 'tpfoyer-tfstate-fourat10'
    }

    stages {
        stage('INIT') {
            steps {
                script {
                    gv = load 'script.groovy'
                    env.IMAGE_NAME = gv.resolveImageName()
                    echo "Docker image: ${env.IMAGE_NAME}"
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

                stage('DEPLOY OUR IMAGE') {
                    steps {
                        script {
                            gv.deployImage()
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
        }
        failure {
            echo 'Pipeline failed. Check the logs of the failed stage.'
        }
        always {
            echo 'Pipeline execution finished.'
        }
    }
}
