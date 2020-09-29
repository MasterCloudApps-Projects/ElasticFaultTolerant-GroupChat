import { Component, OnInit, ViewChild, HostListener} from '@angular/core';
import { UUID } from 'angular2-uuid';

import { Message } from '../model/message';
import { retryWhen, tap, concatMap, delay, repeatWhen, mapTo } from 'rxjs/operators';
import { fromEvent, iif, merge, Observable, of, throwError } from 'rxjs';
import { WebSocketSubject, WebSocketSubjectConfig } from 'rxjs/webSocket';
import { ScrollPanel } from 'primeng/scrollpanel';
import { ViewEncapsulation } from "@angular/core";

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

  private config: WebSocketSubjectConfig<any>;
  private socket: WebSocketSubject<any>;
  private onlineCheck: Observable<boolean>;

  private reconnectInterval: number = 5000;
  private reconnectAttempts: number = 20;

  userId:string   = "User.1@user.com";
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
        if (this.pendingmessages.size > 0) {
            $event.returnValue =true;
        }
  }


  constructor() {

    this.configSocket();

    this.chatmessages = new Map();
    this.pendingmessages = new Map();

    this.servicemessages = new Map();

    this.onlineCheck = merge(
      of(navigator.onLine),
        fromEvent(window, 'online').pipe(mapTo(true)),
        fromEvent(window, 'offline').pipe(mapTo(false)));
      this.connect();
    }

    ngOnInit(): void {
      this.displayRoomDialog = true;
      this.sessionId = UUID.UUID();
    }

    ngOnDestroy(): void {
      this.disconnect();
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
        this.registerUser();
      }
      else
        this.displayUserDialog = true;
    }

    registerUser(){
      let message: Message = {
            "jsonrpc": "2.0",
            "method": "joinRoom",
            "params": {
              userId: this.userId,
              roomName: this.roomName,
              userName: this.userName,
            },
            "id": this.messageId
      }
      this.servicemessages.set(this.messageId, message);
      console.log("Registering user: ", message);
      this.socket.next(message);
      this.messageId++;
    }

    reconnectUser(){
      let message = {
            "jsonrpc": "2.0",
            "method": "reconnect",
            "params": {
              sessionId: this.sessionId,
              userId: this.userId,
              room: this.roomName,
              user: this.userName,
            },
            "id": this.messageId
      }
      this.servicemessages.set(this.messageId, message);
      console.log("Reconnecting user: ", message);
      this.socket.next(message);
      this.messageId++;
    }

    public reconnect(){
      this.disconnect();
      this.connect();
    }

    public connect(): void {
      if (this.socket != null){
        this.socket.complete();
      }

      this.socket = new WebSocketSubject(this.config);
      this.socket
        .pipe(
          retryWhen((errors) => {
              return errors.pipe(
                tap((error) => { console.log('Error Retry: ', error); }),
                concatMap((e, i) =>
                  iif(
                    () => i < this.reconnectAttempts,
                    of(e).pipe(delay(this.reconnectInterval)),
                    throwError('Max amount of retries reached')
                  )));
          })
         //,
         // repeatWhen((event) => {
         //   return event.pipe(
         //     tap((error) => { console.log('Error Repeat: ', event); }),
         //     concatMap((e, i) =>
         //       iif(
         //         () => i < this.reconnectAttempts,
         //         of(e).pipe(delay(this.reconnectInterval)),
         //         throwError('Max amount of retries reached')
         //       )));
         //})
         )
        .subscribe(
          (message: Message) => { this.onMessage(message); },
          (error: Event) => { this.onError(error); },
          () => { 
            console.log('completed');
          });
    }

    public disconnect(): void {
      this.scrollToBottom();
      this.socket.complete();
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

    private configSocket(): void {
      const url: string   = environment.CHAT_URL;
      this.config = {
        url,
        openObserver: { next: (event: Event) => { this.onOpenConnection(event); } },
        closeObserver: { next: (event: CloseEvent) => { this.onCloseConnection(event); } },
        closingObserver: { next: () => { this.onClosingConnection(); } }
      };
    }


    private onOpenConnection(event: Event): void {
      if(this.connected == true){
        this.reconnectUser();
      }
      console.log(SERVICE_NAME, 'onOpen', event);
      console.log(SERVICE_NAME, 'Sending all pending messages...', event);
      this.serverStatus = "Connected";
      this.connected = true;
      this.sendAllMesssages();
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

    private onClosingConnection(): void {
      this.serverStatus = "Closing connection";
      console.log(SERVICE_NAME, 'onClosing');
    }

    private isServiceResponse(messageId: number): boolean{
      return this.servicemessages.has(messageId);
    }

    private isErrorMessage(message: Message): boolean{
      return message.error != null;
    }

    private onMessage(message: Message) {
      console.log(SERVICE_NAME, 'onMessage', message);

      if (this.isServiceResponse(message.id)){
          if (this.servicemessages.get(message.id).method == "joinRoom" && message.result == "OK"){
            this.userStatus = "joined as " + this.userName;
            this.displayUserDialog = false;
            return;
          }
      }

      if(this.isErrorMessage(message)){
        if(message.error.code == "-32001"){
          this.userStatus = "unjoined.....";
          this.showUserNameInput();
          return;
        }
      }

      if (message.method == "reconnect"){
        this.reconnect();
        return;
      }

      if (message.params.room != this.roomName){
        return;
      }

      if (message.params.type == "system"){
          this.chatmessages.set(UUID.UUID(),message);
          return;
      }

      // if is my message set it like received and delete form pending list
      if(message.params.user == this.userName){
          message.params.ack = true;
          this.pendingmessages.delete(message.params.uuid);
      }
      else{
          message.params.type = "received";
      }

      this.chatmessages.set(message.params.uuid,message);
      setTimeout(() => this.scrollToBottom(), 500)
    }

    private onError(event: Event) {
      console.log(SERVICE_NAME, 'onError', event);
    }

  sendMessage() {
    if (this.messageText!=""){

      let message = {
        "jsonrpc": "2.0",
        "method": "textMessage",
        "params": {
          userId: this.userId,
          room: this.roomName,
          user: this.userName,
          text: this.messageText,
          type: "sent",
          ack: false,
          uuid: UUID.UUID(),
          date: new Date()
        },
        "id": this.messageId
      }

      this.chatmessages.set(message.params.uuid,message);
      this.pendingmessages.set(message.params.uuid,message);
      this.messageId++;

      console.log("New message from client to websocket: ", message);
      this.sendAllMesssages();
      this.messageText = "";


      setTimeout(() => this.scrollToBottom(), 500);
    }
  }

  sendAllMesssages(){
    let i=1;
    this.pendingmessages.forEach(message => {
      this.socket.next(message);
    });
  }

}
