import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { EspecieAplicable, Prestacion, PrestacionRequest } from '../models/prestacion.model';

/**
 * Catálogo de prestaciones.
 *
 * Rutas del contrato (sección 3.4):
 *   GET    /prestaciones?especie     PRESTACION_LEER
 *   POST   /prestaciones             PRESTACION_ESCRIBIR
 *   GET    /prestaciones/{id}        PRESTACION_LEER
 *   PUT    /prestaciones/{id}        PRESTACION_ESCRIBIR
 *   DELETE /prestaciones/{id}        PRESTACION_ESCRIBIR
 *   PATCH  /prestaciones/{id}/estado PRESTACION_ESCRIBIR
 */
@Injectable({ providedIn: 'root' })
export class PrestacionService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/prestaciones`;

  /** El filtro «especie» se envía solo si tiene valor. */
  listar(especie?: EspecieAplicable | null): Observable<Prestacion[]> {
    let params = new HttpParams();
    if (especie) params = params.set('especie', especie);
    return this.http.get<Prestacion[]>(this.url, { params });
  }

  obtener(id: number): Observable<Prestacion> {
    return this.http.get<Prestacion>(`${this.url}/${id}`);
  }

  crear(dto: PrestacionRequest): Observable<Prestacion> {
    return this.http.post<Prestacion>(this.url, dto);
  }

  actualizar(id: number, dto: PrestacionRequest): Observable<Prestacion> {
    return this.http.put<Prestacion>(`${this.url}/${id}`, dto);
  }

  /**
   * Baja física. Si la prestación ya se usó en alguna atención el backend
   * responde 409 y la SPA ofrece la baja lógica con cambiarEstado() (RN-01).
   */
  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }

  /** Baja o alta lógica: PATCH /prestaciones/{id}/estado. */
  cambiarEstado(id: number, activo: boolean): Observable<Prestacion> {
    return this.http.patch<Prestacion>(`${this.url}/${id}/estado`, { activo });
  }
}
