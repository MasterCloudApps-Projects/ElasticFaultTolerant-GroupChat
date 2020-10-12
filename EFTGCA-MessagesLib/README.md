# Elastic & FaultTolerant GroupChat Application Messages Lib

Javascript module to manage messages between frontend and test apps and chat server.
Originally design for the [Elastic & FaultTolerant GroupChat Application.](https://github.com/MasterCloudApps-Projects/ElasticFaultTolerant-GroupChat)

## Installation

  ```shell
    > npm i eftgca-messages
  ```

---

## Getting started: sample of usage:

Next example show how to use the library to send a *joinRoom* Message, and send/receive text messages form other users in room:

  ```javascript
    var ChatMessagesManager = require('eftgca-messages');

    const url = 'url_of_the_websocket';
    const TEST_USERID = "UserId";
    const TEST_USERNAME = "UserName";
    const TEST_ROOMNAME = "Tests Room";
  
    var chatMessagesManager = new ChatMessagesManager(url);
  
    // suscribe to textMessage event:
    chatMessagesManager.on('textMessage',(message) => {
      console.log(data.userName + " say: " + data.text)
    });

    // suscribe to new users notificacion event:
    chatMessagesManager.on('newUser',(message) => {
      console.log(message.text)
    });

    // suscribe to responses event:
    chatMessagesManager.on('response',(data) => {
      console.log("Response " + data.result + " to request number "+ data.id)
    });

    // suscribe to error event:
    chatMessagesManager.on('error',(error) => {
      console.log("Error (" + error.code + "): " + error.message)
    });

    //Join User into the chat room
    chatMessagesManager.joinUser(TEST_USERID, TEST_USERNAME, TEST_ROOMNAME);

	// send messages to the room
    chatMessagesManager.sendTextMessage(TEST_ROOMNAME, TEST_USERID, TEST_USERNAME, "Hello World!);
  
  ```

---



## Constructors:

  **ChatMessagesManager**(String url)

   Create an instance with a websocket url.

---



## Properties:

| Name   |      Type(Default)      |  Description |
|-----------|:----------:|:------|
| url       |     String      | The url where the server publish the websoket |
| webSocket |     WebSocket      |   The websocket created with the url |
| messageId | Int(1) |    Index for the messages sent |
| messages | Map() |    Map to store messasges in chat|
| serviceMessages | Map() |    Map to store service messasges |
| pendingMessages | Map() |    Map to store service messasges |


---


## Events:

The ChatMessagesManager emmit events:

| Event (String)  |      Data    |  Description |
|-----------|:----------|:------|
|EVENT_ERROR (error)|Error Message|Error ocurred|
|EVENT_RESPONSE (response)|Response|The response for a previous sent message, identified by id.|
|EVENT_ONCLOSE (closedConnection)|Close connection Notification|Notification for a closed connection.|
|EVENT_NEW_USER (newUser)|New user Notification|Notify  new user in room|
|EVENT_RECONNECT (reconnect)|Reconnect notification message|Reconnection notification|
|EVENT_TEXT_MESSAGE (textMessage)|Text Message|Notify new text message in room|

---



## Messages types and specs.

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

For more info about JSON-RPC 2.0 Specification visit:

https://www.jsonrpc.org/specification


### Available Messages:

* **joinRoom**: an user want to join into a chat room:

  Client Request

  ```json
  {
    "jsonrpc": "2.0",
    "method": "joinRoom",
    "params": {
      "userId": "xxxxxxxxxxxxx",
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
      "userId": "xxxxxxxxxxxxx",
      "userName": "User 1",
      "roomName": "Room 1",
      "sessionId": "8475234jh62380672306",
      "lastMessageId": "5f7cb371bdb71b6e1780797b"
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
      "userId": "xxxxxxxxxxxxx",
      "roomName": "Room 1",
      "userName": "User 1",
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



## Methods:


- **joinUser**(userId, userName, roomName) Send joinRomm message with userId, userName, and roomName params.

-  **reconnectUser**(userId, userName, roomName, sessionId) Send reconnect message with userId, userName, roomName and sessionId params.

-  **sendTextMessage**(roomName, userId, userName, messageText) Send text message with userId, userName, roomName and the text of the message.

-  **getMessages**() return all the messages (received and sent)

-  **getServiceMessages**() return the service messages

-  **getPendingMessages**() return all the messages that have been sent but no ack received.

---



## License

"eftgca-messages" is licensed under [Apache License](https://www.apache.org/licenses/LICENSE-2.0.txt).