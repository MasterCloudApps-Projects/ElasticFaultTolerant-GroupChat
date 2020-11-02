

# Elastic & FaultTolerant GroupChat Application Tests

Javascript module for testing the Elastic & FaultTolerant GroupChat Application based on VertX



1. [Load Test: testing the elasticity](#loadtest)
2. [Chaos: testing the fault tolerance](#caos)
3. [Chaos Testing with Litmus and Okteto Cloud](#litmus)



<a name="loadtest"></a>

## 1. Load test: testing elasticity.

This is a load test. We use a node script that initialize 10 users and performs a loop of text messages sendings. 

To show the HPA state we use the next command:

```
> watch -n 15 kubectl describe hpa webchat-consumer --namespace=mscarceller
```

And show something like this:

![](./images/001.png)

There are two important points:

```
AbleToScale     True    ReadyForNewScale  recommended size matches current size
```

```
ScalingActive   True    ValidMetricFound  the HPA was able to successfully calculate a replica count from cpu resource utilizatio
n (percentage of request)
```



To show the Deployment state we use the next command:

```
> watch -n 1 kubectl get all --namespace=mscarceller
```

And show something like this, we can see the 2 backend pods.

![](./images/002.png)

 Then  start the test:

```
> node index.js
Inizializating test with 10 users sending 50 messages
Now users are chatting, please wait...
```

During the test we can see how the HPA increase the number of Pods. When the load exceed the limit the HP<C instantiate a new Pod, in order to decrease the load: 

![](./images/003.png)

We can see the message:

```
Normal  SuccessfulRescale  31m (x2 over 4h7m)   horizontal-pod-autoscaler  New size: 3; reason: cpu resource utilization (percentage of request) above target
```

We also can see the 3 pods running:

![](./images/004.png)

It increase until 4 pods.

![](./images/007.png)

When the test finish and the load decrease, the HPA gracefully kills the unnecessary pods.



```
  Normal  SuccessfulRescale  31m (x2 over 4h7m)   horizontal-pod-autoscaler  New size: 3; reason: cpu resource utilization (percentage of request) above target
  Normal  SuccessfulRescale  13m (x2 over 4h6m)   horizontal-pod-autoscaler  New size: 4; reason: cpu resource utilization (percentage of request) above target
  Normal  SuccessfulRescale  6m22s                horizontal-pod-autoscaler  New size: 3; reason: All metrics below target
  Normal  SuccessfulRescale  78s (x3 over 3h58m)  horizontal-pod-autoscaler  New size: 2; reason: All metrics below target

```



This is the test result:

```shell
> node index.js
Inizializating test with 10 users sending 50 messages
Now users are chatting, please wait...
Waiting for results, please wait...
************************************
INFO FOR USER: UserName 1
Messages sent: 461
Messages pending: 0
************************************
************************************
INFO FOR USER: UserName 2
Messages sent: 461
Messages pending: 0
************************************
************************************
INFO FOR USER: UserName 3
Messages sent: 461
Messages pending: 0
************************************
************************************
INFO FOR USER: UserName 4
Messages sent: 461
Messages pending: 0
************************************
************************************
INFO FOR USER: UserName 5
Messages sent: 461
Messages pending: 0
************************************
************************************
INFO FOR USER: UserName 6
Messages sent: 461
Messages pending: 0
************************************
************************************
INFO FOR USER: UserName 7
Messages sent: 461
Messages pending: 0
************************************
************************************
INFO FOR USER: UserName 8
Messages sent: 461
Messages pending: 0
************************************
************************************
INFO FOR USER: UserName 9
Messages sent: 461
Messages pending: 0
************************************
************************************
Total users reconnections: 0
************************************
Test Finished
```



---

<a name="caos"></a>

## 2. Chaos: testing the fault tolerance.







---

<a name="litmus"></a>

## 3. Chaos Testing with Litmus and Okteto Cloud

Please, visit the [Chaos Testing with Litmus and Okteto Cloud](https://github.com/MasterCloudApps-Projects/ElasticFaultTolerant-GroupChat/blob/master/EFTGCA-VertxAppTests/ChaosTestingOkteto.md) document.



