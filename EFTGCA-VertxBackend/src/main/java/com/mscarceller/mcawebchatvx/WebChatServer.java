package com.mscarceller.mcawebchatvx;

import java.util.Map;
import java.util.Set;
import java.util.List;

import java.util.concurrent.TimeUnit;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.hazelcast.core.Hazelcast;
import com.hazelcast.core.HazelcastInstance;
import com.mscarceller.mcawebchatvx.model.ErrorCode;
import com.mscarceller.mcawebchatvx.model.Method;
import com.mscarceller.mcawebchatvx.model.messages.ErrorResponse;
import com.mscarceller.mcawebchatvx.model.messages.Notification;
import com.mscarceller.mcawebchatvx.model.messages.Request;
import com.mscarceller.mcawebchatvx.model.messages.SuccessResponse;

import org.json.JSONException;

import io.vertx.core.AbstractVerticle;
import io.vertx.core.DeploymentOptions;
import io.vertx.core.Vertx;
import io.vertx.core.buffer.Buffer;
import io.vertx.core.http.HttpServer;
import io.vertx.core.http.HttpServerOptions;
import io.vertx.core.http.ServerWebSocket;
import io.vertx.core.json.JsonObject;
import io.vertx.ext.web.Router;
import io.vertx.ext.web.handler.StaticHandler;
import io.vertx.ext.mongo.MongoClient;
import io.vertx.ext.mongo.FindOptions;

public class WebChatServer extends AbstractVerticle {

    private Map<String, String> webChatClients;
    private MongoClient mongoDBclient;
    private HttpServer server;
    private MessageHandler messageHandler;

    private int messageId;

    @Override
    public void start() {
        startServer(vertx);
    }

    private void startServer(Vertx vertx) {

        server = vertx.createHttpServer();
        messageHandler = new MessageHandler();
        messageId = 1;

        // Setting and init shared webchatClients Map
        Set<HazelcastInstance> instances = Hazelcast.getAllHazelcastInstances();
        HazelcastInstance hz = instances.stream().findFirst().get();
        webChatClients = hz.getMap("users");

        // Setting and init shared mongo DB
        // JsonObject mongoconfig = new JsonObject().put("connection_string", "mongodb://localhost:27017").put("db_name","webchat");
        JsonObject mongoconfig = new JsonObject().put("connection_string", "mongodb://mongodb:27017")
                                    .put("db_name","webchat")
                                    .put("username","admin")
                                    .put("password","password")
                                    .put("authSource","admin");
        mongoDBclient = MongoClient.createShared(vertx, mongoconfig, "WebchatDBPool");

        System.out.println("Server is started");

        // Notify New Server into the event Bus   ->    useless only for test the bus    -> CAN BE DELETE AFTER INITIAL TESTS
        vertx.eventBus().publish("new.server", "");

        // Init the websocket handler
        server.webSocketHandler((serverWebSocket) -> {

            if (serverWebSocket.path().equals("/chat")) {
                serverWebSocket.handler((Buffer data) -> {

                    JsonObject message = data.toJsonObject();

                    System.out.println("Incoming message in server: " + message);

                    try {
                        int i = 1;
                        switch (messageHandler.getMethod(data.toString())){
                            case JOIN_ROOM:
                                registerNewUserInRoom(message.getInteger("id"), message.getJsonObject("params").getString("room"), message.getJsonObject("params").getString("user"), serverWebSocket);
                            break;
                            case RECONNECT:
                                // If reconnect message first check if the user is already registered, and if so
                                // delete it and register again. It comes from failured pod or broken connection.
                                System.out.println("Searching for client: " + message.getJsonObject("params") +" to reconnect...");                        
                                if (webChatClients.containsKey(message.getJsonObject("params").getString("user"))) {
                                    System.out.println("Reconnecting user: " + message.getJsonObject("params"));
                                    deleteUser(message.getJsonObject("params").getString("user"));
                                    newClient(message.getJsonObject("params").getString("room"), message.getJsonObject("params").getString("user"), serverWebSocket);
                                }
                                else{
                                    System.out.println("The user " + message.getJsonObject("params") + " is not registered yet, so registering...");
                                    newClient(message.getJsonObject("params").getString("room"), message.getJsonObject("params").getString("user"), serverWebSocket);
                                }
                            break;
                            case TEXT_MESSAGE:
                                // If message push it into the event bus, into the specific room
                                System.out.println("Publishing message into the event bus: " + message.toString());
                                persistMessageToDB(message);
                                vertx.eventBus().publish(message.getJsonObject("params").getString("room"), message);
                                System.out.println("Message in event bus: " + message.toString());
                            break;
                            default:
                                System.out.println("Incoming message received in server: unknown format");
                            break;
                        
                        }  
                    } catch (JSONException e) {
                        System.out.println("Incoming message received in server: unknown format");
                        e.printStackTrace();
                    }

                });
            }
            else{
                System.out.println("Incoming message received in server and rejected: " + serverWebSocket.path());
                serverWebSocket.reject();
            }

            // Listen for disconected users event
            vertx.eventBus().consumer("delete.user", data -> {
                this.deleteUser(data.body().toString());
            });

            // Listen for reconnect users of a destroyed pod
            vertx.eventBus().consumer("reconnect.users", data -> {
                System.out.println("Someone has notified in EventBus that is shutting down...");
            });

            // Listen for new servers in cluster
            vertx.eventBus().consumer("new.server", data -> {
                System.out.println("New server available");
            });

            Runtime.getRuntime().addShutdownHook(new Thread() {
                @Override
                public void run() {
                    Request reconnectRequest = new Request(Method.RECONNECT.getDescription(),null, getNewId());
                    System.out.println("I'm shutting down.");
                    vertx.eventBus().publish("reconnect.users", "");
                    serverWebSocket.writeFinalTextFrame(reconnectRequest.toString());
                    System.out.println("Shutting down notify in event bus. Someone reconnect my users");
                }
            });
            
        }).listen(8080);

    }

    private void registerNewUserInRoom(int messageId, String room, String user, ServerWebSocket serverWebSocket){
        // If the user is new register it into the room and notify using the Event Bus that is a new user in room.
        // Also send the last messages in room
        if (!isUserRegistered(room, user)) {
            newClient(room, user, serverWebSocket);
            SuccessResponse successResponse = new SuccessResponse("\"OK\"",messageId);
            serverWebSocket.writeFinalTextFrame(successResponse.toString());
            ObjectMapper objectMapper = new ObjectMapper();
            JsonNode jsonNode = objectMapper.createObjectNode().put("type", "system").put("text",user + " has joined the room!").put("room", room);
            Notification newUserNotification = new Notification("newUser", jsonNode);
            vertx.eventBus().publish(room, newUserNotification.toString());
            System.out.println("Notify the new user in EventBus:" + newUserNotification.toString());
            sendLastMessagesInRoom(room, serverWebSocket);
        }
        // If other user is already registered with same name send error message, but using the websocket.
        else{
            ErrorResponse errorResponse = new ErrorResponse(ErrorCode.USER_EXIST, messageId);
            serverWebSocket.writeFinalTextFrame(errorResponse.toString());
            System.out.println("Error registering user...");
        }
    }

    private void newClient(String room, String user, ServerWebSocket ws){
        WebChatClient webChatClient = new WebChatClient(room, user, ws);
        vertx.deployVerticle(webChatClient, new DeploymentOptions().setHa(true), res -> {
            if (res.succeeded()) {
                webChatClients.put(user, res.result());
            } else {
                System.err.println("Error at deploy User");
            }
        });
    }

    private boolean isUserRegistered(String room, String userName){
        return webChatClients.containsKey(userName);
    }

    private int getNewId(){
        return messageId++;
    }

    private void persistMessageToDB(JsonObject message){
        mongoDBclient.insert("messages", message, insert -> {
            if (insert.succeeded()) {
                String id = insert.result();
                System.out.println("Saved message with id " + id);
              } else {
                System.out.println("Error saving message in MongoDB");
                insert.cause().printStackTrace();
              }
        });
    }

    private void sendLastMessagesInRoom(String roomName, ServerWebSocket serverWebSocket){
        System.out.println("Sending last messages for the new user in room!");
        JsonObject query = new JsonObject().put("params.room", roomName);
        FindOptions options = new FindOptions();
        options.setLimit(30);
        mongoDBclient.findWithOptions("messages", query, options, res -> {
            if (res.succeeded()) {
                for (JsonObject message : res.result()) {
                    serverWebSocket.writeFinalTextFrame(message.toString());
                }
            }
        });
    }

    //Remove the verticle and unregister the handler
    private void deleteUser (String user_name){
        vertx.undeploy(webChatClients.get(user_name), res -> {
            if (res.succeeded()) {
                System.out.println("Undeployed ok");
            } else {
                System.err.println("Undeploy failed!");
            }
        });
        webChatClients.remove(user_name);
    }

    public void sleepServer(int seconds){
        try {
            TimeUnit.SECONDS.sleep(seconds);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
    }

}