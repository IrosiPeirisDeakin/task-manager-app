pipeline {
  agent any

  environment {
    DOCKER_IMAGE = "irosithamasha/task-manager-app:${env.BUILD_NUMBER}"
    BACKEND_DIR = "backend"
    SONAR_HOST = credentials('sonar-host') // in Jenkins: secret text or username/password
    SONAR_TOKEN = credentials('sonar-token') // token credential in jenkins
    SNYK_TOKEN = credentials('snyk-token') 
  }

  stages {

    stage('Checkout') {
      steps {
        checkout scm
      }
    }

        stage('Build') {
        steps {
            dir("${BACKEND_DIR}") {
                // Install Node.js dependencies
                bat 'npm ci'

                // Build Docker image
                bat "docker build -t ${DOCKER_IMAGE} ."

                // Push to Docker Hub
                script {
                    withCredentials([usernamePassword(
                        credentialsId: 'dockerhub-creds', 
                        usernameVariable: 'DOCKER_USER', 
                        passwordVariable: 'DOCKER_PASS'
                    )]) {
                        // Correct Windows syntax (%VAR%) and multi-line bat
                        bat """
                            echo %DOCKER_PASS% | docker login -u %DOCKER_USER% --password-stdin
                            docker push ${DOCKER_IMAGE}
                        """
                    }
                }
            }
        }
    }

    stage('Test') {
      steps {
          dir(".") {  // run from workspace root
              // Start the database 
              bat 'docker-compose -f infra/docker-compose.yml up -d db'

              // Wait until Postgres is ready (poll every 2 seconds, max 30 seconds)
              bat '''
                  set READY=0
                  set COUNT=0
                  :loop
                  docker-compose -f infra/docker-compose.yml exec db pg_isready -U postgres > nul 2>&1
                  if %ERRORLEVEL%==0 (
                      set READY=1
                  ) else (
                      set /A COUNT+=1
                      if %COUNT% GEQ 15 (
                          echo Postgres not ready after 30 seconds, exiting...
                          exit /b 1
                      )
                      timeout /t 2 /nobreak > nul
                      goto loop
                  )
              '''

              // Run tests inside the backend container
              bat 'docker-compose -f infra/docker-compose.yml run --rm backend npm ci'
              bat 'docker-compose -f infra/docker-compose.yml run --rm backend npm test'

              // Stop containers after tests
              bat 'docker-compose -f infra/docker-compose.yml down'
          }
      }
  }

    stage('Code Quality (SonarQube)') {
        steps {
            withSonarQubeEnv('SonarCloud') {
              script {
                def scannerHome = tool 'SonarScanner'
                bat "${scannerHome}\\bin\\sonar-scanner"
              }
            }
        }
      } 

    stage('Security Scan') {
      parallel {
        stage('Snyk') {
          steps {
            dir("${BACKEND_DIR}") {
              withCredentials([string(credentialsId: 'snyk-token', variable: 'SNYK_TOKEN')]) {
                withEnv(["SNYK_TOKEN=${SNYK_TOKEN}"]) {
                  // Install Snyk CLI
                  bat 'npm install -g snyk'
                  // Run Snyk scan (ignore errors so pipeline continues)
                  bat 'snyk test --severity-threshold=high || exit /b 0'
                }
              }
            }
          }
        }

          stage('Trivy (image scan)') {
              when {
                expression { isUnix() }   // only run on Linux
              }
              steps {
                sh '''
                  trivy image --severity HIGH,CRITICAL --exit-code 1 ${DOCKER_IMAGE} || true
                '''
              }
            }
      }
    }

    stage('Deploy to Staging') {
      steps {
        // Print working directory and list files
        bat 'cd'
        bat 'dir'

        // Deploy using docker-compose (assuming Docker Desktop + docker-compose installed)
        bat '''
          cd infra
          docker-compose up -d --build
        '''
      }
    }

    stage('Release to Production') {
      when {
        branch 'main'
      }
      steps {
        script {
          // Example: push tag and run deployment script (placeholder)
          bat "git tag -a v${env.BUILD_NUMBER} -m 'release ${env.BUILD_NUMBER}' || true"
          bat "git push origin --tags || true"
          // Production deploy commands (e.g., eb deploy or heroku git push) go here
          echo "Production deployment step: manual or automated with cloud provider CLI"
        }
      }
    }

    stage('Monitoring & Alerting') {
      steps {
          echo "Checking /health endpoint..."
          bat '''
          @echo off
          setlocal enabledelayedexpansion

          set URL=http://localhost:3000/health
          set RETRIES=12
          set DELAY=5
          set COUNT=0

          :CHECK_HEALTH
          curl -f !URL! >nul 2>&1
                if !errorlevel! neq 0 (
                    set /a COUNT+=1
                    if !COUNT! leq !RETRIES! (
                        echo Health check failed, retrying in !DELAY! seconds... (!COUNT!/!RETRIES!)
                        timeout /t !DELAY! >nul
                        goto CHECK_HEALTH
                    ) else (
                        echo Health check failed after !RETRIES! attempts.
                        echo Sending alert to Datadog...
                        curl -X POST "https://api.datadoghq.com/api/v1/events?api_key=%DATADOG_API_KEY%" ^
                        -H "Content-Type: application/json" ^
                        -d "{\"title\":\"Production Alert: Health Check Failed\",\"text\":\"The application health check at %URL% failed.\",\"priority\":\"normal\",\"tags\":[\"jenkins\",\"healthcheck\"]}"
                        
                        echo Health check failed! Please check the application.
                        exit /b 1
                    )
                )
          echo Health check passed!
          '''
      }
    }

  }

  post {
    always {
      echo "Collecting artifacts and cleaning up..."
      archiveArtifacts artifacts: 'backend/**/*.log', allowEmptyArchive: true
    }
    failure {
      mail to: 'irosi.peiris@gmail.com', subject: "Build ${env.BUILD_NUMBER} failed", body: "See Jenkins."
    }
  }
}
