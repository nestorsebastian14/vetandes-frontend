import { Directive, effect, inject, input, TemplateRef, ViewContainerRef } from '@angular/core';
import { Permiso } from '../../core/auth/auth.model';
import { AuthService } from '../../core/auth/auth-service';

/**
 * Muestra el elemento solo si el usuario tiene el permiso:
 *
 *   <a *appSiPermiso="'ATENCION_REGISTRAR'" routerLink="nueva">+ Nueva atención</a>
 *
 * Como tienePermiso() lee un signal, el effect vuelve a evaluarse cuando la
 * sesión cambia: al entrar con otro usuario los botones aparecen o desaparecen
 * sin recargar la página.
 *
 * Es solo experiencia de usuario. Ocultar un botón no autoriza nada: el
 * backend rechaza igualmente la operación con 403.
 */
@Directive({ selector: '[appSiPermiso]' })
export class SiPermiso {
  private readonly auth = inject(AuthService);
  private readonly plantilla = inject(TemplateRef);
  private readonly contenedor = inject(ViewContainerRef);
  private visible = false;

  readonly appSiPermiso = input.required<Permiso>();

  constructor() {
    effect(() => {
      const permitido = this.auth.tienePermiso(this.appSiPermiso());
      if (permitido && !this.visible) {
        this.contenedor.createEmbeddedView(this.plantilla);
        this.visible = true;
      } else if (!permitido && this.visible) {
        this.contenedor.clear();
        this.visible = false;
      }
    });
  }
}
