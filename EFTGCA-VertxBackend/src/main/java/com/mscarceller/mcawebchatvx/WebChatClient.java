package com.mscarceller.mcawebchatvx;

import java.util.UUID;

import io.vertx.core.AbstractVerticle;
import io.vertx.core.Vertx;
import io.vertx.core.eventbus.MessageConsumer;

import io.vertx.core.http.ServerWebSocket;

public class WebChatClient extends AbstractVerticle {

    MessageConsumer<Object> handler;

    private String id;
    private String room;
    private String name;
    private String sessionId;
    private ServerWebSocket serverWebSocket;

	public WebChatClient(String room, String id, String name, ServerWebSocket serverWebSocket) {
        this.id = id;
        this.room = room;
        this.name = name;
        this.serverWebSocket = serverWebSocket;
        this.sessionId = UUID.randomUUID().toString();
    }

    public String getId(){
        return id;
    }

    public String getName(){
        return name;
    }

    public String getSessionId(){
        return sessionId;
    }

    
    @Override
    public void start() {
        startClient(vertx);
    }

    private void startClient(Vertx vertx) {
        // Listen for messages from his chat
        System.out.println("Sign in client: " + this.name + " in room: " + this.room);
        this.handler = vertx.eventBus().consumer(this.room).handler(data -> {
            try{
                // Try to send the message
                System.out.println("Reading message from event bus: " + data.body().toString());
                serverWebSocket.writeFinalTextFrame(data.body().toString());
                System.out.println("Writing to socket: " + "Server response to:" + data.body().toString());
            }catch(IllegalStateException e){
                // The user is offline, so I delete it.
                vertx.eventBus().publish("delete.user", "{\"roomName\":\""+this.room+"\",\"userId\":\""+this.id+"\"}");
                this.handler.unregister();
               // serverWebSocket.close();
            } 
        });
        System.out.println("Client " + this.name + "  registered into the room: " + this.room);

    }

}