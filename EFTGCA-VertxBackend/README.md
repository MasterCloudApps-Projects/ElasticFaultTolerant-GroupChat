# Elastic & FaultTolerant GroupChat Application - Vert.x based Application


## Building and publish the image into DockerHub registry

* Build the image:

    ```
    > docker build -t mscarceller/eftgca-backvertx:1.0.0 .
    ```

* Push the image to Dockerhub

    ```
    > docker push mscarceller/eftgca-backvertx:1.0.0
    ```

---

## Packaging the application for use locally as .jar file

* Package the application:

    ```
    > mvn clean package
    ```

    or

    ```
    > mvn clean install
    ```

---
## Running the application

* Run the application:

    ```
    > mvn exec:java
    ```

* Deploy local Kubernetes: Inside k8s folder type next command

    ```
    > kubectl apply -f ./backend_k8s.yaml 
    ```

* Deploy a single local cluster vert.x:

    ```
    > java -jar target/mca-webchat-vertx-fat.jar -cluster -cp /cluster/
    ```

---








