import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AnulacionRequest, Atencion, AtencionRequest, FiltroAtenciones } from '../models/atencion.model';

/**
 * Atenciones (cabecera–detalle).
 *
 *   POST  /atenciones                                     ATENCION_REGISTRAR
 *   GET   /atenciones?mascota&especie&estado&desde&hasta   ATENCION_LEER
 *   GET   /atenciones/{id}                                ATENCION_LEER
 *   PATCH /atenciones/{id}/anular                         ATENCION_ANULAR
 */
@Injectable({ providedIn: 'root' })
export class AtencionService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/atenciones`;

  /** Registro atómico: el backend guarda cabecera y detalles en una transacción. */
  registrar(dto: AtencionRequest): Observable<Atencion> {
    return this.http.post<Atencion>(this.url, dto);
  }

  obtener(id: number): Observable<Atencion> {
    return this.http.get<Atencion>(`${this.url}/${id}`);
  }

  /**
   * Consulta con los filtros del contrato. Solo se envían los que tienen
   * valor, de modo que son opcionales y combinables; el orden por fecha
   * descendente lo aplica el backend.
   */
  consultar(filtro: FiltroAtenciones): Observable<Atencion[]> {
    let params = new HttpParams();
    if (filtro.mascota) params = params.set('mascota', filtro.mascota.trim());
    if (filtro.especie) params = params.set('especie', filtro.especie);
    if (filtro.estado) params = params.set('estado', filtro.estado);
    if (filtro.desde) params = params.set('desde', filtro.desde);
    if (filtro.hasta) params = params.set('hasta', filtro.hasta);
    return this.http.get<Atencion[]>(this.url, { params });
  }

  /** Anulación con motivo obligatorio de 10 a 200 caracteres (RN-05). */
  anular(id: number, motivo: string): Observable<Atencion> {
    const cuerpo: AnulacionRequest = { motivo };
    return this.http.patch<Atencion>(`${this.url}/${id}/anular`, cuerpo);
  }
}
