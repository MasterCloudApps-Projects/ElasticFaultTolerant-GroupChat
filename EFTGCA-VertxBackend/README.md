# Elastic & FaultTolerant GroupChat Application - Vert.x based Application


## Building and publish the image into DockerHub registry

* Build the image:

    ```
    > docker build -t mscarceller/webchat:1.0.0 .
    ```

* Push the image to dockerhub

    ```
    > docker push mscarceller/webchat:1.0.0
    ```

---

## Packaging the app for use locally as .jar file

* Package the application:

    ```
    > mvn clean package
    ```

    or

    ```
    > mvn clean install
    ```

---
## Running the app

* Run the application:

    ```
    > mvn exec:java
    ```

* Deploy local kubernetes:

    ```
    > kubectl apply -f k8s.yaml
    ```

* Deploy local cluster vert.x:

    ```
    > java -jar target/mca-webchat-vertx-fat.jar -cluster -cp /cluster/
    ```

---

## Kubernetes Command help

* linux: 

    * Open Dashboard:

        ```
         > kubectl apply -f https://raw.githubusercontent.com/kubernetes/dashboard/v2.0.0/aio/deploy/recommended.yaml 
        ```
    * Monitoring resources:

        ```
        > watch -n 1 kubectl get pods,services,deployments,ingress 
        ```

* windows: 

    * Install Dashboard:

        ```
       >  kubectl apply -f https://raw.githubusercontent.com/kubernetes/dashboard/v2.0.0/aio/deploy/recommended.yaml
        ```
    * Show secret token to login into dashboard:

        ```
        > kubectl -n kubernetes-dashboard describe secret $(kubectl -n kubernetes-dashboard get secret | sls admin-user | ForEach-Object { $_ -Split '\s+' } | Select -First 1)
        ```

    * Open Dashboard:

        ```
        > kubectl proxy
        ```
        Show dashboard in this url:
        
        http://localhost:8001/api/v1/namespaces/kubernetes-dashboard/services/https:kubernetes-dashboard:/proxy/
    








