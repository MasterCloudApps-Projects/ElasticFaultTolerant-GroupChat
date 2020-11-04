# Kubernetes Pod Chaos Monkey



This repository contains a Dockerfile for a Deployment that will randomly delete pods in a given namespace. 

An image built from the Dockerfile in this repository is available on Docker Hub as mscarceller/k8s-pod-chaos-monkey:1.0.0

This repository is forked from https://github.com/MasterCloudApps/3.2.Contenedores-y-orquestadores/tree/master/Docker-pod-chaos-monkey

### Configuration

A few environment variables are available for configuration:

**DELAY**: seconds between selecting and deleting a pod. Defaults to 30.
**NAMESPACE**: the namespace to select a pod from. Defaults to default.
**TAG and VALUE**: can be set to choose a specific pod within all your deployments. 

---

### Building and publish the image into DockerHub registry

- Build the image:

Run command *docker build -t NAMESPACE/APPNAME:APPVERSION .* For example:

```
> docker build -t mscarceller/k8s-pod-chaos-monkey:1.0.0
```

- Push the image to dockerhub:

Run command *docker push -t NAMESPACE/APPNAME:APPVERSION*. For example:

```
> docker push mscarceller/k8s-pod-chaos-monkey:1.0.0
```

---

### Example

From this manifest:

```yaml
    - name: TAG
      value: name
    - name: VALUE
      value: webchatbackend
    - name: NAMESPACE
      value: mscarceller
    - name: DELAY
      value: '30'
```
Apply the manifest and create the pod:

```shell
$ kubectl apply -f ./k8s/pod-chaos-monkey.yaml
deployment "kubernetes-pod-chaos-monkey" created
```
Then you can see the pod running:
```shell
$ kubectl get pods | grep chaos
k8s-pod-chaos-monkey-3294408070-6w6oh   1/1       Running       0          19s
```
Inspect the pod logs:
```shell
$ kubectl logs kubernetes-pod-chaos-monkey-3294408070-6w6oh
```
Will show something like this:
```shell
+ : 30
+ : mscarceller
+ true
+ kubectl --namespace mscarceller -o 'jsonpath={.items[*].metadata.name}' get pods --selector=app=webchatbackend
+ tr ' ' '\n'
+ shuf
+ head -n 1
+ xargs -t --no-run-if-empty kubectl --namespace mscarceller delete pod
kubectl --namespace mscarceller delete pod webchatbackend-bf9d674f8-6mbph 
pod "webchatbackend-bf9d6 deleted
```

---

### License

[MIT]("./MIT.md")