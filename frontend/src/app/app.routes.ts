import { Routes } from '@angular/router';
import { AppComponent } from './app.component';
import { CallbackComponent } from './callback/callback.component';
import { PrivacyComponent } from './privacy/privacy.component';

export const routes: Routes = [
  { path: '', component: AppComponent },
  { path: 'callback', component: CallbackComponent },
  { path: 'privacy', component: PrivacyComponent },
  { path: '**', redirectTo: '' },
];
