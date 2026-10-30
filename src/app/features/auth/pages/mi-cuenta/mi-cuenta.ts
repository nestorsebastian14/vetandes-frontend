import { Component, inject, OnInit, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../../../core/auth/auth-service';
import { PerfilResponse } from '../../../../core/auth/auth.model';
import { mensajeError } from '../../../../core/utils/http-error';

/**
 * Muestra lo que GET /auth/me responde: quién soy SEGÚN EL SERVIDOR.
 *
 * Sirve para la defensa: si los permisos del token ya no coinciden con los que
 * el backend reconoce ahora, aquí se nota y se avisa que hay que volver a
 * iniciar sesión para recibir un token nuevo.
 */
@Component({
  selector: 'app-mi-cuenta',
  imports: [],
  templateUrl: './mi-cuenta.html',
  styleUrl: './mi-cuenta.css',
})
export class MiCuenta implements OnInit {
  private readonly auth = inject(AuthService);

  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly perfil = signal<PerfilResponse | null>(null);
  protected readonly permisosCambiaron = signal(false);

  ngOnInit(): void {
    this.auth.perfil().subscribe({
      next: datos => {
        this.perfil.set(datos);
        this.cargando.set(false);

        const sesion = this.auth.sesion();
        if (sesion) {
          const delServidor = [...datos.permisos].sort().join(',');
          const delToken = [...sesion.permisos].sort().join(',');
          this.permisosCambiaron.set(delServidor !== delToken);
        }
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(mensajeError(err));
        this.cargando.set(false);
      },
    });
  }
}
