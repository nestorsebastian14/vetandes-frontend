import { Routes } from '@angular/router';
import { permisoGuard } from '../../core/guards/permiso-guard';
import { MascotaList } from './pages/mascota-list/mascota-list';
import { MascotaForm } from './pages/mascota-form/mascota-form';

/**
 * Rutas hijas cargadas de forma diferida.
 * Leer exige MASCOTA_LEER (se pide en app.routes.ts); escribir exige
 * MASCOTA_ESCRIBIR, que el veterinario no tiene.
 */
export const MASCOTAS_ROUTES: Routes = [
  { path: '', component: MascotaList, title: 'Mascotas' },
  {
    path: 'nuevo',
    component: MascotaForm,
    canActivate: [permisoGuard],
    data: { permiso: 'MASCOTA_ESCRIBIR' },
    title: 'Nueva mascota',
  },
  {
    path: ':id/editar',
    component: MascotaForm,
    canActivate: [permisoGuard],
    data: { permiso: 'MASCOTA_ESCRIBIR' },
    title: 'Editar mascota',
  },
];
