import { Routes } from '@angular/router';
import { permisoGuard } from '../../core/guards/permiso-guard';
import { AtencionList } from './pages/atencion-list/atencion-list';
import { AtencionForm } from './pages/atencion-form/atencion-form';
import { AtencionDetalle } from './pages/atencion-detalle/atencion-detalle';

/**
 * Rutas hijas cargadas de forma diferida.
 *
 * 'nueva' va ANTES de ':id' para que el router no interprete la palabra
 * «nueva» como un identificador.
 *
 * La ruta 'nueva' declara su permiso en data: por eso, escribir
 * /atenciones/nueva a mano con el usuario VETERINARIO (que no tiene
 * ATENCION_REGISTRAR) termina en la página «Acceso denegado», sin cerrar
 * la sesión.
 */
export const ATENCIONES_ROUTES: Routes = [
  { path: '', component: AtencionList, title: 'Atenciones' },
  {
    path: 'nueva',
    component: AtencionForm,
    canActivate: [permisoGuard],
    data: { permiso: 'ATENCION_REGISTRAR' },
    title: 'Nueva atención',
  },
  { path: ':id', component: AtencionDetalle, title: 'Detalle de la atención' },
];
