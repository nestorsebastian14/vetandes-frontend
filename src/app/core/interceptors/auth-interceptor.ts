import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { environment } from '../../../environments/environment';
import { AuthService } from '../auth/auth-service';

/**
 * ÚNICO punto donde se agrega el encabezado Authorization.
 *
 * Ningún servicio sabe nada del token: si mañana cambia el esquema, se cambia
 * aquí y nada más. Si cada servicio lo agregara por su cuenta, bastaría con
 * olvidarlo en uno para que ese recurso dejara de funcionar (y el token se
 * repetiría en ocho sitios distintos).
 *
 * El encabezado se agrega solo a las peticiones dirigidas a environment.apiUrl:
 * así el token no se filtra a ningún otro servidor.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = inject(AuthService).token();

  // Sin token, o hacia otro servidor: la petición sale tal cual.
  if (!token || !req.url.startsWith(environment.apiUrl)) {
    return next(req);
  }

  // HttpRequest es inmutable: se envía una copia con el encabezado.
  return next(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }));
};
