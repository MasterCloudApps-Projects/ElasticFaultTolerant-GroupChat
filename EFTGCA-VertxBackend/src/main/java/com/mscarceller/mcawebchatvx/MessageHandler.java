package com.mscarceller.mcawebchatvx;

import com.mscarceller.mcawebchatvx.model.Method;
import com.mscarceller.mcawebchatvx.model.messages.Request;

import org.json.JSONException;
import org.json.JSONObject;

public class MessageHandler {

    MessageHandler() {

    }

    public Method getMethod(String jsonMessageString) throws JSONException {
        System.out.println("Decoding incoming message: " + jsonMessageString);
        JSONObject jsonMessage = new JSONObject(jsonMessageString);

        if(jsonMessage.getString("method").equalsIgnoreCase("joinRoom")){
            System.out.println("Incoming message decoded: " + Method.JOIN_ROOM);
            return Method.JOIN_ROOM;
        }
        else if(jsonMessage.getString("method").equalsIgnoreCase("textMessage")){
            System.out.println("Incoming message decoded: " + Method.TEXT_MESSAGE);
            return Method.TEXT_MESSAGE;
        }
        else if(jsonMessage.getString("method").equalsIgnoreCase("reconnect")){
            System.out.println("Incoming message decoded: " + Method.RECONNECT);
            return Method.RECONNECT;
        }
        else{
            return null;
        }
            
    }


}