import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

/** Página de la ruta comodín '**'. */
@Component({
  selector: 'app-no-encontrado',
  imports: [RouterLink],
  template: `
    <section class="page">
      <div class="card">
        <h2>404 · Página no encontrada</h2>
        <p>La dirección que escribió no corresponde a ninguna pantalla de VetAndes Web.</p>
        <a routerLink="/inicio" class="btn btn-primary">Volver al inicio</a>
      </div>
    </section>
  `,
})
export class NoEncontrado {}
