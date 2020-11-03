const WebSocket = require('isomorphic-ws');
const axios = require('axios')
const fs = require('fs')
const FormData = require('form-data')
let EventEmitter = require('events').EventEmitter;
var uuid = require('uuid');

const WEBSOCKET_STATE = {
    CONNECTING: 0,
    OPEN: 1,
    CLOSING: 2,
    CLOSED: 3,
  };

const JSONRPC_VERSION = "2.0";

//  Emmited events
const EVENT_CONNECTED = "connected";
const EVENT_ERROR = "error";
const EVENT_RESPONSE = "response";
const EVENT_ONCLOSE = "closedConnection";
const EVENT_NEW_USER = "newUser";
const EVENT_RECONNECT = "reconnect";
const EVENT_TEXT_MESSAGE = "textMessage";
const EVENT_IMAGE_MESSAGE = "imageMessage";
const EVENT_FILE_MESSAGE = "fileMessage";

// Methods read/write from/into the socket 
const METHOD_NEW_USER = "newUser";
const METHOD_TEXT_MESSAGE = "textMessage";
const METHOD_IMAGE_MESSAGE = "imageMessage";
const METHOD_FILE_MESSAGE = "fileMessage";
const METHOD_JOIN_ROOM = "joinRoom";
const METHOD_RECONNECT = "reconnect";

class ChatMessagesManager extends EventEmitter {

    constructor(wsurl,apiurl,verbose=false) {

        super();
        this.wsurl =  wsurl;
        this.apiurl =  apiurl;
        this.verbose = verbose;
        this.webSocket = null;
        this.messageId = 1;
        
        this.sessionId = uuid.v4();
        this.userId = ""; 
        this.roomName = "";
        this.userName = "";

        this.messages = new Map();
        this.serviceMessages = new Map();
        this.pendingMessages = new Map();
        
        this.reconnectUser = function(){
            let self = this;
            if(this.verbose) console.log("Reconnecting user...");
            let id = this.getNewId()
            let reconnectMessage = {
                  jsonrpc: JSONRPC_VERSION,
                  method: METHOD_RECONNECT,
                  params: {
                    sessionId: self.sessionId,
                    userId: self.userId, 
                    roomName: self.roomName,
                    userName: self.userName,
                    lastMessageId: self.getlastMessageId()
                  },
                  id: id
            }
            self.serviceMessages.set(id,reconnectMessage);
            self.connectWebSocket().then(() => {
                self.writeMessageIntoWebSocket(reconnectMessage);
                self.sendPendingMessages();
            })   
        }

        this.getlastMessageId = function(){
            for (var message of this.messages.entries()) {
              if (message[1]["_id"]!=null) return message[1]["_id"];
            }
            return null;
        }

        this.connectWebSocket = function() {
            let self = this;
            if(this.verbose) console.log("Connecting to " + this.wsurl);
            return new Promise((resolve, reject) => {
    
                this.webSocket = new WebSocket(this.wsurl);
    
                this.webSocket.onopen = () => {
                    this.webSocket.addEventListener("message", (message) => {
                        this.decodeMessage(JSON.parse(message.data));
                    });
                    self.emit(EVENT_CONNECTED, null); 
                    resolve(this);
                };
    
                this.webSocket.onerror = function(err) {
                    self.emit(EVENT_ERROR, err);      
                };
    
                this.webSocket.onclose = function(event) {
                    self.emit(EVENT_ONCLOSE, event); 
                    setTimeout(function() {
                        self.reconnectUser();
                    }, 5000)
                };
            });
        }

        this.closeWebSocket = function(){
            this.webSocket.close();
        }

        this.decodeMessage = function(message){

            if(this.isResponseMessage(message)){
                this.emit(EVENT_RESPONSE, message);   
            }
    
            if(this.isReconnectMessage(message)){
                this.reconnectUser();
                this.emit(EVENT_RECONNECT, message);   
            }
    
            if(this.isErrorMessage(message)){
                this.emit(EVENT_ERROR, message.error);   
            }
    
            if(this.isNewUserNotification(message)){
                if(!this.serviceMessages.has(message.params.uuid)){
                    this.serviceMessages.set(message.params.uuid,message)
                }
                this.emit(EVENT_NEW_USER, message.params);   
            }
    
            if(this.isTextMessage(message)){
                if(this.messages.has(message.params.uuid)){
                    this.messages.get(message.params.uuid).params.ack = true;
                    this.pendingMessages.delete(message.params.uuid);
                }
                else{
                    this.messages.set(message.params.uuid,message);
                }
                this.emit(EVENT_TEXT_MESSAGE, message.params);  
            }
    
            if(this.isImageMessage(message)){
                axios.get(this.apiurl+'/images/' + message.params.uuid)
                .then(response => {
                    if(this.messages.has(response.data.params.uuid)){
                        this.messages.get(response.data.params.uuid).params.ack = true;
                        this.pendingMessages.delete(response.data.params.uuid);
                    }
                    else{
                        this.messages.set(message.params.uuid,response.data);
                    }
                    this.emit(EVENT_IMAGE_MESSAGE, message.params);
                }).catch(e => {
                    console.log(e);
                })  
            }

            if(this.isFileMessage(message)){
                if(this.messages.has(message.params.uuid)){
                    this.messages.get(message.params.uuid).params.ack = true;
                    this.pendingMessages.delete(message.params.uuid);
                }
                else{
                    this.messages.set(message.params.uuid,message);
                }
                this.emit(EVENT_FILE_MESSAGE, message.params);  
            }
        }

        this.isResponseMessage = function(message){
            return message.hasOwnProperty('result')
        }
    
        this.isErrorMessage = function(message){
            return message.hasOwnProperty('error');
        }
    
        this.isNewUserNotification = function(message){
            if (message.hasOwnProperty('method') && !message.hasOwnProperty('id')){
                return (message.method === METHOD_NEW_USER);
            }
            return false;
        }
    
        this.isTextMessage = function(message){
            if (message.hasOwnProperty('method') && message.hasOwnProperty('id')){
                return (message.method === METHOD_TEXT_MESSAGE);
            }
            return false;
        }
    
        this.isImageMessage = function(message){
            if (message.hasOwnProperty('method') && message.hasOwnProperty('id')){
                return (message.method === METHOD_IMAGE_MESSAGE);
            }
            return false;
        }

        this.isFileMessage = function(message){
            if (message.hasOwnProperty('method') && message.hasOwnProperty('id')){
                return (message.method === METHOD_FILE_MESSAGE);
            }
            return false;
        }
    
        this.isReconnectMessage = function(message){
            if (message.hasOwnProperty('method') && message.hasOwnProperty('id')){
                return (message.method === METHOD_RECONNECT);
            }
            return false;
        }
    
        this.isOpeningWebSocket = function() {
            return Boolean(this.webSocket && this.webSocket.readyState === WEBSOCKET_STATE.CONNECTING);
        }
    
        this.isOpenedWebSocket = function() {
            return Boolean(this.webSocket && this.webSocket.readyState === WEBSOCKET_STATE.OPEN);
        }
    
        this.getNewId = function(){
            return this.messageId++;
        }

        this.sendPendingMessages = function(){
            for (const [key, value] of this.pendingMessages) {
                if (value.method==METHOD_IMAGE_MESSAGE){
                    this.writeImageMessageToAPIRest(value);
                }
                else if (value.method==METHOD_FILE_MESSAGE){
                    this.writeFileMessageToAPIRest(value);
                }
                else{
                    this.writeMessageIntoWebSocket(value);
                }
            }
        }
    
        this.writeImageMessageToAPIRest = function(message){
            axios.post(this.apiurl+"/images", JSON.stringify(message), {headers: {'content-type': 'application/json'}})
            .then((res) => {
                if(this.verbose) console.log(res.data)
            })
            .catch((error) => {
                console.error(error)
            })
        }

        this.writeFileMessageToAPIRest = function(message){
            const formData = new FormData()
            formData.append('files[]', message.params.fileContents, 'package.json');
            formData.append('message', JSON.stringify(message));
            let headers = this.isRunningOnConsole() ? formData.getHeaders() : {'Content-Type': 'multipart/form-data'}
            axios.post(this.apiurl+"/files", formData, {headers: headers}).then((res) => {
                if(this.verbose) console.log(res.data)
            })
            .catch((error) => {
                console.error(error)
            })
        }
    
        this.writeMessageIntoWebSocket = function(message){
            if (this.isOpenedWebSocket()){
                if(this.verbose) console.log(JSON.stringify(message));
                this.webSocket.send(JSON.stringify(message));
            }
        }

        this.isRunningOnConsole = function(){
            return (typeof window === 'undefined') 
        }

        this.connectWebSocket().then(() => {
            if(this.verbose) console.log("WebSocket initializated succesfully");
        })
  

    }

    getMessages(){
        return this.messages;
    }

    getServiceMessages(){
        return this.serviceMessages;
    }

    getPendingMessages(){
        return this.pendingMessages;
    }

    joinRoom(userId, userName, roomName){
        this.userId = userId; 
        this.roomName = roomName;
        this.userName = userName;

        let id = this.getNewId()
        let joinRoomMessage = { 
            jsonrpc: JSONRPC_VERSION,
            method: METHOD_JOIN_ROOM,
            params: {
                userId: userId,
                roomName: roomName,
                userName: userName,
                lastMessageId: null
            },
            id: id
        }
        this.serviceMessages.set(id,joinRoomMessage);
        this.writeMessageIntoWebSocket(joinRoomMessage);
    }

    sendTextMessage(messageText){
        let messageUUID = uuid.v4();
        let id = this.getNewId()
        let textMessage = { 
            jsonrpc: JSONRPC_VERSION,
            method: METHOD_TEXT_MESSAGE,
            params: {
                userId: this.userId,
                roomName: this.roomName,
                userName: this.userName,
                text: messageText,
                ack: false,
                uuid: messageUUID,
                date: new Date()
            },
            id: id
        }
        this.messages.set(messageUUID,textMessage);
        this.pendingMessages.set(messageUUID,textMessage);
        this.sendPendingMessages();
    }

    sendImageMessage(base64ImgString){
        let messageUUID = uuid.v4();
        let id = this.getNewId()
        let imageMessage = { 
            jsonrpc: JSONRPC_VERSION,
            method: METHOD_IMAGE_MESSAGE,
            params: {
                userId: this.userId,
                roomName: this.roomName,
                userName: this.userName,
                base64ImgString: base64ImgString,
                ack: false,
                uuid: messageUUID,
                date: new Date()
            },
            id: id
        }
        this.messages.set(messageUUID,imageMessage);
        this.pendingMessages.set(messageUUID,imageMessage);
        this.sendPendingMessages();
    }

    sendFileMessage(fileName, fileContents){
        let messageUUID = uuid.v4();
        let id = this.getNewId()
        let fileMessage = { 
            jsonrpc: JSONRPC_VERSION,
            method: METHOD_FILE_MESSAGE,
            params: {
                userId: this.userId,
                roomName: this.roomName,
                userName: this.userName,
                fileName: fileName,
                fileContents: fileContents,
                ack: false,
                uuid: messageUUID,
                date: new Date()
            },
            id: id
        }
        this.messages.set(messageUUID,fileMessage);
        this.pendingMessages.set(messageUUID,fileMessage);
        this.sendPendingMessages();
    }

    async downloadFileMessage(message){

        const fileName = JSON.parse(message).params.fileName;
        const url = this.apiurl+'/files/' + JSON.parse(message).params.uuid;
        const path = 'files/' + fileName;
        const writer = fs.createWriteStream(path)
    
        const response = await axios({url,method: 'GET',responseType: 'stream'})
        response.data.pipe(writer)

        return new Promise((resolve, reject) => {
            writer.on('finish', resolve)
            writer.on('error', reject)
        })
    }

}

module.exports = ChatMessagesManager;