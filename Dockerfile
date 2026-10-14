# Runtime image: Java 17 JRE only (no JDK, no Maven), smaller and safer
FROM eclipse-temurin:17-jre

WORKDIR /app

# The executable jar built by "mvn package" (ARTIFACT CONSTRUCTION stage)
COPY target/*.jar app.jar

# Port configured in application.properties (server.port=8082)
# Inside the container. EXPOSE 8082 describes the port the application listens on inside the container. It comes from server.port=8082 in application.properties.
# EXPOSE opens nothing on the host. It's mostly documentation: "this image listens on 8082".

# The host port is chosen at docker run time
EXPOSE 8082

ENTRYPOINT ["java", "-jar", "app.jar"]
