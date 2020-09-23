package com.mscarceller.mcawebchatvx.model.messages;

import com.mscarceller.mcawebchatvx.model.ErrorCode;

public class ErrorResponse extends Response {

    private int code;
    private String message;

    public ErrorResponse(ErrorCode error, int id) {
        super(id);
        this.code = error.getId();
        this.message = error.getDescription();
    }

    @Override
    public java.lang.String toString() {
        return   "{ " +
                    "\"jsonrpc\": " + super.getJsonrpc() + " , " +
                    "\"error\": { " + 
                        "\"code\": \"" + this.code + "\", " +
                        "\"message\": \"" + this.message + "\"" +
                    "}," +
                    "\"id\": " + super.getId() + 
                 "}";
    }
      

}
