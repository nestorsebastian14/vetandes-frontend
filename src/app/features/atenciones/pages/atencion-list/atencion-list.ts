import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Atencion, EstadoAtencion, FiltroAtenciones } from '../../../../core/models/atencion.model';
import { Especie, ESPECIES } from '../../../../core/models/mascota.model';
import { AtencionService } from '../../../../core/services/atencion-service';
import { mensajeError } from '../../../../core/utils/http-error';
import { SiPermiso } from '../../../../shared/directives/si-permiso';

/**
 * Consulta de atenciones.
 *
 * Los filtros se envían como parámetros de la URL a GET /atenciones, tal como
 * los declara el contrato: la SPA no descarga todo para filtrar en memoria.
 */
@Component({
  selector: 'app-atencion-list',
  imports: [ReactiveFormsModule, RouterLink, SiPermiso, CurrencyPipe, DatePipe],
  templateUrl: './atencion-list.html',
  styleUrl: './atencion-list.css',
})
export class AtencionList implements OnInit {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly atencionService = inject(AtencionService);

  protected readonly especies = ESPECIES;

  protected readonly atenciones = signal<Atencion[]>([]);
  protected readonly cargando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly buscado = signal(false);

  protected readonly filtros = this.fb.group({
    mascota: this.fb.control<string | null>(null),
    especie: this.fb.control<Especie | null>(null),
    estado: this.fb.control<EstadoAtencion | null>(null),
    desde: this.fb.control<string | null>(null),
    hasta: this.fb.control<string | null>(null),
  });

  /** Total de lo no anulado en el resultado, solo como referencia visual. */
  protected readonly totalRegistrado = computed(() =>
    this.atenciones()
      .filter(a => a.estado === 'REGISTRADA')
      .reduce((suma, a) => suma + a.total, 0));

  ngOnInit(): void {
    this.cargar();
  }

  buscar(): void {
    const { desde, hasta } = this.filtros.getRawValue();
    if (desde && hasta && desde > hasta) {
      this.error.set('La fecha «desde» no puede ser posterior a la fecha «hasta».');
      return;
    }
    this.cargar();
  }

  limpiar(): void {
    this.filtros.reset();
    this.cargar();
  }

  private cargar(): void {
    const filtro: FiltroAtenciones = this.filtros.getRawValue();
    this.cargando.set(true);
    this.error.set(null);
    this.atencionService.consultar(filtro).subscribe({
      next: datos => {
        // Sin resultados el backend responde 200 con lista vacía: no es un error.
        this.atenciones.set(datos);
        this.cargando.set(false);
        this.buscado.set(true);
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(mensajeError(err));
        this.atenciones.set([]);
        this.cargando.set(false);
      },
    });
  }
}
