/**
 * Permisos que emite VetAndes API (enum Permiso del backend, matriz 3.2 del examen).
 *
 * La SPA nunca decide por el nombre del rol: siempre pregunta por el permiso.
 * Un usuario con varios roles recibe la unión de sus permisos.
 */
export type Permiso =
  | 'PRESTACION_LEER'
  | 'PRESTACION_ESCRIBIR'
  | 'MASCOTA_LEER'
  | 'MASCOTA_ESCRIBIR'
  | 'ATENCION_LEER'
  | 'ATENCION_REGISTRAR'
  | 'ATENCION_ANULAR'
  | 'REPORTE_VER';

/** Lo que se envía a POST /auth/login. */
export interface LoginRequest {
  username: string;
  password: string;
}

/** Lo que devuelve POST /auth/login (LoginResponseDTO). */
export interface LoginResponse {
  token: string;
  tipo: string;
  expiraEnSegundos: number;
  username?: string;
  nombreCompleto: string;
  roles: string[];
  permisos: Permiso[];
}

/** Lo que devuelve GET /auth/me: el usuario del token, según el servidor. */
export interface PerfilResponse {
  username: string;
  nombreCompleto: string;
  roles: string[];
  permisos: Permiso[];
}

/**
 * Sesión guardada en el navegador.
 *
 * Se guarda en sessionStorage (no en localStorage) porque la computadora de
 * recepción se comparte entre turnos: al cerrar la pestaña la sesión muere.
 */
export interface Sesion {
  token: string;
  /** Momento de expiración en milisegundos (Date.now() + expiraEnSegundos * 1000). */
  expiraEn: number;
  username: string;
  nombreCompleto: string;
  roles: string[];
  permisos: Permiso[];
}
