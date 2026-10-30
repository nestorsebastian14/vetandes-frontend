import { Component, computed, inject, input, OnInit, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/auth/auth-service';
import { Atencion } from '../../../../core/models/atencion.model';
import { AtencionService } from '../../../../core/services/atencion-service';
import { mensajeError } from '../../../../core/utils/http-error';
import { SiPermiso } from '../../../../shared/directives/si-permiso';

/**
 * Detalle de una atención y acción «Anular» con motivo (RN-05).
 *
 * El botón de anular solo se ve con el permiso ATENCION_ANULAR, pero quien
 * no lo tenga y llame al endpoint recibirá 403 del backend igualmente.
 */
@Component({
  selector: 'app-atencion-detalle',
  imports: [ReactiveFormsModule, RouterLink, SiPermiso, CurrencyPipe, DatePipe],
  templateUrl: './atencion-detalle.html',
  styleUrl: './atencion-detalle.css',
})
export class AtencionDetalle implements OnInit {
  private readonly atencionService = inject(AtencionService);
  private readonly auth = inject(AuthService);

  readonly id = input.required<string>();
  /** Llega como ?nueva=1 justo después de registrar. */
  readonly nueva = input<string>();

  protected readonly atencion = signal<Atencion | null>(null);
  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly aviso = signal<string | null>(null);

  protected readonly anulando = signal(false);
  protected readonly mostrarFormulario = signal(false);

  /** Motivo obligatorio de 10 a 200 caracteres, igual que exige RN-05. */
  protected readonly motivo = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.minLength(10), Validators.maxLength(200)],
  });

  protected readonly puedeAnular = computed(() => {
    const a = this.atencion();
    return !!a && a.estado === 'REGISTRADA' && this.auth.tienePermiso('ATENCION_ANULAR');
  });

  protected readonly unidades = computed(() =>
    (this.atencion()?.detalles ?? []).reduce((suma, d) => suma + d.cantidad, 0));

  ngOnInit(): void {
    this.atencionService.obtener(Number(this.id())).subscribe({
      next: a => {
        this.atencion.set(a);
        this.cargando.set(false);
        if (this.nueva()) {
          this.aviso.set(`Atención ${a.numero} registrada correctamente.`);
        }
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(mensajeError(err));
        this.cargando.set(false);
      },
    });
  }

  anular(): void {
    if (this.motivo.invalid) {
      this.motivo.markAsTouched();
      return;
    }
    const a = this.atencion();
    if (!a) return;

    this.anulando.set(true);
    this.error.set(null);
    this.aviso.set(null);
    this.atencionService.anular(a.id, this.motivo.value.trim()).subscribe({
      next: actualizada => {
        this.atencion.set(actualizada);
        this.anulando.set(false);
        this.mostrarFormulario.set(false);
        this.motivo.reset();
        this.aviso.set(`Atención ${actualizada.numero} anulada.`);
      },
      error: (err: HttpErrorResponse) => {
        // 409 si ya estaba anulada o pasaron más de 48 horas; 400 si el motivo
        // no cumple; 403 si el usuario no tiene el permiso. El backend decide.
        this.anulando.set(false);
        this.error.set(mensajeError(err));
      },
    });
  }
}
