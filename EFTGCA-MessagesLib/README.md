# Elastic & FaultTolerant GroupChat Application Messages Lib

Javascript module to manage messages between frontend apps and chat server. 

1. [How to create you own npm module.](#createmodule)
2. [Messages types and specs](#messages)

## 1. How to create you own npm module. <a name="createmodule"></a>

Craete a file .npmrc inside yoy root folder. This file is a configuration file for NPM, it defines the settings on how NPM should behave when running commands.
Put this isnside it:

~~~
registry=https://registry.npmjs.org/
_auth = AUTH_TOKEN
email = YOUR_MAIL
~~~

AUTH_TOKEN is an authentication token, a hexadecimal string that gives you the right to publish and access your modules. You can create from the ***Access Tokens*** section inside your www.npmjs.com profile.

YOUR_MAIL is the email used in your npm profile.

Customize package.json file:

~~~
{
  "name": NAME_OF_THE_NPM_PACKAGE,
  "version": VERSION_NUMBER,
  "description": DESCRIPTION_OF_THE_NPM_PACKAGE,
  "main": "index.js",
  "scripts": {
    "test": "jest"
  },
  "author": YOUR_NAME,
  "license": LICENCE_TYPE,
  "dependencies": {
    "ws": "^7.3.1",
    "uuid": "8.3.0"
  },
  "devDependencies": {
    "jest": "^26.1.0"
  }
}
~~~

Publish the module:

With npm installed you need to login first: 

~~~bash
> npm login
Username: YOUR_NMP_ACCOUNT_USERNAME
Password: ************
Email: (this IS public) YOUR_NMP_ACCOUNT_USERMAIL
Logged in as mscarceller on https://registry.npmjs.org/.
~~~

Then publish you module

~~~bash
> npm publish --access public
~~~

More information about ***npm publish*** here: https://docs.npmjs.com/cli/publish

## 2. Messages types and specs. <a name="messages"></a>

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
