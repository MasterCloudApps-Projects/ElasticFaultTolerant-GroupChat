const WebSocket = require('ws');
var uuid = require('uuid');
let EventEmitter = require('events').EventEmitter

const WEBSOCKET_STATE = {
    CONNECTING: 0,
    OPEN: 1,
    CLOSING: 2,
    CLOSED: 3,
  };

const JSONRPC_VERSION = "2.0";

//  Emmited events
const EVENT_ERROR = "error";
const EVENT_RESPONSE = "response";
const EVENT_ONCLOSE = "closedConnection";
const EVENT_NEW_USER = "newUser";
const EVENT_RECONNECT = "reconnect";
const EVENT_TEXT_MESSAGE = "textMessage";

// Methods read/write from/into the socket 
const METHOD_NEW_USER = "newUser";
const METHOD_TEXT_MESSAGE = "textMessage";
const METHOD_JOIN_ROOM = "joinRoom";
const METHOD_RECONNECT = "reconnect";

class ChatMessagesManager extends EventEmitter {

    constructor(url) {
        super();
        this.url =  url;
        this.webSocket = null;
        this.messageId = 1;
        this.messages = new Map();
        this.pendingMessages = new Map();
        this.connectWebSocket().then(() => {
            console.log("WebSocket initializated succesfully");
        })
    }

    getMessages(){
        return this.messages;
    }

    getPendingMessages(){
        return this.pendingMessages;
    }

    connectWebSocket() {
        console.log("Connecting to " + this.url);
        return new Promise((resolve, reject) => {
            this.webSocket = new WebSocket(this.url);
            this.webSocket.onopen = () => {
                this.webSocket.addEventListener("message", (message) => {
                    this.decodeMessage(JSON.parse(message.data));
                });
                this.sendPendingMessages();
                resolve(this);
            };
            this.webSocket.onerror = function(err) {
                console.log(err);
                this.emit(EVENT_ERROR, err); 
            };
            this.webSocket.onclose = function(event) {
                this.emit(EVENT_ONCLOSE, event); 
            };
        });
    }

    closeWebSocket(){
        this.webSocket.close();
    }

    decodeMessage(message){

        if(this.isResponseMessage(message)){
            this.emit(EVENT_RESPONSE, message);   
        }

        if(this.isReconnectMessage(message)){
            this.emit(EVENT_RECONNECT, message);   
        }

        if(this.isErrorMessage(message)){
            this.emit(EVENT_ERROR, message.error);   
        }

        if(this.isNewUserNotification(message)){
            this.emit(EVENT_NEW_USER, message.params);   
        }

        if(this.isTextMessage(message)){
            if(this.messages.has(message.params.uuid)){
                this.messages.get(message.params.uuid).params.ack = true;
                this.pendingMessages.delete(message.params.uuid);
            }
            this.emit(EVENT_TEXT_MESSAGE, message.params);  
        }

    }

    isResponseMessage(message){
        return message.hasOwnProperty('result')
    }

    isErrorMessage(message){
        return message.hasOwnProperty('error');
    }

    isNewUserNotification(message){
        if (message.hasOwnProperty('method') && !message.hasOwnProperty('id')){
            return (message.method === METHOD_NEW_USER);
        }
        return false;
    }

    isTextMessage(message){
        if (message.hasOwnProperty('method') && message.hasOwnProperty('id')){
            return (message.method === METHOD_TEXT_MESSAGE);
        }
        return false;
    }

    isReconnectMessage(message){
        if (message.hasOwnProperty('method') && message.hasOwnProperty('id')){
            return (message.method === METHOD_RECONNECT);
        }
        return false;
    }

    isOpeningWebSocket() {
        return Boolean(this.webSocket && this.webSocket.readyState === WEBSOCKET_STATE.CONNECTING);
    }

    isOpenedWebSocket() {
        return Boolean(this.webSocket && this.webSocket.readyState === WEBSOCKET_STATE.OPEN);
    }

    getNewId(){
        return this.messageId++;
    }

    joinUser(userName,roomName){
        let joinMessage = { 
            jsonrpc: JSONRPC_VERSION,
            method: METHOD_JOIN_ROOM,
            params: {
                room: roomName,
                user: userName,
            },
            id: this.getNewId()
        }
        this.writeMessageIntoWebSocket(JSON.stringify(joinMessage));
    }

    reconnectUser(userName,roomName,sessionId){
        let reconnectMessage = {
              jsonrpc: JSONRPC_VERSION,
              method: METHOD_RECONNECT,
              params: {
                sessionId: sessionId,
                room: roomName,
                user: userName,
              },
              id: this.getNewId()
        }
        this.writeMessageIntoWebSocket(JSON.stringify(reconnectMessage));
    }

    sendTextMessage(roomName, userName, messageText){
        let messageUUID = uuid.v4();
        let textMessage = { 
            jsonrpc: JSONRPC_VERSION,
            method: METHOD_TEXT_MESSAGE,
            params: {
                room: roomName,
                user: userName,
                text: messageText,
                ack: false,
                uuid: messageUUID,
                date: new Date()
            },
            id: this.getNewId()
        }
        this.messages.set(messageUUID,textMessage);
        this.pendingMessages.set(messageUUID,textMessage);
        this.writeMessageIntoWebSocket(JSON.stringify(textMessage));
    }

    sendPendingMessages(){
        console.log("Sending pending messages...");
        for (var message of this.pendingMessages.entries()) {
            writeMessageIntoWebSocket(message);
        }
    }

    writeMessageIntoWebSocket(message){
        if (this.isOpenedWebSocket()){
            this.webSocket.send(message);
        }
    }

}

module.exports = ChatMessagesManager;