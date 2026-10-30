import { computed, inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { map, Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LoginRequest, LoginResponse, PerfilResponse, Permiso, Sesion } from './auth.model';

/** Clave con la que se guarda la sesión en sessionStorage. */
const CLAVE_SESION = 'vetandes.sesion';

/**
 * Único dueño de la sesión en la SPA.
 *
 * - El estado vive en un signal, así el menú y los botones se recalculan solos
 *   al cambiar de usuario, sin recargar la página.
 * - Se persiste en sessionStorage con su vencimiento, para que F5 no obligue a
 *   iniciar sesión otra vez mientras el token siga vigente.
 * - Un temporizador cierra la sesión en el instante en que el token vence.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly url = `${environment.apiUrl}/auth`;

  private readonly sesionActual = signal<Sesion | null>(this.leerSesionGuardada());
  private temporizador?: ReturnType<typeof setTimeout>;
  private intervalo?: ReturnType<typeof setInterval>;

  readonly sesion = this.sesionActual.asReadonly();
  readonly autenticado = computed(() => this.sesionActual() !== null);

  /** Segundos que faltan para que venza el token (para el aviso de sesión). */
  readonly segundosRestantes = signal<number>(0);
  readonly porVencer = computed(() => {
    const sesion = this.sesionActual();
    return sesion !== null && this.segundosRestantes() > 0 && this.segundosRestantes() <= 120;
  });

  constructor() {
    // Si al abrir la pestaña ya había una sesión guardada y vigente, se retoma.
    const sesion = this.sesionActual();
    if (sesion) {
      this.programarExpiracion(sesion);
      this.iniciarCuentaRegresiva(sesion);
    }
  }

  /**
   * POST /auth/login. El backend responde con el token y la lista de permisos;
   * aquí solo se traduce expiraEnSegundos a un instante absoluto.
   */
  login(credenciales: LoginRequest): Observable<Sesion> {
    return this.http.post<LoginResponse>(`${this.url}/login`, credenciales).pipe(
      map(r => ({
        token: r.token,
        expiraEn: Date.now() + r.expiraEnSegundos * 1000,
        username: r.username ?? credenciales.username,
        nombreCompleto: r.nombreCompleto,
        roles: r.roles,
        permisos: r.permisos,
      })),
      tap(sesion => this.iniciar(sesion)),
    );
  }

  /** GET /auth/me: los permisos tal como los ve el servidor en este momento. */
  perfil(): Observable<PerfilResponse> {
    return this.http.get<PerfilResponse>(`${this.url}/me`);
  }

  /**
   * Borra la sesión y vuelve al login.
   * @param motivo 'expirada' agrega ?expirada=1 para avisar por qué se salió.
   * @param volverA URL que se recuerda en ?returnUrl= para regresar al entrar.
   */
  cerrarSesion(motivo?: 'expirada', volverA?: string): void {
    clearTimeout(this.temporizador);
    clearInterval(this.intervalo);
    this.segundosRestantes.set(0);
    sessionStorage.removeItem(CLAVE_SESION);
    this.sesionActual.set(null);

    const queryParams: Record<string, string> = {};
    if (motivo) queryParams['expirada'] = '1';
    if (volverA && !volverA.startsWith('/login')) queryParams['returnUrl'] = volverA;
    void this.router.navigate(['/login'], { queryParams });
  }

  /** El token solo se entrega si todavía no venció: lo usa el interceptor. */
  token(): string | null {
    const sesion = this.sesionActual();
    return sesion && Date.now() < sesion.expiraEn ? sesion.token : null;
  }

  /** Única pregunta que hace la SPA sobre autorización. Nunca compara roles. */
  tienePermiso(permiso: Permiso): boolean {
    return this.sesionActual()?.permisos.includes(permiso) ?? false;
  }

  private iniciar(sesion: Sesion): void {
    sessionStorage.setItem(CLAVE_SESION, JSON.stringify(sesion));
    this.sesionActual.set(sesion);
    this.programarExpiracion(sesion);
    this.iniciarCuentaRegresiva(sesion);
  }

  /** Cierre automático en el instante exacto en que el token vence. */
  private programarExpiracion(sesion: Sesion): void {
    clearTimeout(this.temporizador);
    const restante = sesion.expiraEn - Date.now();
    this.temporizador = setTimeout(
      () => this.cerrarSesion('expirada', this.router.url),
      Math.max(restante, 0),
    );
  }

  private iniciarCuentaRegresiva(sesion: Sesion): void {
    clearInterval(this.intervalo);
    this.segundosRestantes.set(Math.max(0, Math.floor((sesion.expiraEn - Date.now()) / 1000)));
    this.intervalo = setInterval(() => {
      const s = Math.max(0, Math.floor((sesion.expiraEn - Date.now()) / 1000));
      this.segundosRestantes.set(s);
      if (s === 0) clearInterval(this.intervalo);
    }, 1000);
  }

  /**
   * Lee la sesión de sessionStorage al arrancar.
   * Si expiraEn ya pasó (o alguien lo editó a un instante pasado), se descarta:
   * por eso basta con pulsar F5 para que la SPA vuelva a pedir el login.
   */
  private leerSesionGuardada(): Sesion | null {
    try {
      const texto = sessionStorage.getItem(CLAVE_SESION);
      if (!texto) return null;
      const sesion = JSON.parse(texto) as Sesion;
      if (!sesion.token || Date.now() >= sesion.expiraEn) {
        sessionStorage.removeItem(CLAVE_SESION);
        return null;
      }
      return sesion;
    } catch {
      sessionStorage.removeItem(CLAVE_SESION);
      return null;
    }
  }
}
