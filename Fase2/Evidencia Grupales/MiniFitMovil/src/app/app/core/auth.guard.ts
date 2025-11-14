import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { TokenService } from './token.service';

export const authGuard: CanActivateFn = async () => {
  const tokenSvc = inject(TokenService);
  const router = inject(Router);
  const has = await tokenSvc.get();
  if (!has) {
    router.navigateByUrl('/auth/login', { replaceUrl: true });
    return false;
  }
  return true;
};
