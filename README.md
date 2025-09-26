# Task Manager App

## Overview
Simple task manager REST API (Node.js/Express) with JWT auth and PostgreSQL.

## Run locally (dev)
1. Copy infra/.env.example to infra/.env and edit if needed.
2. Start docker compose:
  cd infra
  docker-compose up --build
3. Backend will be available at http://localhost:3000

## Tests
  cd backend
  npm ci
  npm test

  
## CI/CD with Jenkins
- Jenkinsfile demonstrates build/test/sonar/snyk/trivy/deploy stages.
- Add credentials in Jenkins: dockerhub-creds, sonar-token, snyk-token.

## SonarQube
Configure SonarQube server and token then run scanner with provided sonar-project.properties.
