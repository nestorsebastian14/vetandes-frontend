# VetAndes Web · SPA en Angular

SPA del caso **VetAndes** (clínica veterinaria): mantiene el catálogo de prestaciones, registra
mascotas y atenciones, consulta atenciones y muestra el reporte por especie, consumiendo
**VetAndes API** (Spring Boot + Oracle) protegido con JWT.

- Angular 22 · componentes standalone · signals · formularios reactivos
- Sesión en `sessionStorage` con vencimiento · dos interceptores · guards por sesión y por permiso

## Ejecución

```bash
npm install          # solo la primera vez
ng serve             # http://localhost:4200
```

La URL del backend se configura en un único sitio, `src/environments/environment.ts`:

```ts
export const environment = { apiUrl: 'http://localhost:8080/api/v1' };
```

El backend debe permitir CORS desde `http://localhost:4200` con los métodos GET, POST, PUT, PATCH,
DELETE y OPTIONS, y con el encabezado `Authorization`.

## Usuarios de prueba

| Usuario       | Contraseña | Rol            | Qué puede hacer en la SPA                                      |
|---------------|------------|----------------|----------------------------------------------------------------|
| `admin`       | `Vet2026*` | ADMIN          | Todo.                                                          |
| `recepcion`   | `Vet2026*` | RECEPCIONISTA  | Registra mascotas y atenciones; consulta prestaciones. Sin reportes ni anulación. |
| `veterinario` | `Vet2026*` | VETERINARIO    | Mantiene prestaciones, anula atenciones y ve reportes. No registra mascotas ni atenciones. |
| `inactivo`    | `Vet2026*` | RECEPCIONISTA  | Cuenta inactiva: el login responde 401.                        |

## Estructura

```
src/app/
├── core/
│   ├── auth/           auth.model.ts (tipo Permiso) · auth-service.ts (sesión con signals)
│   ├── config/         menu.ts (menú único, filtrado por permiso)
│   ├── guards/         auth-guard.ts (authGuard, invitadoGuard) · permiso-guard.ts
│   ├── interceptors/   auth-interceptor.ts (Authorization) · error-interceptor.ts (401 vs 403)
│   ├── models/         error-response · propietario · prestacion · mascota · atencion · reporte
│   ├── services/       un servicio HTTP por recurso
│   └── utils/          http-error · fechas (edad) · numeros · texto · validadores
├── shared/
│   ├── components/     aviso-sesion (cuenta regresiva antes de vencer)
│   ├── directives/     si-permiso (oculta botones sin permiso)
│   └── pages/          acceso-denegado · no-encontrado
├── layout/             main-layout · header · sidebar
└── features/
    ├── auth/           login (fuera del layout) · mi-cuenta (GET /auth/me)
    ├── inicio/
    ├── prestaciones/   prestacion-list · prestacion-form
    ├── mascotas/       mascota-list · mascota-form
    ├── atenciones/     atencion-form (cabecera–detalle) · atencion-list · atencion-detalle
    └── reportes/       reporte-especie
```

Todos los módulos se cargan de forma diferida con `loadChildren` / `loadComponent`.

## Contrato del API que consume la SPA

Todas las rutas van bajo `/api/v1`. Salvo el login, todas exigen el token.

| Verbo | Ruta | Permiso | Servicio |
|-------|------|---------|----------|
| POST | `/auth/login` | público | `AuthService.login()` |
| GET | `/auth/me` | autenticado | `AuthService.perfil()` |
| GET | `/propietarios` | `MASCOTA_LEER` | `PropietarioService` |
| GET · POST | `/prestaciones?especie` | `PRESTACION_LEER` · `PRESTACION_ESCRIBIR` | `PrestacionService` |
| GET · PUT · DELETE | `/prestaciones/{id}` | `PRESTACION_LEER` · `PRESTACION_ESCRIBIR` | `PrestacionService` |
| PATCH | `/prestaciones/{id}/estado` | `PRESTACION_ESCRIBIR` | `PrestacionService.cambiarEstado()` |
| GET · POST | `/mascotas?propietarioId` | `MASCOTA_LEER` · `MASCOTA_ESCRIBIR` | `MascotaService` |
| GET · PUT · DELETE | `/mascotas/{id}` | `MASCOTA_LEER` · `MASCOTA_ESCRIBIR` | `MascotaService` |
| POST | `/atenciones` | `ATENCION_REGISTRAR` | `AtencionService.registrar()` |
| GET | `/atenciones?mascota&especie&estado&desde&hasta` | `ATENCION_LEER` | `AtencionService.consultar()` |
| GET | `/atenciones/{id}` | `ATENCION_LEER` | `AtencionService.obtener()` |
| PATCH | `/atenciones/{id}/anular` | `ATENCION_ANULAR` | `AtencionService.anular()` |
| GET | `/reportes/atenciones-por-especie?desde&hasta` | `REPORTE_VER` | `ReporteService` |

### Cuerpos que envía la SPA

```jsonc
// POST /auth/login
{ "username": "recepcion", "password": "Vet2026*" }

// POST / PUT /prestaciones
{ "codigo": "PRS-010", "nombre": "Baño medicado", "precio": 45.00,
  "especieAplicable": "PERRO", "activo": true }

// PATCH /prestaciones/{id}/estado
{ "activo": false }

// POST / PUT /mascotas
{ "nombre": "Pelusa", "especie": "GATO", "raza": "Siamés",
  "fechaNacimiento": "2022-03-15", "sexo": "H", "propietarioId": 3 }

// POST /atenciones   ← sin importes: los calcula el backend
{ "mascotaId": 4, "peso": 6.80, "diagnostico": "Control de rutina",
  "detalles": [ { "prestacionId": 1, "cantidad": 1 },
                { "prestacionId": 3, "cantidad": 2 } ] }

// PATCH /atenciones/{id}/anular
{ "motivo": "Registrada por error en la mascota equivocada" }
```

### Respuestas que espera la SPA

```jsonc
// POST /auth/login  →  200
{ "token": "eyJ...", "tipo": "Bearer", "expiraEnSegundos": 3600,
  "username": "recepcion", "nombreCompleto": "Rosa Quispe",
  "roles": ["RECEPCIONISTA"],
  "permisos": ["PRESTACION_LEER", "MASCOTA_LEER", "MASCOTA_ESCRIBIR",
               "ATENCION_LEER", "ATENCION_REGISTRAR"] }

// GET /mascotas  →  200 (nunca la entidad Propietario anidada)
[ { "id": 4, "nombre": "Pelusa", "especie": "GATO", "raza": "Siamés",
    "fechaNacimiento": "2022-03-15", "sexo": "H",
    "propietarioId": 3, "propietarioNombre": "Ana Flores" } ]

// POST /atenciones  →  201
{ "id": 7, "numero": "AT-000007", "fecha": "2026-10-29T09:14:22",
  "mascotaId": 4, "mascotaNombre": "Pelusa", "mascotaEspecie": "GATO",
  "propietarioNombre": "Ana Flores",
  "peso": 6.80, "diagnostico": "Control de rutina", "estado": "REGISTRADA",
  "subtotal": 150.00, "descuento": 15.00, "total": 135.00,
  "usuarioRegistro": "recepcion", "motivoAnulacion": null,
  "detalles": [ { "id": 11, "prestacionId": 1, "prestacionCodigo": "PRS-001",
                  "prestacionNombre": "Consulta general", "cantidad": 1,
                  "precioUnitario": 50.00, "subtotal": 50.00 } ] }

// GET /reportes/atenciones-por-especie  →  200 (ya ordenado por importe desc.)
[ { "especie": "PERRO", "cantidadAtenciones": 12, "importeTotal": 1450.00 },
  { "especie": "GATO",  "cantidadAtenciones": 5,  "importeTotal": 520.00 } ]
```

### Formato de error común

Todas las respuestas 400, 401, 403, 404, 409 y 500 usan el mismo formato. `campos` solo aparece
en los errores de validación, y la SPA lo pinta **bajo cada control** del formulario:

```json
{
  "timestamp": "2026-10-29T09:14:22",
  "status": 400,
  "error": "Bad Request",
  "mensaje": "Datos inválidos",
  "ruta": "/api/v1/mascotas",
  "campos": { "fechaNacimiento": "La fecha de nacimiento no puede ser futura" }
}
```

## Dónde vive cada responsabilidad

| Tema | Archivo | Qué hace |
|------|---------|----------|
| Token en las peticiones | `core/interceptors/auth-interceptor.ts` | **Único** punto donde se agrega `Authorization: Bearer`. Solo a las peticiones a `environment.apiUrl`. |
| 401 frente a 403 | `core/interceptors/error-interceptor.ts` | 401 (salvo en `/auth/login`) cierra la sesión y vuelve al login con `returnUrl`. **403 no cierra la sesión.** |
| Sesión y vencimiento | `core/auth/auth-service.ts` | Signal + `sessionStorage` con `expiraEn`. Un `setTimeout` cierra la sesión al vencer; al arrancar, una sesión vencida se descarta. |
| Permisos | `core/auth/auth-service.ts` → `tienePermiso()` | Se pregunta por el **permiso**, nunca por el nombre del rol. |
| Rutas protegidas | `app.routes.ts` y los `*.routes.ts` de cada módulo | `authGuard` en el layout, `invitadoGuard` en el login, `permisoGuard` con el permiso en `data`. |
| Menú y botones | `core/config/menu.ts`, `shared/directives/si-permiso.ts` | Se filtran por permiso. Es comodidad, no seguridad. |
| Importes de la atención | `features/atenciones/.../atencion-form.ts` | Calcula subtotal, descuento y total **solo para mostrarlos**. El POST envía únicamente `prestacionId` y `cantidad`. |

## Lo que la SPA deliberadamente NO hace

- **No tiene datos escritos a mano ni servicios simulados.** Propietarios, prestaciones y mascotas
  salen de `GET /propietarios`, `GET /prestaciones` y `GET /mascotas`.
- **No calcula el total que se guarda.** En `POST /atenciones` no viaja ningún importe, así que el
  backend no puede aceptar un total venido de la pantalla: toma los precios de la base de datos y
  aplica RN-04 en su capa de servicio. Lo que se ve antes de guardar es una estimación, y así lo
  dice la pantalla.
- **No se protege ocultando el menú.** Ocultar una opción o un botón es experiencia de usuario. Una
  ruta escrita a mano la detiene el `permisoGuard` y, sobre todo, el endpoint responde 403.
- **No agrupa ni suma el reporte.** Llega agregado por una consulta JPQL con `GROUP BY`, sin las
  atenciones anuladas, y ya ordenado.
- **No guarda la sesión en `localStorage`.** La computadora de recepción se comparte entre turnos:
  con `sessionStorage` la sesión muere al cerrar la pestaña y no la hereda el turno siguiente.

## Cómo demostrar cada evidencia del examen

**Pregunta 4**

1. Prestaciones → «+ Nueva prestación», registrar `PRS-010`; luego editarla desde la lista (es el
   mismo componente de formulario: solo cambia la URL).
2. Registrar de nuevo el código `PRS-010` → el 409 del backend aparece en la página.
3. Intentar «Eliminar» una prestación usada en una atención → 409, y la fila ofrece «Dar de baja»
   (`PATCH /prestaciones/{id}/estado`), tal como pide RN-01.
4. Mascotas → registrar una mascota eligiendo el propietario en la lista desplegable; la columna
   **Edad** se calcula a partir de la fecha de nacimiento.
5. Registrar otra mascota con el **mismo nombre y el mismo propietario** → 409 de RN-02 en pantalla,
   y la lista sigue usable.
6. Poner una fecha de nacimiento futura → el formulario la rechaza; si el backend responde 400, su
   mensaje de `campos` sale bajo el control.
7. Filtrar mascotas por propietario → se envía `GET /mascotas?propietarioId=`.

**Pregunta 5**

1. Entrar como `recepcion` → Atenciones → «+ Nueva atención». Buscar la mascota por nombre o por
   propietario, poner peso y diagnóstico, agregar líneas.
2. Comprobar que el desplegable solo ofrece prestaciones **activas** y **aplicables a la especie**,
   y que una ya elegida no se repite en otra línea.
3. Con **3 prestaciones distintas** aparece el descuento del 10 % al instante (RN-04).
4. Registrar → la pantalla de detalle muestra «Atención AT-0000xx registrada correctamente» con los
   importes **que calculó el backend**.
5. Provocar un 409 (una prestación inactiva o que no aplica a la especie) → el mensaje aparece y
   **las líneas del detalle no se pierden**.
6. Consulta de atenciones → combinar mascota, especie, estado, desde y hasta: viajan como
   parámetros de la URL.
7. Entrar como `veterinario`:
   - «Nueva atención» **no aparece** en el menú ni en la lista.
   - Escribir `/atenciones/nueva` en la barra de direcciones → **«Acceso denegado»**, y la sesión
     continúa (actúa el `permisoGuard`).
   - Abrir una atención REGISTRADA → «Anular» con motivo de 10 a 200 caracteres.
   - Reportes → muestra el agregado por especie.
8. Entrar como `recepcion` y abrir `/reportes` a mano → «Acceso denegado»; si se llama al endpoint
   con su token, el backend responde **403** y la sesión **no** se cierra.
9. Sesión vencida: `F12 → Application → Session Storage → vetandes.sesion`, cambiar `expiraEn` a un
   número pequeño (por ejemplo `1`), pulsar **F5** → la SPA vuelve a pedir el login.

## Versionado

```bash
git init
git checkout -b main
git add . && git commit -m "feat(spa): proyecto Angular, layout y navegación con carga diferida"
git checkout -b develop
git checkout -b examen-b-<apellido>
# ... un commit por pregunta, con la convención feat/fix/refactor/test
git tag -a v1.0-examen-u2 -m "Examen Parcial II"
git push origin --tags
```
