package com.mscarceller.mcawebchatvx.model.messages;

public class SuccessResponse extends Response{

    private Object result;

    public SuccessResponse(Object result, int id) {
        super(id);
        this.result = result;
    }

    public Object getResult() {
        return result;
    }

    @Override
    public java.lang.String toString() {
        return   "{ " +
                    "\"jsonrpc\": \"" + super.getJsonrpc() + "\"," +
                    "\"result\":  " + this.result        + "," +
                    "\"id\": " + super.getId() + 
                 "}";
    }
      

}
