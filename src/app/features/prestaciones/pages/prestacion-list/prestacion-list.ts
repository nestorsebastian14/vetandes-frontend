import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/auth/auth-service';
import { EspecieAplicable, ESPECIES_APLICABLES, Prestacion } from '../../../../core/models/prestacion.model';
import { PrestacionService } from '../../../../core/services/prestacion-service';
import { mensajeError } from '../../../../core/utils/http-error';
import { coincide } from '../../../../core/utils/texto';
import { SiPermiso } from '../../../../shared/directives/si-permiso';

@Component({
  selector: 'app-prestacion-list',
  imports: [RouterLink, SiPermiso, CurrencyPipe],
  templateUrl: './prestacion-list.html',
  styleUrl: './prestacion-list.css',
})
export class PrestacionList implements OnInit {
  private readonly prestacionService = inject(PrestacionService);
  private readonly auth = inject(AuthService);

  protected readonly especies = ESPECIES_APLICABLES;
  protected readonly puedeEscribir = computed(() => this.auth.tienePermiso('PRESTACION_ESCRIBIR'));

  protected readonly prestaciones = signal<Prestacion[]>([]);
  protected readonly cargando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly aviso = signal<string | null>(null);

  /** Buscador local sobre lo ya descargado: filtra por código o nombre. */
  protected readonly busqueda = signal('');
  /** Filtro de especie: este sí viaja al backend como ?especie=. */
  protected readonly especieFiltro = signal<EspecieAplicable | null>(null);

  /**
   * Id de la prestación que no se pudo eliminar por estar en uso (409).
   * Mientras tenga valor, su fila ofrece la baja lógica que pide RN-01.
   */
  protected readonly bajaSugerida = signal<number | null>(null);

  protected readonly filtradas = computed(() => {
    const texto = this.busqueda().trim();
    if (!texto) return this.prestaciones();
    return this.prestaciones().filter(p => coincide(texto, p.codigo, p.nombre));
  });

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.error.set(null);
    this.prestacionService.listar(this.especieFiltro()).subscribe({
      next: datos => {
        this.prestaciones.set(datos);
        this.cargando.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(mensajeError(err));
        this.prestaciones.set([]);
        this.cargando.set(false);
      },
    });
  }

  filtrarPorEspecie(valor: string): void {
    this.especieFiltro.set(valor ? (valor as EspecieAplicable) : null);
    this.cargar();
  }

  /**
   * Intenta la baja física. Si la prestación ya se usó en una atención el
   * backend responde 409: se muestra su mensaje y se ofrece la baja lógica.
   * La lista nunca queda bloqueada.
   */
  eliminar(prestacion: Prestacion): void {
    if (!confirm(`¿Eliminar la prestación "${prestacion.codigo} · ${prestacion.nombre}"?`)) {
      return;
    }
    this.error.set(null);
    this.aviso.set(null);
    this.prestacionService.eliminar(prestacion.id).subscribe({
      next: () => {
        this.prestaciones.update(lista => lista.filter(p => p.id !== prestacion.id));
        this.aviso.set(`Prestación ${prestacion.codigo} eliminada.`);
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(mensajeError(err));
        if (err.status === 409) this.bajaSugerida.set(prestacion.id);
      },
    });
  }

  /** Baja o alta lógica con PATCH /prestaciones/{id}/estado. */
  cambiarEstado(prestacion: Prestacion): void {
    const activar = !prestacion.activo;
    const accion = activar ? 'activar' : 'dar de baja';
    if (!confirm(`¿Desea ${accion} la prestación "${prestacion.codigo} · ${prestacion.nombre}"?`)) {
      return;
    }
    this.error.set(null);
    this.prestacionService.cambiarEstado(prestacion.id, activar).subscribe({
      next: actualizada => {
        this.prestaciones.update(lista => lista.map(p => (p.id === actualizada.id ? actualizada : p)));
        this.bajaSugerida.set(null);
        this.aviso.set(`Prestación ${prestacion.codigo} ${activar ? 'activada' : 'dada de baja'}.`);
      },
      error: (err: HttpErrorResponse) => this.error.set(mensajeError(err)),
    });
  }
}
