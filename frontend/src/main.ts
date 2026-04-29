import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';

import { AppShellComponent } from './app/app-shell.component';
import { routes } from './app/app.routes';

bootstrapApplication(AppShellComponent, {
  providers: [
    provideRouter(routes),
    provideHttpClient(),
  ],
}).catch((error) => {
  console.error(error);
});
