import { Component, OnInit, Input } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-chatmessage',
  templateUrl: './chatmessage.component.html',
  styleUrls: ['./chatmessage.component.css']
})
export class ChatmessageComponent implements OnInit {

  @Input() uuid: string;
  @Input() type: string;
  @Input() method: string;
  @Input() sent: string;
  @Input() ack: boolean;
  @Input() userName: string;
  @Input() text: any;
  @Input() date: Date;

  constructor(private domSanitizer: DomSanitizer, private http: HttpClient) { 

  }

  ngOnInit(): void {
  }

  isSystemMessage(){
    return (this.type == "system")
  }

  isTextMessage(){
    return (this.method == "textMessage")
  }

  isFileMessage(){
    return (this.method == "fileMessage")
  }

  isImageMessage(){
    return (this.method == "imageMessage")
  }

  getImgBase64() {
     return this.domSanitizer.bypassSecurityTrustUrl('data:image/png;base64,' + this.text);
  }

  getColor(){
    if (this.sent=="sent")
      return "#cce6ff";
    else
      return "#ffffff";
  }

  getUserNameColor(){
    return this.hashStringToColor(this.userName)
  }

  isSent(){
    if (this.sent=="sent")
      return this.ack;
    else
      return null;
  }

  hashStringToColor(str) {
    var hash = 0;
    for (var i = 0; i < str.length; i++) {
      hash = ((hash << 5) + hash) + str.charCodeAt(i); /* hash * 33 + c */
    }
    var r = (hash & 0xFF0000) >> 16;
    var g = (hash & 0x00FF00) >> 8;
    var b = hash & 0x0000FF;
    return "#" + ("0" + r.toString(16)).substr(-2) + ("0" + g.toString(16)).substr(-2) + ("0" + b.toString(16)).substr(-2);
  }


}
