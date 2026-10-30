import { AbstractControl, FormArray, FormGroup, ValidationErrors, ValidatorFn } from '@angular/forms';

/**
 * Rechaza una fecha posterior a hoy. Equivale a @PastOrPresent del backend
 * (RN de mascota: «la fecha de nacimiento no puede ser futura»).
 */
export const noFutura: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const valor = control.value as string | null;
  if (!valor) return null;
  return valor.slice(0, 10) > new Date().toISOString().slice(0, 10) ? { futura: true } : null;
};

/**
 * Rechaza una prestación repetida dentro del detalle de la atención (RN-03).
 * Se aplica al FormArray completo porque la regla mira todas las líneas juntas.
 */
export function sinRepetir(campo: string): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const array = control as FormArray<FormGroup>;
    const valores = array.controls
      .map(linea => linea.get(campo)?.value as unknown)
      .filter(v => v !== null && v !== undefined && v !== '');
    return valores.length === new Set(valores).size ? null : { repetido: true };
  };
}
