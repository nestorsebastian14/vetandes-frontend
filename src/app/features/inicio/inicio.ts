import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth-service';
import { MENU } from '../../core/config/menu';
import { SiPermiso } from '../../shared/directives/si-permiso';

@Component({
  selector: 'app-inicio',
  imports: [RouterLink, SiPermiso],
  templateUrl: './inicio.html',
  styleUrl: './inicio.css',
})
export class Inicio {
  protected readonly auth = inject(AuthService);

  /** Accesos directos: los mismos módulos del menú, sin «Inicio». */
  protected readonly accesos = computed(() =>
    MENU.filter(i => i.ruta !== '/inicio' && (!i.permiso || this.auth.tienePermiso(i.permiso))));
}
