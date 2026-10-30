import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * Página a la que envía el permisoGuard.
 *
 * Importante: llegar aquí NO cierra la sesión. El usuario sigue identificado;
 * simplemente le falta el permiso de esa ruta, igual que el backend
 * respondería 403 si llamara al endpoint directamente.
 */
@Component({
  selector: 'app-acceso-denegado',
  imports: [RouterLink],
  template: `
    <section class="page">
      <div class="card">
        <h2>403 · Acceso denegado</h2>
        <p>
          Su usuario no tiene el permiso necesario para abrir esta página.
          Su sesión sigue activa: puede seguir trabajando en los demás módulos.
        </p>
        <p>Si necesita este acceso, solicítelo al administrador del sistema.</p>
        <a routerLink="/inicio" class="btn btn-primary">Volver al inicio</a>
      </div>
    </section>
  `,
})
export class AccesoDenegado {}
