import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { CurrencyPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  FormControl,
  FormGroup,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import {
  AtencionRequest,
  MAX_CANTIDAD,
  MAX_DETALLES,
  MIN_CANTIDAD,
  PORCENTAJE_DESCUENTO,
  PRESTACIONES_PARA_DESCUENTO,
} from '../../../../core/models/atencion.model';
import { Mascota } from '../../../../core/models/mascota.model';
import { Prestacion } from '../../../../core/models/prestacion.model';
import { AtencionService } from '../../../../core/services/atencion-service';
import { MascotaService } from '../../../../core/services/mascota-service';
import { PrestacionService } from '../../../../core/services/prestacion-service';
import { erroresDeCampos, mensajeError } from '../../../../core/utils/http-error';
import { redondear } from '../../../../core/utils/numeros';
import { coincide } from '../../../../core/utils/texto';
import { sinRepetir } from '../../../../core/utils/validadores';

/** Controles de una línea del detalle. */
interface LineaForm {
  prestacionId: FormControl<number | null>;
  cantidad: FormControl<number>;
}

const MAX_RESULTADOS = 6;

/**
 * Registro de una atención: cabecera (mascota, peso, diagnóstico) y detalle
 * dinámico de prestaciones.
 *
 * Qué calcula esta pantalla y qué NO:
 *
 * - Muestra subtotal, descuento y total al instante para que la recepcionista
 *   vea el importe antes de guardar. Son una ESTIMACIÓN informativa.
 * - En el POST solo viajan mascotaId, peso, diagnóstico y los pares
 *   (prestacionId, cantidad). No se envía ningún importe, así que el backend
 *   no puede «aceptar» un total calculado aquí: toma los precios de la base de
 *   datos y aplica RN-04 en su capa de servicio.
 */
@Component({
  selector: 'app-atencion-form',
  imports: [ReactiveFormsModule, RouterLink, CurrencyPipe],
  templateUrl: './atencion-form.html',
  styleUrl: './atencion-form.css',
})
export class AtencionForm implements OnInit {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly atencionService = inject(AtencionService);
  private readonly mascotaService = inject(MascotaService);
  private readonly prestacionService = inject(PrestacionService);
  private readonly router = inject(Router);

  protected readonly maxDetalles = MAX_DETALLES;
  protected readonly minCantidad = MIN_CANTIDAD;
  protected readonly maxCantidad = MAX_CANTIDAD;
  protected readonly prestacionesParaDescuento = PRESTACIONES_PARA_DESCUENTO;
  protected readonly porcentajeDescuento = PORCENTAJE_DESCUENTO * 100;

  protected readonly mascotas = signal<Mascota[]>([]);
  protected readonly prestaciones = signal<Prestacion[]>([]);
  protected readonly cargando = signal(true);
  protected readonly guardando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly erroresServidor = signal<Record<string, string>>({});

  // ---------- Cabecera y detalle ----------
  protected readonly form = this.fb.group({
    mascotaId: this.fb.control<number | null>(null, Validators.required),
    peso: this.fb.control<number | null>(null, [Validators.required, Validators.min(0.01)]),
    diagnostico: ['', [Validators.maxLength(300)]],
    // RN-03: entre 1 y 8 líneas y sin repetir la misma prestación.
    detalles: this.fb.array<FormGroup<LineaForm>>([], [
      Validators.minLength(1),
      Validators.maxLength(MAX_DETALLES),
      sinRepetir('prestacionId'),
    ]),
  });

  get detalles() {
    return this.form.controls.detalles;
  }

  /** Espejo del valor del formulario como signal: de aquí salen los cálculos. */
  private readonly valor = toSignal(this.form.valueChanges, { initialValue: this.form.value });

  // ---------- Buscador de mascota ----------
  protected readonly buscarMascota = new FormControl('', { nonNullable: true });
  private readonly textoMascota = toSignal(this.buscarMascota.valueChanges, { initialValue: '' });

  /** Coincide por nombre de la mascota o por nombre del propietario. */
  protected readonly mascotasEncontradas = computed(() => {
    const texto = this.textoMascota().trim();
    if (!texto) return [];
    return this.mascotas()
      .filter(m => coincide(texto, m.nombre, m.propietarioNombre))
      .slice(0, MAX_RESULTADOS);
  });

  protected readonly hayBusqueda = computed(() => this.textoMascota().trim().length > 0);

  protected readonly mascotaElegida = computed(() =>
    this.mascotas().find(m => m.id === this.valor().mascotaId));

  elegirMascota(mascota: Mascota): void {
    const anterior = this.mascotaElegida();
    this.form.controls.mascotaId.setValue(mascota.id);
    this.buscarMascota.setValue('');
    // Al cambiar de especie, el catálogo aplicable cambia: el detalle se reinicia.
    if (anterior && anterior.especie !== mascota.especie) {
      this.detalles.clear();
    }
    if (!this.detalles.length) this.agregarLinea();
  }

  cambiarMascota(): void {
    this.form.controls.mascotaId.setValue(null);
  }

  // ---------- Prestaciones que se pueden ofrecer ----------
  /**
   * Solo prestaciones activas que apliquen a la especie de la mascota o a
   * TODAS (RN-03). Si todavía no hay mascota elegida, no se ofrece ninguna.
   */
  protected readonly prestacionesAplicables = computed(() => {
    const mascota = this.mascotaElegida();
    if (!mascota) return [];
    return this.prestaciones().filter(
      p => p.activo && (p.especieAplicable === 'TODAS' || p.especieAplicable === mascota.especie),
    );
  });

  private readonly prestacionPorId = computed(() => new Map(this.prestaciones().map(p => [p.id, p])));

  /** Ids ya usados en otras líneas: así una prestación no se repite. */
  protected opcionesDeLinea(indice: number): Prestacion[] {
    const usados = (this.valor().detalles ?? [])
      .map((d, i) => (i === indice ? null : d.prestacionId))
      .filter((id): id is number => id !== null && id !== undefined);
    return this.prestacionesAplicables().filter(p => !usados.includes(p.id));
  }

  // ---------- Líneas del detalle ----------
  private nuevaLinea(): FormGroup<LineaForm> {
    return this.fb.group({
      prestacionId: this.fb.control<number | null>(null, Validators.required),
      cantidad: this.fb.control(1, [
        Validators.required,
        Validators.min(MIN_CANTIDAD),
        Validators.max(MAX_CANTIDAD),
        Validators.pattern(/^\d+$/),
      ]),
    });
  }

  agregarLinea(): void {
    if (this.detalles.length >= MAX_DETALLES) return;
    this.detalles.push(this.nuevaLinea());
  }

  quitarLinea(indice: number): void {
    this.detalles.removeAt(indice);
  }

  // ---------- Cálculos reactivos (solo informativos) ----------
  protected readonly lineas = computed(() =>
    (this.valor().detalles ?? []).map(d => {
      const prestacion = d.prestacionId ? this.prestacionPorId().get(d.prestacionId) : undefined;
      const cantidad = Number(d.cantidad) || 0;
      const precioUnitario = prestacion?.precio ?? 0;
      return {
        prestacion,
        precioUnitario,
        subtotal: redondear(precioUnitario * cantidad),
      };
    }));

  protected readonly subtotal = computed(() =>
    redondear(this.lineas().reduce((suma, l) => suma + l.subtotal, 0)));

  /** Prestaciones DISTINTAS elegidas: es lo que mira RN-04, no la cantidad. */
  protected readonly prestacionesDistintas = computed(() => {
    const ids = (this.valor().detalles ?? [])
      .map(d => d.prestacionId)
      .filter((id): id is number => id !== null && id !== undefined);
    return new Set(ids).size;
  });

  protected readonly aplicaDescuento = computed(
    () => this.prestacionesDistintas() >= PRESTACIONES_PARA_DESCUENTO);

  protected readonly descuento = computed(() =>
    this.aplicaDescuento() ? redondear(this.subtotal() * PORCENTAJE_DESCUENTO) : 0);

  protected readonly total = computed(() => redondear(this.subtotal() - this.descuento()));

  /** Errores de «campos» que no corresponden a un control de la cabecera. */
  protected readonly otrosErroresServidor = computed(() => {
    const conocidos = ['mascotaId', 'peso', 'diagnostico'];
    return Object.entries(this.erroresServidor())
      .filter(([campo]) => !conocidos.includes(campo))
      .map(([campo, mensaje]) => `${campo}: ${mensaje}`);
  });

  // ---------- Carga inicial ----------
  ngOnInit(): void {
    // Toda lista proviene del backend: no hay datos escritos a mano.
    forkJoin({
      mascotas: this.mascotaService.listar(),
      prestaciones: this.prestacionService.listar(),
    }).subscribe({
      next: ({ mascotas, prestaciones }) => {
        this.mascotas.set(mascotas);
        this.prestaciones.set(prestaciones);
        this.cargando.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(mensajeError(err));
        this.cargando.set(false);
      },
    });
  }

  // ---------- Registro ----------
  registrar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const dto: AtencionRequest = {
      mascotaId: Number(v.mascotaId),
      peso: Number(v.peso),
      diagnostico: v.diagnostico.trim() || null,
      detalles: v.detalles.map(d => ({
        prestacionId: Number(d.prestacionId),
        cantidad: Number(d.cantidad),
      })),
    };

    this.guardando.set(true);
    this.error.set(null);
    this.erroresServidor.set({});
    this.atencionService.registrar(dto).subscribe({
      // El número (AT-000001) lo genera el backend; se muestra en el detalle.
      next: atencion => void this.router.navigate(['/atenciones', atencion.id], {
        queryParams: { nueva: '1' },
      }),
      error: (err: HttpErrorResponse) => {
        // Importante: NO se toca el formulario. Un 409 (prestación inactiva o
        // que no aplica a la especie) se muestra y las líneas se conservan.
        this.guardando.set(false);
        this.error.set(mensajeError(err));
        this.erroresServidor.set(erroresDeCampos(err));
      },
    });
  }
}
