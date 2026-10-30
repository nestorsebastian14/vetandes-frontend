import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Permiso } from '../auth/auth.model';
import { AuthService } from '../auth/auth-service';

/**
 * Exige el permiso declarado en la propia ruta:
 *
 *   { path: 'nueva', canActivate: [permisoGuard], data: { permiso: 'ATENCION_REGISTRAR' } }
 *
 * Si falta el permiso muestra «Acceso denegado» (no el login: el usuario ya
 * está identificado, así que la sesión continúa).
 *
 * Es una ayuda para la experiencia de usuario. La protección real la hace el
 * backend, que responde 403 aunque alguien escriba la ruta a mano o modifique
 * el JavaScript del navegador.
 */
export const permisoGuard: CanActivateFn = route => {
  const permiso = route.data['permiso'] as Permiso | undefined;
  if (!permiso || inject(AuthService).tienePermiso(permiso)) {
    return true;
  }
  return inject(Router).createUrlTree(['/acceso-denegado']);
};
