/**
 * Una fila del reporte GET /reportes/atenciones-por-especie.
 *
 * El backend la resuelve con una consulta JPQL agregada (GROUP BY) y una
 * proyección, excluyendo las atenciones ANULADAS. La SPA no suma nada:
 * solo pinta lo que llega, ya ordenado por importe descendente.
 */
export interface ReporteEspecie {
  especie: string;
  cantidadAtenciones: number;
  importeTotal: number;
}
