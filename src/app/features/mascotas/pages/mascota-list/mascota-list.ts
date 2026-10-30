import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/auth/auth-service';
import { Mascota } from '../../../../core/models/mascota.model';
import { Propietario } from '../../../../core/models/propietario.model';
import { MascotaService } from '../../../../core/services/mascota-service';
import { PropietarioService } from '../../../../core/services/propietario-service';
import { edadTexto } from '../../../../core/utils/fechas';
import { mensajeError } from '../../../../core/utils/http-error';
import { coincide } from '../../../../core/utils/texto';
import { SiPermiso } from '../../../../shared/directives/si-permiso';

@Component({
  selector: 'app-mascota-list',
  imports: [RouterLink, SiPermiso, DatePipe],
  templateUrl: './mascota-list.html',
  styleUrl: './mascota-list.css',
})
export class MascotaList implements OnInit {
  private readonly mascotaService = inject(MascotaService);
  private readonly propietarioService = inject(PropietarioService);
  private readonly auth = inject(AuthService);

  protected readonly puedeEscribir = computed(() => this.auth.tienePermiso('MASCOTA_ESCRIBIR'));

  protected readonly mascotas = signal<Mascota[]>([]);
  protected readonly propietarios = signal<Propietario[]>([]);
  protected readonly cargando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly aviso = signal<string | null>(null);

  /** Filtro por propietario: viaja al backend como ?propietarioId=. */
  protected readonly propietarioFiltro = signal<number | null>(null);
  /** Buscador local por nombre, raza o propietario. */
  protected readonly busqueda = signal('');

  protected readonly filtradas = computed(() => {
    const texto = this.busqueda().trim();
    if (!texto) return this.mascotas();
    return this.mascotas().filter(m => coincide(texto, m.nombre, m.raza ?? '', m.propietarioNombre));
  });

  /** «Edad calculada» de la columna: se deriva de la fecha de nacimiento. */
  protected edad(mascota: Mascota): string {
    return edadTexto(mascota.fechaNacimiento);
  }

  ngOnInit(): void {
    // Los propietarios llenan el desplegable del filtro; vienen del backend.
    this.propietarioService.listar().subscribe({
      next: datos => this.propietarios.set(datos),
      error: (err: HttpErrorResponse) => this.error.set(mensajeError(err)),
    });
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.error.set(null);
    this.mascotaService.listar(this.propietarioFiltro()).subscribe({
      next: datos => {
        this.mascotas.set(datos);
        this.cargando.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(mensajeError(err));
        this.mascotas.set([]);
        this.cargando.set(false);
      },
    });
  }

  filtrarPorPropietario(valor: string): void {
    this.propietarioFiltro.set(valor ? Number(valor) : null);
    this.cargar();
  }

  /** Una mascota con atenciones no se elimina: el backend responde 409 (RN-02). */
  eliminar(mascota: Mascota): void {
    if (!confirm(`¿Eliminar a "${mascota.nombre}" de ${mascota.propietarioNombre}?`)) {
      return;
    }
    this.error.set(null);
    this.aviso.set(null);
    this.mascotaService.eliminar(mascota.id).subscribe({
      next: () => {
        this.mascotas.update(lista => lista.filter(m => m.id !== mascota.id));
        this.aviso.set(`Mascota ${mascota.nombre} eliminada.`);
      },
      error: (err: HttpErrorResponse) => this.error.set(mensajeError(err)),
    });
  }
}
