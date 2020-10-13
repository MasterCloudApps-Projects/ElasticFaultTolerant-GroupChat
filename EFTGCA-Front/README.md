# Angular Frontend example for Elastic & FaultTolerant GroupChat Application

This is a sample frontend project to show EFTGCA-VertxBackend running.
This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 9.1.0.

## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The app will automatically reload if you change any of the source files.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory. Use the `--prod` flag for a production build.

## Building and publish the image into DockerHub registry

* Build the image:

Run command *docker build -t NAMESPACE/APPNAME:APPVERSION .* For example:

    ```
    > docker build -t mscarceller/webchat:1.0.0
    ```

* Push the image to dockerhub

Run command *docker push -t NAMESPACE/APPNAME:APPVERSION* For example:
    ```
    > docker push mscarceller/webchat:1.0.0
    ```
