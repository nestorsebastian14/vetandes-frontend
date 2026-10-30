import { Routes } from '@angular/router';
import { MainLayout } from './layout/main-layout/main-layout';
import { authGuard, invitadoGuard } from './core/guards/auth-guard';
import { permisoGuard } from './core/guards/permiso-guard';

/**
 * Mapa de rutas de VetAndes Web.
 *
 * Tres niveles de protección, de menor a mayor importancia:
 *   1. El menú oculta lo que el usuario no puede usar (comodidad).
 *   2. authGuard exige sesión y permisoGuard exige el permiso de data.
 *   3. El backend responde 401 o 403 aunque alguien se salte los dos primeros.
 *
 * Todos los módulos se cargan de forma diferida (loadChildren / loadComponent):
 * el navegador solo descarga el código del módulo que se abre.
 */
export const routes: Routes = [
  // El login vive FUERA del layout y solo lo ve quien no inició sesión.
  {
    path: 'login',
    title: 'Iniciar sesión · VetAndes',
    canActivate: [invitadoGuard],
    loadComponent: () => import('./features/auth/pages/login/login').then(m => m.Login),
  },

  // Todo lo que cuelga del layout exige sesión.
  {
    path: '',
    component: MainLayout,
    canActivate: [authGuard],
    canActivateChild: [authGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'inicio' },
      {
        path: 'inicio',
        title: 'Inicio · VetAndes',
        loadComponent: () => import('./features/inicio/inicio').then(m => m.Inicio),
      },
      {
        path: 'prestaciones',
        canActivate: [permisoGuard],
        data: { permiso: 'PRESTACION_LEER' },
        loadChildren: () =>
          import('./features/prestaciones/prestaciones.routes').then(m => m.PRESTACIONES_ROUTES),
      },
      {
        path: 'mascotas',
        canActivate: [permisoGuard],
        data: { permiso: 'MASCOTA_LEER' },
        loadChildren: () =>
          import('./features/mascotas/mascotas.routes').then(m => m.MASCOTAS_ROUTES),
      },
      {
        path: 'atenciones',
        canActivate: [permisoGuard],
        data: { permiso: 'ATENCION_LEER' },
        loadChildren: () =>
          import('./features/atenciones/atenciones.routes').then(m => m.ATENCIONES_ROUTES),
      },
      {
        path: 'reportes',
        canActivate: [permisoGuard],
        data: { permiso: 'REPORTE_VER' },
        loadChildren: () =>
          import('./features/reportes/reportes.routes').then(m => m.REPORTES_ROUTES),
      },
      {
        path: 'mi-cuenta',
        title: 'Mi cuenta · VetAndes',
        loadComponent: () =>
          import('./features/auth/pages/mi-cuenta/mi-cuenta').then(m => m.MiCuenta),
      },
      {
        path: 'acceso-denegado',
        title: 'Acceso denegado · VetAndes',
        loadComponent: () =>
          import('./shared/pages/acceso-denegado/acceso-denegado').then(m => m.AccesoDenegado),
      },
    ],
  },

  // Cualquier otra dirección: página 404.
  {
    path: '**',
    title: 'Página no encontrada · VetAndes',
    loadComponent: () =>
      import('./shared/pages/no-encontrado/no-encontrado').then(m => m.NoEncontrado),
  },
];
