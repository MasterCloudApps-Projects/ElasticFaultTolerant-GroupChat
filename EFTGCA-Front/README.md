# Angular Frontend example for Elastic & FaultTolerant GroupChat Application

This is a sample frontend project to show EFTGCA-VertxBackend running. This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 9.1.0.



## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The app will automatically reload if you change any of the source files.



---

## Build the application

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory. Use the `--prod` flag for a production build.



---

## Building and publish the image into DockerHub registry

* Build the image:

Run command *docker build -t NAMESPACE/APPNAME:APPVERSION .* For example:

```shell
> docker build -t mscarceller/webchat:1.0.0
```

* Push the image to dockerhub:

Run command *docker push -t NAMESPACE/APPNAME:APPVERSION*. For example:

```shell
> docker push mscarceller/webchat:1.0.0
```

---



## Develop your own front application using the messages Library.

You can use this example but you also can create your own front application.

First of all is to create your project and include the library as a dependency:

```json
"dependencies": {
  "eftgca-messages": "^3.0.0",
  ...
```

Import th library in the module:

```typescript
import * as ChatMessagesManager from "eftgca-messages"
```

Instantiate and use the *chatMessagerManager*:

```typescript
	this.chatMessagesManager = new ChatMessagesManager("SERVER_URL_WEBSOCKET");

	this.chatMessagesManager.on('connected',() => {
      console.log("Connected");
      // Add your code here
    });

    this.chatMessagesManager.on('error',(error) => {
      console.log("Error (" + error.code + "): " + error.message)
      // Add your code here
    });

    this.chatMessagesManager.on('response',(message) => {
      console.log("Response " + message.result + " to request number "+ message.id)
      // Add your code here
    });

    this.chatMessagesManager.on('textMessage',(message) => {
      // Add your code here
    });

```

