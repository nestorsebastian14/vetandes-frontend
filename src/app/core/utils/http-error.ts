import { HttpErrorResponse } from '@angular/common/http';
import { ErrorResponse } from '../models/error-response';

/**
 * Mensaje que se muestra en pantalla. Siempre se prefiere el texto que envía
 * el backend en «mensaje»: las reglas de negocio viven allí, y la SPA solo
 * las repite.
 */
export function mensajeError(err: HttpErrorResponse): string {
  if (err.status === 0) {
    return 'No se pudo conectar con VetAndes API. Verifique que el backend esté en ejecución y que CORS permita http://localhost:4200.';
  }
  const cuerpo = err.error as ErrorResponse | null;
  return cuerpo?.mensaje ?? `Error ${err.status}: ${err.statusText}`;
}

/**
 * Mapa «campo → mensaje» de un 400 de validación, para pintarlo bajo cada
 * control del formulario. Si el error no es de validación, devuelve {}.
 */
export function erroresDeCampos(err: HttpErrorResponse): Record<string, string> {
  const cuerpo = err.error as ErrorResponse | null;
  return cuerpo?.campos ?? {};
}
