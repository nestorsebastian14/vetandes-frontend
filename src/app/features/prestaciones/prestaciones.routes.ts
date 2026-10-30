import { Routes } from '@angular/router';
import { permisoGuard } from '../../core/guards/permiso-guard';
import { PrestacionList } from './pages/prestacion-list/prestacion-list';
import { PrestacionForm } from './pages/prestacion-form/prestacion-form';

/**
 * Rutas hijas del módulo, cargadas de forma diferida desde app.routes.ts.
 *
 * El mismo componente de formulario atiende «nuevo» y «:id/editar»: la
 * diferencia la hace el input id que llega de la URL.
 */
export const PRESTACIONES_ROUTES: Routes = [
  { path: '', component: PrestacionList, title: 'Prestaciones' },
  {
    path: 'nuevo',
    component: PrestacionForm,
    canActivate: [permisoGuard],
    data: { permiso: 'PRESTACION_ESCRIBIR' },
    title: 'Nueva prestación',
  },
  {
    path: ':id/editar',
    component: PrestacionForm,
    canActivate: [permisoGuard],
    data: { permiso: 'PRESTACION_ESCRIBIR' },
    title: 'Editar prestación',
  },
];
