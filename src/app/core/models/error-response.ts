/**
 * Formato de error común de VetAndes API (sección 3.5 del examen).
 * Lo usan todas las respuestas 400, 401, 403, 404, 409 y 500.
 *
 * {
 *   "timestamp": "2026-10-29T09:14:22",
 *   "status": 400,
 *   "error": "Bad Request",
 *   "mensaje": "Datos inválidos",
 *   "ruta": "/api/v1/mascotas",
 *   "campos": { "fechaNacimiento": "La fecha de nacimiento no puede ser futura" }
 * }
 */
export interface ErrorResponse {
  timestamp: string;
  status: number;
  error: string;
  mensaje: string;
  ruta: string;
  /** Solo aparece en los errores de validación (400). */
  campos?: Record<string, string> | null;
}
