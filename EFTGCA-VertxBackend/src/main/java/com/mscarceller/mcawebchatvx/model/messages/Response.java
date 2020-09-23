package com.mscarceller.mcawebchatvx.model.messages;

public class Response {

    private static final String VERSION = "2.0";

    private String jsonrpc;
    private int id;

    public Response(int id) {
        this.jsonrpc = VERSION;
        this.id = id;
    }

    public String getJsonrpc() {
        return this.jsonrpc;
    }

    public int getId() {
        return this.id;
    }

}
