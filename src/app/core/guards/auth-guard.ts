import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../auth/auth-service';

/**
 * Exige sesión. Se aplica al layout completo (canActivate y canActivateChild),
 * así que protege de una vez todas las páginas privadas.
 *
 * Si no hay sesión envía al login y recuerda la URL pedida en ?returnUrl=,
 * para volver allí después de entrar.
 */
export const authGuard: CanActivateFn = (_route, state) => {
  if (inject(AuthService).autenticado()) {
    return true;
  }
  return inject(Router).createUrlTree(['/login'], {
    queryParams: { returnUrl: state.url },
  });
};

/** El login solo es para quien NO ha iniciado sesión. */
export const invitadoGuard: CanActivateFn = () =>
  inject(AuthService).autenticado() ? inject(Router).createUrlTree(['/inicio']) : true;
