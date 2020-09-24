package com.mscarceller.mcawebchatvx.model.messages;

import com.fasterxml.jackson.databind.JsonNode;

public class Notification{

    private static final String VERSION = "2.0";

    private String jsonrpc;
    private String method;
    private JsonNode params;

    public Notification(String method, JsonNode params) {
        this.jsonrpc = VERSION;
        this.method = method;
        this.params = params;
    }

    @Override
    public java.lang.String toString() {
        return   "{ " +
                    "\"jsonrpc\": \"" + this.jsonrpc  + "\"," + 
                    "\"method\": \"" + this.method + "\"," + 
                    "\"params\": " + this.params + 
                 "}";
    }
}
