import { Routes } from '@angular/router';
import { AppComponent } from './app.component';
import { CallbackComponent } from './callback/callback.component';
import { EditorComponent } from './editor/editor.component';

export const routes: Routes = [
  { path: '', component: AppComponent },
  { path: 'callback', component: CallbackComponent },
  { path: 'editor', component: EditorComponent },
  { path: '**', redirectTo: '' },
];
