import { Injectable } from '@angular/core';
import { CanDeactivate } from '@angular/router';
import { ChatComponent } from '../chat/chat.component';

@Injectable()
export class CanDeactivateGuard implements CanDeactivate<ChatComponent> {

  canDeactivate(component: ChatComponent): boolean {
    if(component.pendingmessages.size>0){
        if (confirm("Some messages hasn't been sent yet! If you leave, your pending messages will be lost.")) {
            return true;
        } else {
            return false;
        }
    }
    return true;
  }
}