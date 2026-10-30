/** Especie de la mascota. Ojo: la prestación usa TODAS, la mascota usa OTRO. */
export type Especie = 'PERRO' | 'GATO' | 'OTRO';
export type Sexo = 'M' | 'H';

export const ESPECIES: Especie[] = ['PERRO', 'GATO', 'OTRO'];

export const SEXOS: { valor: Sexo; etiqueta: string }[] = [
  { valor: 'M', etiqueta: 'Macho' },
  { valor: 'H', etiqueta: 'Hembra' },
];

/**
 * Mascota tal como la devuelve el backend (MascotaResponseDTO).
 *
 * El DTO trae propietarioId y propietarioNombre, nunca la entidad Propietario
 * anidada: así la respuesta no arrastra la relación completa ni obliga a la
 * SPA a mostrar un identificador en la tabla.
 */
export interface Mascota {
  id: number;
  nombre: string;
  especie: Especie;
  raza: string | null;
  fechaNacimiento: string;
  sexo: Sexo;
  propietarioId: number;
  propietarioNombre: string;
}

/** Lo que se envía en POST y PUT /mascotas (MascotaRequestDTO). */
export interface MascotaRequest {
  nombre: string;
  especie: Especie;
  raza: string | null;
  fechaNacimiento: string;
  sexo: Sexo;
  propietarioId: number;
}
