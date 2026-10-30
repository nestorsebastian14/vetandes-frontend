import { Routes } from '@angular/router';
import { ReporteEspecieComponent } from './pages/reporte-especie/reporte-especie';

/** El permiso REPORTE_VER se exige en app.routes.ts, al entrar al módulo. */
export const REPORTES_ROUTES: Routes = [
  { path: '', component: ReporteEspecieComponent, title: 'Atenciones por especie' },
];
