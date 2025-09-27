pipeline {
  agent any

  environment {
    DOCKER_IMAGE = "irosithamasha/task-manager-app:${env.BUILD_NUMBER}"
    BACKEND_DIR = "backend"
    SONAR_HOST = credentials('sonar-host') // in Jenkins: secret text or username/password
    SONAR_TOKEN = credentials('sonar-token') // token credential in jenkins
    SNYK_TOKEN = credentials('snyk-token') // optional
  }

  stages {

    stage('Checkout') {
      steps {
        checkout scm
      }
    }

    // stage('Build') {
    //   steps {
    //     dir("${BACKEND_DIR}") {
    //       bat 'npm ci'
    //       // create a Docker image artifact
    //       bat "docker build -t ${DOCKER_IMAGE} ."
    //       script {
    //         // optionally push to Docker Hub if credentials available
    //         withCredentials([usernamePassword(credentialsId: 'dockerhub-creds', usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
    //           bat 'echo $DOCKER_PASS | docker login -u $DOCKER_USER --password-stdin'
    //           bat "docker push ${DOCKER_IMAGE}"
    //         }
    //       }
    //     }
    //   }
    // }

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
            // Ensure old containers are down
            bat 'docker-compose -f infra/docker-compose.yml down'

            // Build backend image fresh (node_modules installed inside container)
            bat 'docker-compose -f infra/docker-compose.yml build backend'

            // Start Postgres database
            bat 'docker-compose -f infra/docker-compose.yml up -d db'

            // Wait until Postgres is ready (poll every 2s, max 30s)
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

            // Run tests inside backend container
            bat 'docker-compose -f infra/docker-compose.yml run --rm backend npm test'

            // Stop all containers after tests
            bat 'docker-compose -f infra/docker-compose.yml down'
        }
    }
}
    stage('Code Quality (SonarQube)') {
      steps {
        dir("${BACKEND_DIR}") {
          withEnv(["SONAR_HOST_URL=${SONAR_HOST}", "SONAR_TOKEN=${SONAR_TOKEN}"]) {
            bat '''
              # install sonar-scanner if needed
              if ! command -v sonar-scanner >/dev/null 2>&1; then
                apk add --no-cache curl && \
                mkdir -p /tmp/sonar && \
                curl -sSLo /tmp/sonar/sonar-scanner-cli.zip https://binaries.sonarsource.com/Distribution/sonar-scanner-cli/sonar-scanner-cli-4.7.0.2747-linux.zip && \
                unzip /tmp/sonar/sonar-scanner-cli.zip -d /tmp/sonar && \
                ln -s /tmp/sonar/sonar-scanner-*/bin/sonar-scanner /usr/local/bin/sonar-scanner
              fi
              sonar-scanner -Dsonar.login=${SONAR_TOKEN} -Dsonar.host.url=${SONAR_HOST}
            '''
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
                bat 'npm install -g snyk || true'
                bat 'snyk auth $SNYK_TOKEN || true'
                // test repo
                bat 'snyk test --severity-threshold=high || true'
              }
            }
          }
        }
        stage('Trivy (image scan)') {
          steps {
            bat 'mkdir -p /tmp/trivy'
            // install trivy if missing
            bat '''
              if ! command -v trivy >/dev/null 2>&1; then
                wget https://github.com/aquasecurity/trivy/releases/latest/download/trivy_$(uname -s)_$(uname -m).tar.gz -O /tmp/trivy/trivy.tar.gz
                tar zxvf /tmp/trivy/trivy.tar.gz -C /tmp/trivy
                mv /tmp/trivy/trivy /usr/local/bin/
              fi
            '''
            bat "trivy image --severity HIGH,CRITICAL --exit-code 1 ${DOCKER_IMAGE} || true"
          }
        }
      }
    }

    stage('Deploy to Staging') {
      steps {
        bat 'pwd; ls -la'
        // Deploy using docker-compose on a staging host (assuming Jenkins agent has docker)
        bat '''
          # bring up infra
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
        echo "Ensure /health and /ready endpoints are reachable and configure Prometheus/Grafana."
        // Optionally run a quick smoke check against health endpoint
        bat 'sleep 5'
        bat 'curl -f http://localhost:3000/health || echo "Health check failed"'
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
