# Project Guidelines

## Project Overview
This is a Ktor-based web application project created using the [Ktor Project Generator](https://start.ktor.io). The project implements a web server with basic routing capabilities and provides a foundation for building web applications using Kotlin and Ktor framework.

## Development Resources
For development reference and support, the following resources are available:
- Official Documentation: [Ktor Documentation](https://ktor.io/docs/home.html)
- Source Code: [Ktor GitHub page](https://github.com/ktorio/ktor)
- Community Support: [Ktor Slack chat](https://app.slack.com/client/T09229ZC6/C0A974TJ9) (requires [invitation](https://surveys.jetbrains.com/s3/kotlin-slack-sign-up))

## Technical Features
The project currently includes the following core features:
- **Routing**: Implements structured route definitions and associated handlers for HTTP endpoints

## Development Guidelines

### Building and Testing
The project uses Gradle as the build system. Here are the key development commands:

1. Testing:
   ```
   ./gradlew test
   ```

2. Building:
   ```
   ./gradlew build
   ```

### Deployment Guidelines

#### Local Development
- For local development, use:
  ```
  ./gradlew run
  ```
  The server will start at `http://0.0.0.0:8080`

#### Docker Deployment
1. Build the application:
   ```
   ./gradlew buildFatJar
   ```

2. Build and manage Docker image:
   - Build image: `./gradlew buildImage`
   - Publish locally: `./gradlew publishImageToLocalRegistry`
   - Run with Docker: `./gradlew runDocker`

## Success Criteria
A successful server start is indicated by log messages similar to:
```
2024-12-04 14:32:45.584 [main] INFO  Application - Application started in 0.303 seconds.
2024-12-04 14:32:45.682 [main] INFO  Application - Responding at http://0.0.0.0:8080
```