import { BrowserModule } from '@angular/platform-browser';
import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from "@angular/common/http";

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ChatComponent } from './chat/chat.component';
import { ChatmessageComponent } from './chatmessage/chatmessage.component';

import { PanelModule } from 'primeng/panel';
import { ScrollPanelModule } from 'primeng/scrollpanel';
import { CardModule } from 'primeng/card';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule} from 'primeng/inputtext';
import { OverlayPanelModule } from 'primeng/overlaypanel';
import { FileUploadModule } from 'primeng/fileupload';

import { CanDeactivateGuard } from './guards/candeactivateguard';

@NgModule({
  declarations: [
    AppComponent,
    ChatComponent,
    ChatmessageComponent
  ],
  imports: [
    HttpClientModule,
    BrowserModule,BrowserAnimationsModule,FormsModule,
    AppRoutingModule,
    PanelModule,ScrollPanelModule,CardModule,DialogModule,ButtonModule,InputTextModule,OverlayPanelModule,FileUploadModule
  ],
  schemas: [ CUSTOM_ELEMENTS_SCHEMA ],
  providers: [CanDeactivateGuard],
  bootstrap: [AppComponent]
})
export class AppModule { }


