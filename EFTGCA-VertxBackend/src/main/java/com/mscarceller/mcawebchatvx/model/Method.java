package com.mscarceller.mcawebchatvx.model;

public enum Method {

    JOIN_ROOM("joinRoom"),
    RECONNECT("reconnect"),
    NOTIFY("notify"),
    NEW_USER("newUser"),
    TEXT_MESSAGE("textMessage");

    private String description;

    Method(final String description) {
        this.description = description;
    }

    public String getDescription() {
        return this.description;
    }

}