<div>
<div style="float:left">
<img align="left" src=".\Documents\images\LogoCodeURJC.png" style=";text-align:left" width="120" />
</div>
<div style="float:right">
<img align="right" src=".\Documents\images\LogoMCA.png" style="text-align:left" width="150" />
</div>
</div>
<div style="clear:both"></div>

# &nbsp;  

# Elastic & Fault Tolerant GroupChat Application


1. [ Introduction ](#intro)
2. [ Getting Started ](#gettingstarted) 
3. [ Development ](#develop)

<a name="intro"></a>

## **1. Introduction**

This repository contains all the necessary code for deploy an elastic and fault tolerant chat application. These are the basis and the two principal characteristics of the application. 

The application offers the possibility of exchanging messages between several users inside a room. Basically the users can log into a chat room, send and receive text messages.

The client try to connect to a websocket exposed by our backend and, when the connection is established, the user can join a room and start chatting with the other users in room.

The code is distributed in the following folders:

* [EFTGCA-VertxBackend](EFTGCA-VertxBackend): Elastic & Fault Tolerant GroupChat Application based on Vert.x framework.

* [EFTGCA-MessagesLib](EFTGCA-MessagesLib): JavaScript library to manage messages.

* [EFTGCA-VertxAppTests](EFTGCA-VertxAppTests): JavaScript scripts used for Vert.x backend testing.

* [EFTGCA-Front](EFTGCA-Front): Angular front end example.





[Here](./Documents/finalreport/MemoriaTFM.pdf) you can also download the project final report.

And show some video demos:

* Demo 1: local deployment with minukube - https://www.youtube.com/watch?v=bNY3aOUXAGs
* Demo 2: cloud deployment with Okteto - https://www.youtube.com/watch?v=aDVbC28yOyI


------



- #### Based on Kubernetes:

The application has been developed to be deploy and run inside Kubernetes clusters. Kubernetes is a compute platform for the automated deployment, scaling, and management of containerized applications across any infrastructure.

The backend  is based on [Vert.x](https://vertx.io/) Framework, an open source, reactive software development toolkit from the developers of Eclipse. Reactive programming is a programming paradigm, associated with asynchronous streams, which respond to any changes or events. Vert.x uses an event bus, to communicate with different parts of the backend  and passes events, asynchronously to handlers when they available.

The basic schema is:

![](./Documents/images/startPoint.png)

We have an horizontal scalable group of pods with our chat backend. Our server and client Verticles share a Vert.x event bus, and are managed inside a Vert.x Hazelcast cluster. 

The entry point is a load balancer that distribute the traffic over the available nodes.

- #### Persistence

All the messages sent to the server are persisted into a MongoDB. MongoDB provides high availability with replica sets.

​		When a new user join into a room the server could sent it the last messages received in this room.

​		When an user reconnect to the backend, after a disconnected period, the server send to it the last messages received from other users (see next section: fault-tolerance).

The files sent to the server are stored in a Persistent Volume, in order to be available for all the nodes.

There are currently two types of storage available with Kubernetes: Volumes and Persistent Volumes. A Kubernetes volume exists only while the containing pod exists. Once the pod is deleted, the associated volume is also deleted. On the other hand, Kubernetes persistent volumes remain available outside of the pod lifecycle – this means that the volume will remain even after the pod is deleted. It is available to claim by another pod if required, and the data is retained.

So we use Kubernetes persistent volumes because the data needs to be retained regardless of the pod lifecycle. 




- #### Elasticity:

**Elasticity** is the ability to grow or shrink infrastructure resources dynamically as needed to adapt to workload changes in order to  maximizing the use of resources. 

Because our code is deployed on Kubernetes we have the ability to adapt our resources by using the ***Horizontal Pod Autoescaler*** (shortened to HPA), that automatically scales the number of Pods in the backend deployment, based on observed CPU utilization or on some other backend-provided metrics. The HPA is implemented as a control loop, and, during each period, the controller manager queries the resource utilization against the metrics specified in each **HorizontalPodAutoscaler** definition.

<img src=".\Documents\images\elasticity.png" style="zoom:60%;text-align:left" />

The HPA fetches metrics from a series of aggregated APIs (`metrics.k8s.io`, `custom.metrics.k8s.io`, and `external.metrics.k8s.io`). The `metrics.k8s.io` API is usually provided by metrics-server, which needs to be launched separately. We explain how to install and launch it on the deploy section of this document.

As many resources are needed the system deploy new nodes with the backend implementation, and, when the load decrease, the system release this resources.

On the other hand, when the load over the backend decrease and fewer resources/pods are required the HPA starts a downscale process. In order to guaranty a gracefully disconnection for the users the HPA is configured with its termination grace period to 60 seconds. By this way the Pod's phase will be `Terminating` and remain there until the Pod is killed after its `terminationGracePeriodSeconds` expires. It able the backend to warn users connected on this pod.

Kubernetes waits this time before shutdown and release the pod, and during this time backend notify the users and request them to reconnect. When users receive this notification they must send a reconnect message in order to be connected to a new container. Here the load balancer send the user traffic to a different pod, never to the pod that is shutting down.

But, How the backend noticed that the pod its running inside is being killed? The answer is **the hooks**.

The hooks enable containers to be aware of events in their management lifecycle and run code implemented in a handler when the corresponding lifecycle hook is executed. In this case we need handle the **PreStop** hook. This hook is called immediately before a container is terminated. 



- For further understanding of these you could have a look: https://kubernetes.io/docs/concepts/containers/container-lifecycle-hooks/
- You can see [Horizontal Pod Autoscaler](hhttps://kubernetes.io/docs/tasks/run-application/horizontal-pod-autoscale/) for more details or visit the [ElasticFaultTolerant-GroupChat](https://github.com/MasterCloudApps-Projects/ElasticFaultTolerant-GroupChat) readme file for more details.
- For further information about hooks visit https://kubernetes.io/docs/concepts/containers/container-lifecycle-hooks/



- #### Fault Tolerant:

**Fault tolerance** is the property that enables the application to continue operating properly even if one or more of its components fail. Because Pods represent processes running on nodes in the cluster, our chat application in this case, it is important to allow those processes to gracefully terminate when they are no longer needed. As we saw in previous sections Kubernetes provides Containers with lifecycle hooks.

The most important in a chat is not to loose any message.

- In case of backend fails, for any reason, the client get an *onclose* event from the websocket, the messagesManager try to reconnect, and the request will be sent to an available backend node. 

- In case of network failure, the *onclose* event is also dispatched and the messagesManager try to reconnect periodically.

- In case of node scale-down, during the termination grace period the server will send a reconnection request to the client, and the messagesManager will try to reconnect. 

In all cases the messages library (see [Development](https://github.com/MasterCloudApps-Projects/ElasticFaultTolerant-GroupChat/blob/master/Documents/Development.md) document) is the one in charge of reconnection at client side and it'll try to reconnect  to the server sending a reconnection request. This reconnection request contains the id of the last message received in client, so the server will send the missed messages received by other users during the disconnected period.

All the messages sent during this disconnected period are stored and send to the server immediately at reconnection. 



You can find a full description of the backend in the [EFTGCA-VertxBackend](https://github.com/MasterCloudApps-Projects/ElasticFaultTolerant-GroupChat/tree/master/EFTGCA-VertxBackend) folder.

---



<a name="gettingstarted"></a>

## **2. Getting Started**

Please, visit the [Getting Started](./Documents/GettingStarted.md) document



---

<a name="develop"></a>

## 3. Development

Please, visit the [Development](https://github.com/MasterCloudApps-Projects/ElasticFaultTolerant-GroupChat/blob/master/Documents/Development.md) document.



