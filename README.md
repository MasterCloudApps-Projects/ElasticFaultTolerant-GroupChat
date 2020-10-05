# Elastic & FaultTolerant GroupChat Application

1. [ Introduction ](#intro)
2. [ Application description ](#appdesc)
3. [ Messages ](#messages)
4. [ Deploy full Chat Application instance](#deploy)
5. [ Testing the Enviroment and Application ](#testing)
    1. [ Chaos testing with Litmus and Okteto ](#caostesting)


<a name="intro"></a>
## 1. Introduction

This repo contains all the necesary code for deploy an elastic, faultTolerant chat application. 
The app is based on [Vert.x](https://vertx.io/) Framework. Vert.x is an open source, reactive  software development toolkit from the developers of Eclipse.

Reactive programming is a programming paradigm, associated with asynchronous streams, which respond to any changes or events. Vert.x uses an event bus, to communicate with different parts of the application and passes events, asynchronously to handlers when they available.

The code is distributed in the following folders:

* [EFTGCA-VertxBackend](EFTGCA-VertxBackend): Elastic & FaultTolerant GroupChat Application based on Vert.x framework.

* [EFTGCA-MessagesLib](EFTGCA-MessagesLib): Javascript library to manage messages.

* [EFTGCA-VertxAppTests](EFTGCA-VertxAppTests): Javascript scripts used for vert.x app testing.

* [EFTGCA-Front](EFTGCA-Front): Angular frontend app example.

<a name="appdesc"></a>
## 2. Application description

The basic schema of the app is:

![startpoint](./Documentation/images/startPoint.png)

We have an horizontal scalable group of pods with our chat app. Our server and client verticles share a vert.x event bus, and are managed inside a vert.x hazelcast cluster. 
The entry point is a load balancer that distribute the traffic over the available nodes.

<a name="messages"></a>
## 3. Messages

* ### Messages - Join user and send Message Sequence Diagram:

```plantuml
@startuml

actor "User 1"
actor "User 2"
participant "Server Websocket \n(Server Verticle)"
participant "Server Websocket \n(Client Verticle)"
participant "EventBus"
database "messages MongoDB"

"User 1" -> "Server Websocket \n(Server Verticle)" : register Request
"Server Websocket \n(Server Verticle)" -> "Server Websocket \n(Client Verticle)" : newClient
"Server Websocket \n(Client Verticle)" -> "EventBus" : suscribe
"EventBus" -> "Server Websocket \n(Client Verticle)" : suscribed
"Server Websocket \n(Client Verticle)" -> "Server Websocket \n(Server Verticle)" : client created


"User 1" <-- "Server Websocket \n(Server Verticle)" : registered Response
"User 1" -> "Server Websocket \n(Server Verticle)" : send Message
"Server Websocket \n(Server Verticle)" -> "EventBus" : publish message

"Server Websocket \n(Server Verticle)" -> "messages MongoDB" : store message into DB

"EventBus" -> "Server Websocket \n(Client Verticle)" : read message
"Server Websocket \n(Client Verticle)" -> "User 2" : read message

@enduml
```

* ### Messages with error & retry sequence diagram:

```plantuml
@startuml

actor "User 1"

participant "Server Websocket \n(Server Verticle)"
participant "Server Websocket \n(Client Verticle)"
participant "EventBus"
database "messages MongoDB"

"User 1" -> "Server Websocket \n(Server Verticle)" : send Message A
"Server Websocket \n(Server Verticle)" -> "EventBus" : publish message A
"Server Websocket \n(Server Verticle)" -> "messages MongoDB" : store message A into DB

"User 1" ->x "Server Websocket \n(Server Verticle)" : send Message B
"User 1" -> "Server Websocket \n(Server Verticle)" : send Message C and retry Message B

"Server Websocket \n(Server Verticle)" -> "EventBus" : publish messages (B & C)
"Server Websocket \n(Server Verticle)" -> "messages MongoDB" : store messages (B & C) into DB

"User 1" <-- "EventBus" : message A ACK 
"User 1" <-- "EventBus" : message B ACK 

@enduml
```

* ### Messages with error & retry sequence diagram:

```plantuml
@startuml

actor "User 1"
participant "Server 1 Websocket \n(Server Verticle)"
participant "Server 1 Websocket \n(Client Verticle)"
participant "EventBus"

== Fisrt user connection ==

"User 1" -> "Server 1 Websocket \n(Server Verticle)" : register Request
"Server 1 Websocket \n(Server Verticle)" -> "Server 1 Websocket \n(Client Verticle)" : newClient
"Server 1 Websocket \n(Client Verticle)" -> "EventBus" : suscribe
"EventBus" -> "Server 1 Websocket \n(Client Verticle)" : suscribed
"Server 1 Websocket \n(Client Verticle)" -> "Server 1 Websocket \n(Server Verticle)" : client created
"User 1" <-- "Server 1 Websocket \n(Server Verticle)" : registered Response

... Some correct messages sent and received before server crash ...

== Reconnection ==

"User 1" <-- "Server 1 Websocket \n(Server Verticle)" : <font color=red><b>Reconnect Request (Server 1  is going to dead)

"User 1" -> "Server 2 Websocket \n(Server Verticle)" : reconnect Request
"Server 2 Websocket \n(Server Verticle)" -> "Server 2 Websocket \n(Client Verticle)" : reconnectClient
"Server 2 Websocket \n(Client Verticle)" -> "EventBus" : reconnect
"EventBus" -> "Server 2 Websocket \n(Client Verticle)" : reconnected
"Server 2 Websocket \n(Client Verticle)" -> "Server 2 Websocket \n(Server Verticle)" : client reconnected
"User 1" <-- "Server 2 Websocket \n(Server Verticle)" : reconnect Response

@enduml
```

<a name="testing"></a>
## 4. Testing the Enviroment and Application

<a name="caostesting"></a>
### 4.1 Chaos testing with Litmus and Okteto

You can see more detalis [here](./Documentation/ChaosTestingOkteto.md)
