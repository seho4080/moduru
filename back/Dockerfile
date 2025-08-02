# Java 17 기반 이미지 사용
FROM eclipse-temurin:17-jdk

# 앱 실행 디렉토리 설정
WORKDIR /app

# 빌드된 jar 파일 복사 (파일명은 실제 jar 파일명으로 바꿔주세요)
COPY build/libs/tripwish-0.0.1-SNAPSHOT.jar app.jar
COPY ./src/main/resources/application.properties /app/application.properties
# 컨테이너 포트 오픈
EXPOSE 8080

# Spring Boot 앱 실행

ENTRYPOINT ["java", "-jar", "app.jar", "--spring.config.location=file:/app/application.properties"]