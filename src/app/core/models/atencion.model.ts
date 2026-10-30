import { Especie } from './mascota.model';

export type EstadoAtencion = 'REGISTRADA' | 'ANULADA';

/** Límites del detalle que exige RN-03. */
export const MIN_DETALLES = 1;
export const MAX_DETALLES = 8;
export const MIN_CANTIDAD = 1;
export const MAX_CANTIDAD = 3;

/** Umbral y porcentaje del descuento de RN-04 (lo aplica el backend). */
export const PRESTACIONES_PARA_DESCUENTO = 3;
export const PORCENTAJE_DESCUENTO = 0.10;

/** Una línea del detalle, tal como la devuelve el backend. */
export interface DetalleAtencion {
  id?: number;
  prestacionId: number;
  prestacionCodigo?: string;
  prestacionNombre: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

/** Cabecera con sus detalles (AtencionResponseDTO). */
export interface Atencion {
  id: number;
  numero: string;
  fecha: string;
  mascotaId: number;
  mascotaNombre: string;
  mascotaEspecie: Especie;
  propietarioNombre?: string;
  peso: number;
  diagnostico: string | null;
  estado: EstadoAtencion;
  subtotal: number;
  descuento: number;
  total: number;
  usuarioRegistro: string;
  motivoAnulacion: string | null;
  detalles: DetalleAtencion[];
}

/**
 * Lo que se envía en POST /atenciones.
 *
 * Solo viajan mascotaId, peso, diagnóstico y los pares (prestacionId, cantidad).
 * NO se envían precio, subtotal, descuento ni total: el precio unitario lo toma
 * el servicio de la base de datos y los importes los calcula el backend
 * (RN-04). Cualquier descuento que enviara la SPA se ignoraría.
 */
export interface AtencionRequest {
  mascotaId: number;
  peso: number;
  diagnostico: string | null;
  detalles: { prestacionId: number; cantidad: number }[];
}

/** Lo que se envía en PATCH /atenciones/{id}/anular (RN-05). */
export interface AnulacionRequest {
  motivo: string;
}

/** Filtros opcionales y combinables de GET /atenciones. */
export interface FiltroAtenciones {
  /** Nombre parcial de la mascota, sin distinguir mayúsculas. */
  mascota: string | null;
  especie: Especie | null;
  estado: EstadoAtencion | null;
  /** AAAA-MM-DD */
  desde: string | null;
  hasta: string | null;
}
