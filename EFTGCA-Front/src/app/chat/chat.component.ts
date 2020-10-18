import { Component, OnInit, ViewChild, HostListener} from '@angular/core';
import { UUID } from 'angular2-uuid';

import { Message } from '../model/message';
import { retryWhen, tap, concatMap, delay, repeatWhen, mapTo } from 'rxjs/operators';
import { fromEvent, iif, merge, Observable, of, throwError } from 'rxjs';
import { WebSocketSubject, WebSocketSubjectConfig } from 'rxjs/webSocket';
import { ScrollPanel } from 'primeng/scrollpanel';
import { ViewEncapsulation } from "@angular/core";
import * as ChatMessagesManager from "eftgca-messages"

import { environment } from '../../environments/environment';

const SERVICE_NAME: string = 'SocketService';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css'],
  encapsulation: ViewEncapsulation.None,
  providers: []
})

export class ChatComponent implements OnInit {

  @ViewChild('scrollChatContainer') private scrollChatContainer: ScrollPanel;

  private socket: WebSocketSubject<any>;
  private onlineCheck: Observable<boolean>;

  chatMessagesManager: ChatMessagesManager;

  userId:string   = "User_1@user.com";
  roomName:string = "Room 1";
  userName:string = "User 1";
  
  displayRoomDialog:boolean = false;
  displayUserDialog:boolean = false;

  connected:boolean = false;

  messageText:string = "";

  chatmessages : any;
  pendingmessages : any;
  servicemessages : Map<number, Message>;

  serverStatus:string = "Disconnected";
  userStatus:string = "Unjoined";

  sessionId:string = "";

  messageId:number = 1;

  @HostListener('window:beforeunload', ['$event'])
    unloadNotification($event: any) {
        if (this.chatMessagesManager.getPendingMessages().size > 0) {
            $event.returnValue =true;
        }
  }

  constructor() {

    this.chatMessagesManager = new ChatMessagesManager(environment.CHAT_URL);

    this.chatMessagesManager.on('connected',() => {
      console.log("Connected");
      if(this.connected == true){
        this.reconnectUser();
      }
      this.serverStatus = "Connected";
      this.connected = true;
    });

    this.chatMessagesManager.on('error',(error) => {
      console.log(error);
      console.log("Error (" + error.code + "): " + error.message)
      if(error.code == "-32001"){
        this.userStatus = "Unjoined, select different name";
        this.showUserNameInput();
        return;
      }
    });

    this.chatMessagesManager.on('response',(message) => {
      console.log("Response " + message.result + " to request number "+ message.id)
      if (this.chatMessagesManager.getServiceMessages().get(message.id).method == "joinRoom" && message.result == "OK"){
        this.userStatus = "joined as " + this.userName;
        this.displayUserDialog = false;
      }
    });

    this.chatMessagesManager.on('textMessage',(message) => {
      if (message.roomName != this.roomName){
        return;
      }
      setTimeout(() => this.scrollToBottom(), 125);
    });

    this.chatMessagesManager.on('newUser',(message) => {
      console.log(message.text)
    });

    this.chatMessagesManager.on('reconnect',(data) => {
      console.log("Reconnection needed" + data)
    });

    this.chatMessagesManager.on('closedConnection',(data) => {
      this.onCloseConnection(data);
    });
    

    this.onlineCheck = merge(
      of(navigator.onLine),
        fromEvent(window, 'online').pipe(mapTo(true)),
        fromEvent(window, 'offline').pipe(mapTo(false)));
    }

    ngOnInit(): void {
      this.displayRoomDialog = true;
      this.sessionId = UUID.UUID();
    }

    checkRoomName(){
      if (this.roomName!=""){
        this.displayRoomDialog = false;
        this.displayUserDialog = true;
      }
      else
        this.displayRoomDialog = true;
    }

    checkUserName(){
      if (this.userName!=""){
        this.userId = this.userName;
        this.joinRoom();
      }
      else
        this.displayUserDialog = true;
    }

    joinRoom(){
      console.log("Registering user: " + this.userName + "(" + this.userId + ")  in room " + this.roomName);
      this.chatMessagesManager.joinRoom(this.userId, this.userName, this.roomName);
    }

    reconnectUser(){
      console.log("Reconnecting user: " + this.userName + "(" + this.userId + ")  in room " + this.roomName);
    }

    sendMessage() {
      if (this.messageText!=""){
        console.log("New message from client to websocket: ", this.messageText);
        this.chatMessagesManager.sendTextMessage(this.messageText);
        this.messageText = "";
        setTimeout(() => this.scrollToBottom(), 125);
      }
    }
  
    asIsOrder(a, b) {
      return 1;
    }

    scrollToBottom(): void {
      try {
        let content = this.scrollChatContainer.contentViewChild.nativeElement;
        let scrollableHeight = content.scrollHeight - content.clientHeight;
        this.scrollChatContainer.scrollTop(scrollableHeight)
      } catch(err) {console.log(err) }                 
    }


    private onCloseConnection(event: CloseEvent): void {
      console.log(SERVICE_NAME, 'onClose', event);
      this.serverStatus = "Disconnected: ";

      switch (event.code) {
        case 1000: {
          this.serverStatus = "Disconnected: connection terminated correctly.";
          console.log('connection terminated correctly');
          break;
        }

        // User session is invalid and no connection should be opened again
        case 1003: {
          this.serverStatus = "Disconnected: session is invalid. connection is over";
          console.log('session is invalid. connection is over');
          this.socket.complete();
          break;
        }

        // Connection terminated abruptly (server problem?) and a reconnect should be attempted
        case 1006: {
          this.serverStatus = "Disconnected: session was terminated abruptly: will retry a reconnection";
          console.log('session was terminated abruptly: will retry a reconnection');
          break;
        }

        // Any other code
        default: {
          this.serverStatus = "Disconnected: unknown error: will retry a reconnection";
          console.log('Unknown error. Will retry a reconnection');
          break;
        }
      }
    }

    showUserNameInput(){
      this.userName = "";
      this.displayUserDialog = true;
    }

}
