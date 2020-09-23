package com.mscarceller.mcawebchatvx.model;

public enum ErrorCode {

    PARSE_ERROR(-32700, "Parse error"),
    USER_EXIST(-32001,"There is another user with same name in the room!"),
    METHOD_NOT_FOUND(-32002,"Method not found"),
    RECONNECT_ERROR(-32003,"Reconnection fail!"),
    INVALID_REQUEST(-32600, "The request is invalid");

    private final int id;
    private final String description;

    ErrorCode(int id, String description) {
        this.id = id;
        this.description = description;
    }

    public int getId() {
        return this.id;
    }
    
    public String getDescription() {
        return this.description;
    }

    @Override
    public String toString() {
        return "ERROR (" + this.id +"): " + this.description;
    }
}