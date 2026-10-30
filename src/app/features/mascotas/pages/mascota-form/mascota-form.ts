import { Component, computed, inject, input, OnInit, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { Especie, ESPECIES, MascotaRequest, Sexo, SEXOS } from '../../../../core/models/mascota.model';
import { Propietario } from '../../../../core/models/propietario.model';
import { MascotaService } from '../../../../core/services/mascota-service';
import { PropietarioService } from '../../../../core/services/propietario-service';
import { edadTexto, hoyISO } from '../../../../core/utils/fechas';
import { erroresDeCampos, mensajeError } from '../../../../core/utils/http-error';
import { noFutura } from '../../../../core/utils/validadores';

/**
 * Formulario reactivo único de mascotas (registrar y editar).
 *
 * La lista desplegable de propietarios se carga desde GET /propietarios: no
 * hay ningún arreglo escrito a mano en la SPA.
 */
@Component({
  selector: 'app-mascota-form',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './mascota-form.html',
  styleUrl: './mascota-form.css',
})
export class MascotaForm implements OnInit {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly mascotaService = inject(MascotaService);
  private readonly propietarioService = inject(PropietarioService);
  private readonly router = inject(Router);

  /** Llega desde la ruta ':id/editar' gracias a withComponentInputBinding(). */
  readonly id = input<string>();

  protected readonly especies = ESPECIES;
  protected readonly sexos = SEXOS;
  protected readonly maxFecha = hoyISO();

  protected readonly propietarios = signal<Propietario[]>([]);
  protected readonly cargando = signal(true);
  protected readonly guardando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly erroresServidor = signal<Record<string, string>>({});

  protected readonly form = this.fb.group({
    nombre: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(40)]],
    especie: this.fb.control<Especie | null>(null, Validators.required),
    raza: ['', [Validators.maxLength(40)]],
    // noFutura replica @PastOrPresent del backend
    fechaNacimiento: ['', [Validators.required, noFutura]],
    sexo: this.fb.control<Sexo | null>(null, Validators.required),
    propietarioId: this.fb.control<number | null>(null, Validators.required),
  });

  /**
   * Vista previa de la edad mientras se elige la fecha.
   * El valor del control se convierte en signal, así el texto se recalcula solo.
   */
  private readonly fechaElegida = toSignal(this.form.controls.fechaNacimiento.valueChanges, {
    initialValue: '',
  });
  protected readonly edadPrevista = computed(() => edadTexto(this.fechaElegida()));

  protected esEdicion(): boolean {
    return !!this.id();
  }

  ngOnInit(): void {
    const id = this.id();

    if (id) {
      // Propietarios y mascota en paralelo: se continúa cuando llegan ambos.
      forkJoin({
        propietarios: this.propietarioService.listar(),
        mascota: this.mascotaService.obtener(Number(id)),
      }).subscribe({
        next: ({ propietarios, mascota }) => {
          this.propietarios.set(propietarios);
          this.form.setValue({
            nombre: mascota.nombre,
            especie: mascota.especie,
            raza: mascota.raza ?? '',
            fechaNacimiento: mascota.fechaNacimiento.slice(0, 10),
            sexo: mascota.sexo,
            propietarioId: mascota.propietarioId,
          });
          this.cargando.set(false);
        },
        error: (err: HttpErrorResponse) => this.fallarCarga(err),
      });
    } else {
      this.propietarioService.listar().subscribe({
        next: propietarios => {
          this.propietarios.set(propietarios);
          this.cargando.set(false);
        },
        error: (err: HttpErrorResponse) => this.fallarCarga(err),
      });
    }
  }

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const dto: MascotaRequest = {
      nombre: v.nombre.trim(),
      especie: v.especie as Especie,
      raza: v.raza.trim() || null,
      fechaNacimiento: v.fechaNacimiento,
      sexo: v.sexo as Sexo,
      propietarioId: Number(v.propietarioId),
    };

    const id = this.id();
    const peticion = id
      ? this.mascotaService.actualizar(Number(id), dto)
      : this.mascotaService.crear(dto);

    this.guardando.set(true);
    this.error.set(null);
    this.erroresServidor.set({});
    peticion.subscribe({
      next: () => void this.router.navigate(['/mascotas']),
      error: (err: HttpErrorResponse) => {
        this.guardando.set(false);
        // 409 de RN-02 (nombre repetido para el mismo propietario), 404 o 400.
        this.error.set(mensajeError(err));
        this.erroresServidor.set(erroresDeCampos(err));
      },
    });
  }

  private fallarCarga(err: HttpErrorResponse): void {
    this.error.set(mensajeError(err));
    this.cargando.set(false);
  }
}
