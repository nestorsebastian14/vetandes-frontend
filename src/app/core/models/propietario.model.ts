/**
 * Propietario de las mascotas. Es una tabla de solo lectura (datos semilla):
 * la SPA solo la consulta con GET /propietarios para llenar la lista
 * desplegable del formulario de mascotas.
 */
export interface Propietario {
  id: number;
  dni: string;
  nombres: string;
  telefono: string | null;
}
