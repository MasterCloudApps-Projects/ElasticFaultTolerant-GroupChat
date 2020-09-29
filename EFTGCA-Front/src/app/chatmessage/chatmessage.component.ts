import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-chatmessage',
  templateUrl: './chatmessage.component.html',
  styleUrls: ['./chatmessage.component.css']
})
export class ChatmessageComponent implements OnInit {

  @Input() type: string;
  @Input() ack: boolean;
  @Input() userName: string;
  @Input() text: string;
  @Input() date: Date;

  constructor() { 

  }

  ngOnInit(): void {
  }

  isSystemMessage(){
    return (this.type == "system")
  }

  getColor(){
    if (this.type=="sent")
      return "#cce6ff";
    else
      return "#ffffff";
  }

  isSent(){
    if (this.type=="sent")
      return this.ack;
    else
      return null;
  }


}
