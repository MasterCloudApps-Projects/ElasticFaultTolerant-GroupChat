package com.mscarceller.mcawebchatvx.model.messages;

import com.fasterxml.jackson.databind.JsonNode;

public class Request {

    private static final String VERSION = "2.0";

    private String jsonrpc;
    private String method;
    private JsonNode params;
    private int id;

    public Request(String method, JsonNode params, int id) {
        this.jsonrpc = VERSION;
        this.method = method;
        this.params = params;
        this.id = id;
    }

    public String getJsonrpc() {
        return jsonrpc;
    }

    public String getMethod() {
        return method;
    }

    public JsonNode getParams() {
        return params;
    }

    public int getId() {
        return id;
    }
    
    @Override
    public String toString() {
        return   "{ " +
                    "\"jsonrpc\": \"" + this.jsonrpc  + "\"," +
                    "\"method\": \"" + this.method + "\"," +
                    "\"params\":  " + this.params + "," +
                    "\"id\": " + this.id + 
                 "}";
    }
}