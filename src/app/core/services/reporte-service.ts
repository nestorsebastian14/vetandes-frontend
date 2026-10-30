import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ReporteEspecie } from '../models/reporte.model';

/** GET /reportes/atenciones-por-especie?desde&hasta · permiso REPORTE_VER. */
@Injectable({ providedIn: 'root' })
export class ReporteService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/reportes`;

  atencionesPorEspecie(desde: string | null, hasta: string | null): Observable<ReporteEspecie[]> {
    let params = new HttpParams();
    if (desde) params = params.set('desde', desde);
    if (hasta) params = params.set('hasta', hasta);
    return this.http.get<ReporteEspecie[]>(`${this.url}/atenciones-por-especie`, { params });
  }
}
