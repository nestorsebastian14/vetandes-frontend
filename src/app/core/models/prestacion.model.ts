/** A qué especie se le puede aplicar la prestación (columna especie_aplicable). */
export type EspecieAplicable = 'PERRO' | 'GATO' | 'TODAS';

export const ESPECIES_APLICABLES: EspecieAplicable[] = ['PERRO', 'GATO', 'TODAS'];

/** Patrón del código exigido por el backend: PRS-000. */
export const PATRON_CODIGO_PRESTACION = /^PRS-\d{3}$/;

/** Prestación tal como la devuelve el backend (PrestacionResponseDTO). */
export interface Prestacion {
  id: number;
  codigo: string;
  nombre: string;
  precio: number;
  especieAplicable: EspecieAplicable;
  activo: boolean;
}

/** Lo que se envía en POST y PUT /prestaciones (PrestacionRequestDTO). */
export interface PrestacionRequest {
  codigo: string;
  nombre: string;
  precio: number;
  especieAplicable: EspecieAplicable;
  activo: boolean;
}
