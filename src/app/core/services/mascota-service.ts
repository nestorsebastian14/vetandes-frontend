import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Mascota, MascotaRequest } from '../models/mascota.model';

/**
 * Mascotas (tabla dependiente de propietario).
 *
 *   GET    /mascotas?propietarioId  MASCOTA_LEER
 *   POST   /mascotas                MASCOTA_ESCRIBIR
 *   GET    /mascotas/{id}           MASCOTA_LEER
 *   PUT    /mascotas/{id}           MASCOTA_ESCRIBIR
 *   DELETE /mascotas/{id}           MASCOTA_ESCRIBIR
 */
@Injectable({ providedIn: 'root' })
export class MascotaService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/mascotas`;

  /** El filtro por propietario lo resuelve el backend, no un filter() local. */
  listar(propietarioId?: number | null): Observable<Mascota[]> {
    let params = new HttpParams();
    if (propietarioId) params = params.set('propietarioId', propietarioId);
    return this.http.get<Mascota[]>(this.url, { params });
  }

  obtener(id: number): Observable<Mascota> {
    return this.http.get<Mascota>(`${this.url}/${id}`);
  }

  crear(dto: MascotaRequest): Observable<Mascota> {
    return this.http.post<Mascota>(this.url, dto);
  }

  actualizar(id: number, dto: MascotaRequest): Observable<Mascota> {
    return this.http.put<Mascota>(`${this.url}/${id}`, dto);
  }

  /** Una mascota con atenciones no se puede eliminar: el backend responde 409 (RN-02). */
  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}
