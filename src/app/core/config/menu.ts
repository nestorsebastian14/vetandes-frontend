import { Permiso } from '../auth/auth.model';

export interface MenuItem {
  etiqueta: string;
  ruta: string;
  icono: string;
  /** Permiso necesario para ver la opción; sin permiso, la opción no se muestra. */
  permiso?: Permiso;
}

/**
 * Menú único de la SPA. El sidebar lo filtra por permiso, así que la
 * recepcionista no ve «Reportes» y el veterinario no ve «Nueva atención».
 *
 * Ocultar la opción es solo comodidad: la protección real la hacen el
 * permisoGuard de la ruta y, sobre todo, el backend con su 403.
 */
export const MENU: MenuItem[] = [
  { etiqueta: 'Inicio', ruta: '/inicio', icono: '🏠' },
  { etiqueta: 'Prestaciones', ruta: '/prestaciones', icono: '🩺', permiso: 'PRESTACION_LEER' },
  { etiqueta: 'Mascotas', ruta: '/mascotas', icono: '🐾', permiso: 'MASCOTA_LEER' },
  { etiqueta: 'Atenciones', ruta: '/atenciones', icono: '📋', permiso: 'ATENCION_LEER' },
  { etiqueta: 'Reportes', ruta: '/reportes', icono: '📊', permiso: 'REPORTE_VER' },
];
