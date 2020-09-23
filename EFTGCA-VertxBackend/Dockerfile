FROM maven:3.6.3-jdk-8 as builder
COPY . /project/
WORKDIR /project
RUN mvn -f pom.xml clean package -B -DskipTests=true

FROM openjdk:8
RUN apt-get update; apt-get install -y netcat
COPY --from=builder /project/target/*.jar /project/
COPY cluster/cluster.xml /cluster/
WORKDIR /project
EXPOSE 8080 8081
CMD ["java", "-jar", "mca-webchat-vertx-fat.jar", "-cluster","-cp","/cluster/"]