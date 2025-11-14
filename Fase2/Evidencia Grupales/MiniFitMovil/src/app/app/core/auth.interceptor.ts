import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable, from } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { TokenService } from './token.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private token: TokenService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return from(this.token.get()).pipe(
      switchMap(jwt => {
        if (jwt) {
          const authReq = req.clone({ setHeaders: { Authorization: `Bearer ${jwt}` }});
          return next.handle(authReq);
        }
        return next.handle(req);
      })
    );
  }
}
