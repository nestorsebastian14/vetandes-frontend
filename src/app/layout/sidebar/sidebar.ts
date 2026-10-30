import { Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MENU } from '../../core/config/menu';
import { AuthService } from '../../core/auth/auth-service';

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
})
export class Sidebar {
  private readonly auth = inject(AuthService);

  /**
   * Solo las opciones para las que el usuario tiene permiso.
   *
   * Es un computed sobre el signal de la sesión: al entrar con otro usuario el
   * menú se recalcula solo, sin recargar la página y sin que nadie lo avise.
   */
  protected readonly menu = computed(() =>
    MENU.filter(item => !item.permiso || this.auth.tienePermiso(item.permiso)));
}
