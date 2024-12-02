pipeline {
     agent any
       stages {
           stage('Git Clone') {
               steps {
                   script {
                       try {
                           git url: 'https://github.com/Seyun29/OnMyWay_BE_V2', branch: 'main'
                           env.cloneResult=true
                       } catch (error) {
                           print(error)
                           env.cloneResult=false
                           currentBuild.result = 'FAILURE'
                       }
                   }
               }
           }
           stage('ECR Upload') {
               steps{
                   script{
                       try {
                           sh 'aws ecr get-login-password --region ap-northeast-2 | docker login --username AWS --password-stdin 130831355352.dkr.ecr.ap-northeast-2.amazonaws.com/omw_api'
                           sh 'docker build -t omw_api .'
                           sh 'docker tag omw_api 130831355352.dkr.ecr.ap-northeast-2.amazonaws.com/omw_api:latest'
                           sh 'docker push 130831355352.dkr.ecr.ap-northeast-2.amazonaws.com/omw_api:latest'

                       } catch (error) {
                           print(error)
                           currentBuild.result = 'FAILURE'
                       }
                   }
               }
           }

           stage('Clean docker image') {
               steps{
                   sh "docker rmi -f omw_api 130831355352.dkr.ecr.ap-northeast-2.amazonaws.com/omw_api"
               }
           }

           stage ('ECS Deploy') {
               steps {
                   script {
                       sh "aws ecs update-service --cluster ecs-jang-cluster --service ecs-omw-api --force-new-deployment"
                   }
               }
           }

       }
}