pipeline {
     agent any
       stages {
           stage('Git Clone') {
               steps {
                   script {
                       try {
                           git url: 'https://github.com/Seyun29/OnMyWay_AUTH', branch: 'main'
                           env.cloneResult=true
                       } catch (error) {
                           print(error)
                           env.cloneResult=false
                           currentBuild.result = 'FAILURE'
                       }
                   }
               }
           }
           stage('Build') {
                steps {
                     script {
                          try {
                            sh "chmod +x ./gradlew && ./gradlew build -Pprofile=prod --no-daemon"
                            env.buildResult=true
                          } catch (error) {
                            print(error)
                            env.buildResult=false
                            currentBuild.result = 'FAILURE'
                          }
                     }
                }
           }
           stage('ECR Upload') {
               steps{
                   script{
                       try {
                           sh 'aws ecr get-login-password --region ap-northeast-2 | docker login --username AWS --password-stdin 130831355352.dkr.ecr.ap-northeast-2.amazonaws.com/omw_auth'
                           sh 'docker build -t omw_auth .'
                           sh 'docker tag omw_auth 130831355352.dkr.ecr.ap-northeast-2.amazonaws.com/omw_auth:latest'
                           sh 'docker push 130831355352.dkr.ecr.ap-northeast-2.amazonaws.com/omw_auth:latest'

                       } catch (error) {
                           print(error)
                           echo 'Remove Deploy Files'
                           sh "sudo rm -rf /var/lib/jenkins/workspace/${env.JOB_NAME}/*"
                           currentBuild.result = 'FAILURE'
                       }
                   }
               }
           }

           stage('Clean docker image') {
               steps{
                   sh "docker rmi -f omw_auth 130831355352.dkr.ecr.ap-northeast-2.amazonaws.com/omw_auth"
                   sh './gradlew clean'
               }
           }

           stage ('ECS Deploy') {
               steps {
                   script {
                       sh "aws ecs update-service --cluster ecs-jang-cluster --service ecs-omw-auth --force-new-deployment"
                   }
               }
           }

       }
}