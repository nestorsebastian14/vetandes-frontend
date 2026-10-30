/** Fecha de hoy en formato AAAA-MM-DD (para el atributo max de un <input type="date">). */
export function hoyISO(): string {
  const hoy = new Date();
  const mes = `${hoy.getMonth() + 1}`.padStart(2, '0');
  const dia = `${hoy.getDate()}`.padStart(2, '0');
  return `${hoy.getFullYear()}-${mes}-${dia}`;
}

/**
 * Descompone la edad en años, meses y días a partir de la fecha de nacimiento.
 * Se toman los 10 primeros caracteres para aceptar tanto "2020-05-14" como
 * "2020-05-14T00:00:00" (Oracle DATE serializado por Jackson).
 */
export function calcularEdad(fechaNacimiento: string | null | undefined): { anios: number; meses: number; dias: number } | null {
  if (!fechaNacimiento) return null;

  const partes = fechaNacimiento.slice(0, 10).split('-').map(Number);
  if (partes.length !== 3 || partes.some(isNaN)) return null;

  const [anio, mes, dia] = partes;
  const nacimiento = new Date(anio, mes - 1, dia);
  const hoy = new Date();
  if (nacimiento > hoy) return null;

  let anios = hoy.getFullYear() - nacimiento.getFullYear();
  let meses = hoy.getMonth() - nacimiento.getMonth();
  let dias = hoy.getDate() - nacimiento.getDate();

  // Si aún no se cumplió el día del mes, se pide prestado un mes.
  if (dias < 0) {
    meses--;
    dias += new Date(hoy.getFullYear(), hoy.getMonth(), 0).getDate();
  }
  // Si aún no se cumplió el mes del año, se pide prestado un año.
  if (meses < 0) {
    anios--;
    meses += 12;
  }
  return { anios, meses, dias };
}

/**
 * Edad lista para la columna de la lista de mascotas: "3 años", "7 meses",
 * "12 días". Es la «edad calculada» que exige la pregunta 4.
 */
export function edadTexto(fechaNacimiento: string | null | undefined): string {
  const edad = calcularEdad(fechaNacimiento);
  if (!edad) return '—';
  if (edad.anios > 0) return edad.anios === 1 ? '1 año' : `${edad.anios} años`;
  if (edad.meses > 0) return edad.meses === 1 ? '1 mes' : `${edad.meses} meses`;
  return edad.dias === 1 ? '1 día' : `${edad.dias} días`;
}
