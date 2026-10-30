import { Component, inject, input, OnInit, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import {
  EspecieAplicable,
  ESPECIES_APLICABLES,
  PATRON_CODIGO_PRESTACION,
  PrestacionRequest,
} from '../../../../core/models/prestacion.model';
import { PrestacionService } from '../../../../core/services/prestacion-service';
import { erroresDeCampos, mensajeError } from '../../../../core/utils/http-error';

/**
 * Formulario reactivo ÚNICO para registrar y editar.
 *
 * No hay dos componentes ni dos plantillas: /prestaciones/nuevo llega sin id y
 * /prestaciones/:id/editar llega con él. El id decide si se hace POST o PUT y
 * si se precargan los valores.
 *
 * Las validaciones son las mismas que declara el backend con Bean Validation;
 * aquí evitan un viaje inútil, pero el que manda es el backend: si responde
 * 400 con «campos», cada mensaje se pinta bajo su control.
 */
@Component({
  selector: 'app-prestacion-form',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './prestacion-form.html',
  styleUrl: './prestacion-form.css',
})
export class PrestacionForm implements OnInit {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly prestacionService = inject(PrestacionService);
  private readonly router = inject(Router);

  /** Llega desde la ruta ':id/editar' gracias a withComponentInputBinding(). */
  readonly id = input<string>();

  protected readonly especies = ESPECIES_APLICABLES;
  protected readonly cargando = signal(false);
  protected readonly guardando = signal(false);
  protected readonly error = signal<string | null>(null);
  /** Mensajes del objeto «campos» de un 400 del backend. */
  protected readonly erroresServidor = signal<Record<string, string>>({});

  protected readonly form = this.fb.group({
    codigo: ['', [Validators.required, Validators.pattern(PATRON_CODIGO_PRESTACION)]],
    nombre: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(80)]],
    precio: this.fb.control<number | null>(null, [Validators.required, Validators.min(0.01)]),
    especieAplicable: this.fb.control<EspecieAplicable | null>(null, Validators.required),
    activo: [true],
  });

  protected esEdicion(): boolean {
    return !!this.id();
  }

  ngOnInit(): void {
    const id = this.id();
    if (!id) return;

    this.cargando.set(true);
    this.prestacionService.obtener(Number(id)).subscribe({
      next: p => {
        this.form.setValue({
          codigo: p.codigo,
          nombre: p.nombre,
          precio: p.precio,
          especieAplicable: p.especieAplicable,
          activo: p.activo,
        });
        this.cargando.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(mensajeError(err));
        this.cargando.set(false);
      },
    });
  }

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const dto: PrestacionRequest = {
      codigo: v.codigo.trim().toUpperCase(),
      nombre: v.nombre.trim(),
      precio: Number(v.precio),
      especieAplicable: v.especieAplicable as EspecieAplicable,
      activo: v.activo,
    };

    const id = this.id();
    const peticion = id
      ? this.prestacionService.actualizar(Number(id), dto)
      : this.prestacionService.crear(dto);

    this.guardando.set(true);
    this.error.set(null);
    this.erroresServidor.set({});
    peticion.subscribe({
      next: () => void this.router.navigate(['/prestaciones']),
      error: (err: HttpErrorResponse) => {
        this.guardando.set(false);
        // 409 de RN-01 (código repetido) o 400 de validación: ambos se muestran.
        this.error.set(mensajeError(err));
        this.erroresServidor.set(erroresDeCampos(err));
      },
    });
  }
}
