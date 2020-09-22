# Elastic & FaultTolerant GroupChat Application Messages Lib (v0.2)

Javascript module to manage messages between frontend apps and chat server. 


## Messages

* Requests and Messages sent by clients (users) must be a JSON object with these properties:

    * jsonrpc: version of JSON-RPC protocol. Always "2.0"
    * method: the name of the method
    * params: a JSON object with the method parameters
    * id: an unique identifier of the message

* Responses from server to each client message or request are also a JSON object with these properties:

    * jsonrpc: version of JSON-RPC protocol. Always "2.0"
    * result: a JSON object with the operation result. (not included if error property is defined)
    * error: a JSON object with information about an error (not included if result property is defined). This JSON object has 2 properties:
        * code: a number identifying the type of error
        * message: a string with a description about the error
    * id: an integer matching the id property of the operation call that generated this response. 

* System/Server Notifications, are like Request objects without an "id" member.

    * jsonrpc: version of JSON-RPC protocol. Always "2.0"
    * method: the name of the method
    * params: a JSON object with the method parameters

Form more info about JSON-RPC 2.0 Specification visit:

https://www.jsonrpc.org/specification


### Available Messages:

* **joinRoom**: an user want to join into a chat room:

  Client Request

  ```json
  {
    "jsonrpc": "2.0",
    "method": "joinRoom",
    "params": {
      "userName": "User 1",
      "roomName": "Room 1",
    },
    "id": 1
  }
  ```

  Server Response

  ```json
  {
    "jsonrpc": "2.0",
    "result": {
      "status": "Ok",
      "message": "You have joined as User 1",
      "sessionId": "8475234jh62380672306"
      },
    "id": 1
  }
  ```

  Server Error

  ```json
  {
    "jsonrpc": "2.0",
    "error": {
      "code": "-32001",
      "message": "User exists (or anything else)",
      },
    "id": 1
  }
  ```

* **Reconnect**: an user want to reconnect due to websocket fail:

  Client Request

  ```json
  {
    "jsonrpc": "2.0",
    "method": "reconnect",
    "params": {
      "userName": "User 1",
      "roomName": "Room 1",
      "sessionId": "8475234jh62380672306",
    },
    "id": 1
  }
  ```

  Server Response

  ```json
  {
    "jsonrpc": "2.0",
    "result": {
      "status": "Ok",
      "message": "You have reconnect successfully",
      "sessionId": "8475234jh62356580672306",
      },
    "id": 1
  }
  ```

  Server Error

  ```json
  {
    "jsonrpc": "2.0",
    "error": {
      "status": "-32003",
      "message": "Reconnection fail!",
      },
    "id": 1
  }
  ```

* **Text message**: user want to send a text message:

  Client Message

  ```json
  {
    "jsonrpc": "2.0",
    "method": "textMessage",
    "params": {
      "room": "Room 1",
      "user": "User 1",
      "text": "This is the message text content",
      "ack": false,
      "uuid": "8475234jh62356580672306",
      "date": "01/01/2020 10:12:32"
    },
    "id": 2
  }
  ```

  Server Response

  ```json
  {
    "jsonrpc": "2.0",
    "result": {
      "status": "OK",
      },
    "id": 2
  }
  ```

* **System/Server Message**: the server send system messages to a user also to be shown on the chat

  Server Notification example

  ```json
  {
    "jsonrpc": "2.0",
    "method": "notify",
    "params": {
      "type": "newUser",
      "text": "User 1 has joined the room!"
      }
  }
  ```

* **Server reconnect Request**: the server warn their clients that the socket is going to close, request the to reconnect to other server.

  Server Notification

  ```json
  {
    "jsonrpc": "2.0",
    "method": "notify",
    "params": {
      "type": "reconnect",
      "text": "Socket is going to close, please reconnect"
    }
  }
  ```
