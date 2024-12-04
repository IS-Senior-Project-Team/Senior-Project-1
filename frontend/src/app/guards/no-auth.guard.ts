import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const noAuthGuard: CanActivateFn = (route, state) => {
  let authSvc = inject(AuthService);
  let router = inject(Router);

  if (authSvc.isLoggedIn()) {
  return true;
  } else {
    alert("You must be logged in to view this")
    router.navigate(['login'])
    return false;
  }
};
