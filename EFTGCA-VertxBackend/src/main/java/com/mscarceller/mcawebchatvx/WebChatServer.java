package com.mscarceller.mcawebchatvx;

import java.util.Map;
import java.util.HashMap;
import java.util.Set;
import java.util.List;
import java.util.Iterator;

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

    private Map<String, String> webChatClients;  // clients <roomName,<userid, client>>
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
                                registerNewUserInRoom(message, serverWebSocket);
                            break;
                            case RECONNECT:
                                System.out.println("Reconnecting user: " + message.getJsonObject("params"));
                                registerNewUserInRoom(message, serverWebSocket);
                            break;
                            case TEXT_MESSAGE:
                                // If message, push it into the event bus, into the specific room
                                System.out.println("Publishing message into the event bus: " + message.toString());
                                persistMessageToDB(message);
                                vertx.eventBus().publish(message.getJsonObject("params").getString("roomName"), message);
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
                JsonObject userData = new JsonObject(data.body().toString());
                System.out.println("Someone has notified for deleting user: <" + userData.getString("roomName") + ", " + userData.getString("userId")+">");
                this.deleteClient(userData.getString("roomName"),userData.getString("userId"));
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

    private void registerNewUserInRoom(JsonObject message, ServerWebSocket serverWebSocket){
        // If the user is new register it into the room and notify using the Event Bus that is a new user in room.
        // Also send the last messages in room

        System.out.println("User register...");

        String userId = message.getJsonObject("params").getString("userId");
        String roomName = message.getJsonObject("params").getString("roomName");
        String userName = message.getJsonObject("params").getString("userName");

        if (isUserRegisteredInRoom(roomName, userId)){
            System.out.println("User is already register: delete and register again");
            deleteClient(roomName, userId);
        }

        if (!isAnotherUserWithSameNameInRoom(roomName, userName)) {
            System.out.println("No user in room with same Name");
            newClient(roomName, userId, userName, serverWebSocket);
            SuccessResponse successResponse = new SuccessResponse("\"OK\"",messageId);
            serverWebSocket.writeFinalTextFrame(successResponse.toString());
            ObjectMapper objectMapper = new ObjectMapper();
            JsonNode jsonNode = objectMapper.createObjectNode().put("type", "system").put("text",userName + " has joined the room!").put("room", roomName);
            Notification newUserNotification = new Notification("newUser", jsonNode);
            vertx.eventBus().publish(roomName, newUserNotification.toString());
            System.out.println("Notify the new user in EventBus:" + newUserNotification.toString());
            sendLastMessagesInRoom(roomName, serverWebSocket);
        }
        else{
            ErrorResponse errorResponse = new ErrorResponse(ErrorCode.USER_EXIST, messageId);
            serverWebSocket.writeFinalTextFrame(errorResponse.toString());
            System.out.println("Error registering user...");
        }
    }

    private void newClient(String roomName, String userId, String userName, ServerWebSocket ws){
        WebChatClient webChatClient = new WebChatClient(roomName, userId, userName, ws);
        vertx.deployVerticle(webChatClient, new DeploymentOptions().setHa(true), res -> {
            if (res.succeeded()) {
                insertUserIntoRoom(roomName, userId, userName, res.result());
            } else {
                System.err.println("Error at deploy User");
            }
        });
    }

    private void insertUserIntoRoom(String roomName, String userId, String userName, String vertxId){
        System.out.println("Inserting user " + userId + " in room " + roomName);
        JsonObject usersInRoom = getUsersInRoomJsonObject(roomName);
        JsonObject userData = new JsonObject();
        userData.put("userName", userName);
        userData.put("vertxId", vertxId);
        usersInRoom.put(userId, userData);
        webChatClients.put(roomName, usersInRoom.toString());
    }


    private boolean isUserRegisteredInRoom(String roomName, String userId){
        System.out.println("Checking userId " + userId + " in room " + roomName);
        JsonObject usersInRoom = getUsersInRoomJsonObject(roomName);
        return usersInRoom.containsKey(userId);
    }

    private JsonObject getUsersInRoomJsonObject(String roomName){
        String usersInRoomString = webChatClients.get(roomName);
        if (usersInRoomString!=null){
            return (new JsonObject(usersInRoomString));
        }
        else{
            return new JsonObject();
        }
    }

    private boolean isAnotherUserWithSameNameInRoom(String roomName, String userName){
        System.out.println("Checking userName " + userName + " in room " + roomName);
        JsonObject usersInRoom = getUsersInRoomJsonObject(roomName);
        Iterator<Map.Entry<String, Object>> iter = usersInRoom.iterator();
        while (iter.hasNext()) {
            if(new JsonObject(iter.next().getValue().toString()).getString("userName").equals(userName)){ return true;}  
        }
        return false;
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
    private void deleteClient (String roomName, String userId){
        JsonObject usersInRoom = getUsersInRoomJsonObject(roomName);
        System.out.println("Deleting client: " + usersInRoom.getJsonObject(userId).getString("vertxId"));
        try {
            vertx.undeploy(usersInRoom.getJsonObject(userId).getString("vertxId"), res -> {
                if (res.succeeded()) {
                    System.out.println("Undeployed ok");
                } else {
                    System.err.println("Undeploy failed!");
                }
            });
        } catch (java.lang.NullPointerException e) {
            System.err.println("Undeploy failed!");
        }
        usersInRoom.remove(userId);
        webChatClients.put(roomName, usersInRoom.toString());
    }

    public void sleepServer(int seconds){
        try {
            TimeUnit.SECONDS.sleep(seconds);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
    }

}