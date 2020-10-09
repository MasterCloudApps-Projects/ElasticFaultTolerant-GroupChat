# Elastic & FaultTolerant GroupChat Application

1. [ Introduction ](#intro)

2. [ Application description ](#appdesc)

3. [ Messages ](#messages)

4. [ Deploy Application ](#deploy)
    1. [ Deploy on local Kubernetes ](#deployk8s)
    2. [ Deploy on Okteto Cloud ](#deployOkteto)
   
6. [ Testing the Enviroment and Application ](#testing)
   
    1. [ Chaos testing with Litmus and Okteto ](#caostesting)
   
7. [ Appendix 1: Refererences ](#references)

<a name="intro"></a>

## 1. Introduction

This repository contains all the necessary code for deploy an elastic, fault Tolerant chat application. 
The application is based on [Vert.x](https://vertx.io/) Framework. Vert.x is an open source, reactive  software development toolkit from the developers of Eclipse.

Reactive programming is a programming paradigm, associated with asynchronous streams, which respond to any changes or events. Vert.x uses an event bus, to communicate with different parts of the application and passes events, asynchronously to handlers when they available.

The code is distributed in the following folders:

* [EFTGCA-VertxBackend](EFTGCA-VertxBackend): Elastic & FaultTolerant GroupChat Application based on Vert.x framework.

* [EFTGCA-MessagesLib](EFTGCA-MessagesLib): JavaScript library to manage messages.

* [EFTGCA-VertxAppTests](EFTGCA-VertxAppTests): JavaScript scripts used for vert.x app testing.

* [EFTGCA-Front](EFTGCA-Front): Angular front end application example.

<a name="appdesc"></a>

## 2. Application description

The basic schema of the app is:

![startpoint](./Documentation/images/startPoint.png)

We have an horizontal scalable group of pods with our chat app. Our server and client verticles share a vert.x event bus, and are managed inside a vert.x hazelcast cluster. 
The entry point is a load balancer that distribute the traffic over the available nodes.



- ##### Scalability

The scalability is based on ***Horizontal Pod Autoscaler*** that automatically scales the number of Pods in the application deployment, based on observed CPU utilization or on some other, application-provided metrics. The HPA is implemented as a control loop, and, during each period, the controller manager queries the resource utilization against the metrics specified in each *HorizontalPodAutoscaler* definition.

For example, in our case we have defined:

```yaml
apiVersion: autoscaling/v2beta1
kind: HorizontalPodAutoscaler
metadata:
  name: webchat-consumer
  namespace: mscarceller
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: webchatbackend
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      targetAverageUtilization: 10
```

The HPA  fetches metrics from a series of aggregated APIs (`metrics.k8s.io`, `custom.metrics.k8s.io`, and `external.metrics.k8s.io`). The `metrics.k8s.io` API is usually provided by metrics-server, which needs to be launched separately. We explain how to install and launch it on the deploy section of this document.

You can see [Horizontal Pod Autoscaler](hhttps://kubernetes.io/docs/tasks/run-application/horizontal-pod-autoscale/) for more details.



<a name="messages"></a>

## 3. Messages

* ### JoinRoom sequence diagram:

<p align="center">
  <img width="400" src=./Documentation/images/uml_joinRoom.png>
</p>

* ### Text Message sequence diagram:

<p align="center">
  <img width="560" src=./Documentation/images/uml_sendTextMessage.png>
</p>

* ### Error & Retry sequence diagram:

<p align="center">
  <img width="560" src=./Documentation/images/uml_retryTextMessage.png>
</p>

* ### Reconnection sequence diagram:

<p align="center">
  <img width="680" src=./Documentation/images/uml_reconnect.png>
</p>

<a name="deploy"></a>
## 4. Deploy Application

The application is ready to be deployed. I'm going to explain how to do it  in two different ways:

- Local kubernetes cluster, based on Minikube.

- Oketo Cloud, that gives us Kubernetes namespaces to code, build, and run Kubernetes applications entirely in the cloud.

  

### 4.1 Deploy on local Kubernetes

* ####  Setting up Kubernetes with Minikube

First of all you need is a Kubernetes cluster available on your computer. In this tutorial we're going to use Minikube on Ubuntu. You can find how to install it in this link https://kubernetes.io/docs/tasks/tools/install-minikube/

Once you have minikube installed on you computer start it and check its status:

```shell
> minikube start
```

The output is similar to this:

```shell
minikube v1.11.0 en Ubuntu 18.04
Using the docker driver based on existing profile
Starting control plane node minikube in cluster minikube
Restarting existing docker container for "minikube" ...
Setting up Kubernetes v1.18.3 en Docker 19.03.2...
kubeadm.pod-network-cidr=10.244.0.0/16
Verifying Kubernetes components...
Enabled addons: dashboard, default-storageclass,
```

Then you can check minikube status:

```shell
> minikube status
```

#### Enable Minikube addons

The scalability/elasticity of the application , as mentioned in previous sections, is based on HPA, so you'll need to enable the metric server addon in order get the HPA running. 

```shell
minikube addons enable metrics-server
```

```
metrics-server was successfully enabled
```

### 4.2 Deploy on Okteto Cloud


<a name="testing"></a>
## 5. Testing the Enviroment and Application

<a name="caostesting"></a>
### 5.1 Chaos testing with Litmus and Okteto

You can see more detalis [here](./Documentation/ChaosTestingOkteto.md)





## 6. Appendix 1: References



- Horizontal Pod Autoscaler: https://kubernetes.io/docs/tasks/run-application/horizontal-pod-autoscale-walkthrough/