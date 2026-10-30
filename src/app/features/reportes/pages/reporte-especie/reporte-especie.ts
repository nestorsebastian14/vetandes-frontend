import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ReporteEspecie } from '../../../../core/models/reporte.model';
import { ReporteService } from '../../../../core/services/reporte-service';
import { mensajeError } from '../../../../core/utils/http-error';

/**
 * Reporte de atenciones por especie.
 *
 * La SPA no agrupa ni suma nada: el backend lo resuelve con una consulta JPQL
 * agregada (GROUP BY) que ya excluye las atenciones ANULADAS y devuelve las
 * filas ordenadas por importe descendente. Aquí solo se pintan.
 */
@Component({
  selector: 'app-reporte-especie',
  imports: [ReactiveFormsModule, CurrencyPipe],
  templateUrl: './reporte-especie.html',
  styleUrl: './reporte-especie.css',
})
export class ReporteEspecieComponent implements OnInit {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly reporteService = inject(ReporteService);

  protected readonly filas = signal<ReporteEspecie[]>([]);
  protected readonly cargando = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly filtros = this.fb.group({
    desde: this.fb.control<string | null>(null),
    hasta: this.fb.control<string | null>(null),
  });

  /** Totales del pie de la tabla, calculados sobre lo que devolvió el backend. */
  protected readonly totalAtenciones = computed(() =>
    this.filas().reduce((suma, f) => suma + f.cantidadAtenciones, 0));

  protected readonly totalImporte = computed(() =>
    this.filas().reduce((suma, f) => suma + f.importeTotal, 0));

  /** Mayor importe, para dibujar la barra proporcional de cada fila. */
  private readonly importeMaximo = computed(() =>
    Math.max(...this.filas().map(f => f.importeTotal), 0));

  protected porcentaje(fila: ReporteEspecie): number {
    const maximo = this.importeMaximo();
    return maximo > 0 ? Math.round((fila.importeTotal / maximo) * 100) : 0;
  }

  ngOnInit(): void {
    this.consultar();
  }

  consultar(): void {
    const { desde, hasta } = this.filtros.getRawValue();
    if (desde && hasta && desde > hasta) {
      this.error.set('La fecha «desde» no puede ser posterior a la fecha «hasta».');
      return;
    }
    this.cargando.set(true);
    this.error.set(null);
    this.reporteService.atencionesPorEspecie(desde, hasta).subscribe({
      next: datos => {
        this.filas.set(datos);
        this.cargando.set(false);
      },
      error: (err: HttpErrorResponse) => {
        // Un 403 (usuario sin REPORTE_VER) se muestra aquí sin cerrar la sesión.
        this.error.set(mensajeError(err));
        this.filas.set([]);
        this.cargando.set(false);
      },
    });
  }

  limpiar(): void {
    this.filtros.reset();
    this.consultar();
  }
}
