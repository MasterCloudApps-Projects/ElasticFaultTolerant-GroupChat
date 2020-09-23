import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ChatComponent } from './chat/chat.component';
import { CanDeactivateGuard } from './guards/candeactivateguard';

const routes: Routes = [
  { path: '', component: ChatComponent,canDeactivate: [CanDeactivateGuard] },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
