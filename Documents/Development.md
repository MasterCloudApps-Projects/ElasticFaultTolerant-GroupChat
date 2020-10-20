# Development



1. [Backend](#backend)
2. [Message Library](#messagelib)
3. [Testing the backend](#testing)
4. [Angular frontend application](#front)
5. [CI/CD with GitHub Actions](#actions)



---

<a name="backend"></a>

## 1. Backend

Please, visit the [Elastic & FaultTolerant GroupChat Application - Vert.x based Application](../EFTGCA-VertxBackend/README.md) project.



---

<a name="messagelib"></a>

## 2. Message Library

Please, visit the [Elastic & FaultTolerant GroupChat Application Messages Lib](../EFTGCA-MessagesLib/README.md) project.



---

<a name="testing"></a>

## 3. Testing the backend

Please, visit the [Chaos Testing with Litmus and Okteto Cloud](https://github.com/MasterCloudApps-Projects/ElasticFaultTolerant-GroupChat/blob/master/Documents/ChaosTestingOkteto.md) document.

You can find some test examples of testing scripts in the [EFTGCA-VertxAppTests](https://github.com/MasterCloudApps-Projects/ElasticFaultTolerant-GroupChat/tree/master/EFTGCA-VertxAppTests) project.



---

<a name="front"></a>

## 4. Angular frontend application

Please, visit the [Angular Frontend example for Elastic & FaultTolerant GroupChat Application](../EFTGCA-Front/README.md) project.



---

<a name="actions"></a>

## 5. CI/CD with GitHub Actions

The repository include 4 Github Actions:

- Action to publish front angular example application into DockerHub: ([dockerhub-publish-angular-frontapp.yml](https://github.com/MasterCloudApps-Projects/ElasticFaultTolerant-GroupChat/blob/master/.github/workflows/dockerhub-publish-angular-frontapp.yml))

  This is launched when a change is pushed to master branch inside front app project folder. It build and publish an image of the example angular front application.

  

- Action to publish backend application into DockerHub:   [dockerhub-publish-backend-vertx.yml](https://github.com/MasterCloudApps-Projects/ElasticFaultTolerant-GroupChat/blob/master/.github/workflows/dockerhub-publish-backend-vertx.yml)

  This is launched when a change is pushed to master branch inside backend vertx project folder. It build and publish an image.

  

- Action to publish the messages library into NPM registry:  [npmregistry-publish-messages-lib.yml](https://github.com/MasterCloudApps-Projects/ElasticFaultTolerant-GroupChat/blob/master/.github/workflows/npmregistry-publish-messages-lib.yml)

  This is launched when a change is pushed to master branch inside the messages lib project folder. It build and push an image to the NPM registry.

  

- Action to publish a full application into Okteto Cloud: [okteto-deploy-full-app.yml](https://github.com/MasterCloudApps-Projects/ElasticFaultTolerant-GroupChat/blob/master/.github/workflows/okteto-deploy-full-app.yml)

  This is launched when a change is pushed to master branch. It deploy a full application instance, including back and front example into a OktetoCloud account.



For more info about GitHub Actions visit this [link](https://docs.github.com/es/free-pro-team@latest/actions)

