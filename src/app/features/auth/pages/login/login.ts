import { Component, inject, input, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/auth/auth-service';
import { erroresDeCampos, mensajeError } from '../../../../core/utils/http-error';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);

  /** ?returnUrl=/atenciones → página a la que se vuelve después de entrar. */
  readonly returnUrl = input<string>();
  /** ?expirada=1 → la sesión anterior venció. */
  readonly expirada = input<string>();

  protected readonly enviando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly verClave = signal(false);

  protected readonly form = this.fb.group({
    username: ['', [Validators.required, Validators.maxLength(30)]],
    password: ['', [Validators.required, Validators.maxLength(72)]],
  });

  entrar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.enviando.set(true);
    this.error.set(null);
    this.auth.login(this.form.getRawValue()).subscribe({
      next: () => void this.router.navigateByUrl(this.destino()),
      error: (err: HttpErrorResponse) => {
        // 400 → detalle de validación; 401 → el mismo mensaje para usuario
        // inexistente, contraseña incorrecta y cuenta inactiva.
        const campos = Object.values(erroresDeCampos(err));
        this.error.set(campos.length ? campos.join('. ') : mensajeError(err));
        this.form.controls.password.reset();
        this.enviando.set(false);
      },
    });
  }

  /**
   * Solo se aceptan rutas internas de la SPA ("/atenciones"), nunca direcciones
   * externas ("https://…" o "//sitio"): evita una redirección abierta.
   */
  private destino(): string {
    const url = this.returnUrl();
    return url && url.startsWith('/') && !url.startsWith('//') ? url : '/inicio';
  }
}
