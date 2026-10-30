import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../auth/auth-service';

/**
 * Diferencia 401 de 403, que es la distinción central de la seguridad:
 *
 * - 401 «no sé quién eres»: el token falta, venció o fue alterado. Se cierra
 *   la sesión y se vuelve al login recordando la página actual en ?returnUrl=.
 *   Se excluye el propio /auth/login, donde un 401 significa «usuario o
 *   contraseña incorrectos» y lo muestra el formulario.
 *
 * - 403 «sé quién eres, pero no puedes»: el usuario está autenticado y le
 *   falta el permiso. NO se cierra la sesión: la recepcionista que intenta ver
 *   el reporte sigue trabajando, solo ve el mensaje del backend.
 *
 * En ambos casos el error se vuelve a lanzar para que el componente lo reciba
 * y pueda pintar el mensaje.
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401 && !req.url.endsWith('/auth/login')) {
        auth.cerrarSesion('expirada', router.url);
      }
      return throwError(() => err);
    }),
  );
};
