import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { provideIonicAngular } from '@ionic/angular/standalone';

import { AppComponent } from './app/app.component';
import { appRoutes } from './app/app.routes';
import { AuthInterceptor } from './app/app/core/auth.interceptor'; // ajusta ruta si difiere
import { registerables } from 'chart.js';
import { Chart } from 'chart.js';
Chart.register(...registerables);

bootstrapApplication(AppComponent, {
  providers: [
    provideIonicAngular(),            // Ionic para standalone
    provideRouter(appRoutes),         // Rutas standalone
    provideHttpClient(withInterceptorsFromDi()),
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
  ],
}).catch(err => console.error(err));