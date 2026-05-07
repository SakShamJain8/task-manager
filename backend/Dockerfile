FROM maven:3.9.9-eclipse-temurin-17 AS build
WORKDIR /workspace

COPY pom.xml .
COPY src ./src

RUN mvn -DskipTests package
RUN JAR_FILE=$(find target -maxdepth 1 -name '*.jar' ! -name '*.jar.original' | head -n 1) && cp "$JAR_FILE" /workspace/app.jar

FROM eclipse-temurin:17-jre-jammy
WORKDIR /app

COPY --from=build /workspace/app.jar /app/app.jar

ENV PORT=8080

EXPOSE 8080

ENTRYPOINT ["sh", "-c", "java -jar /app/app.jar"]