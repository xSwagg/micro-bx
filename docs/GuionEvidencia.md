# Guion de evidencia — MicrocreditosBX

> Guion orientativo para la grabación de la evidencia audiovisual (materia SENA ADSO / presentación del proyecto).
> Cada escena indica: qué se muestra, datos de prueba a usar y el resultado esperado en pantalla.

---

## Preparación previa a la grabación

1. Levantar MySQL (servicio Windows `MySQL`).
2. Restaurar la base de datos demo (opcional, para datos limpios):
   ```cmd
   mysql -u root < D:\isaac\MicrocreditosBX\database\micropsev2.sql
   ```
3. Levantar la API:
   ```cmd
   cd D:\isaac\MicrocreditosBX\backend
   venv\Scripts\python.exe -m uvicorn main:app --host 127.0.0.1 --port 8080
   ```
4. Abrir `D:\isaac\MicrocreditosBX\main\index.html` en el navegador.
5. Verificar Swagger: `http://127.0.0.1:8080/docs`.

> Consejo: grabar en 1080p, ventana con zoom cómodo, y mostrar la consola de la API
> (ventana "MicrocreditosBX API") en un segundo plano para evidenciar los logs.

---

## Escena 1 — Presentación del proyecto y arquitectura

- **Qué se muestra**: pantalla de inicio / diapositiva con el nombre del proyecto y el esquema:
  Frontend multi-página (HTML/CSS/JS) → API REST (FastAPI, puerto 8080) → MySQL (`micropsev2`).
- **Locución sugerida**: "MicrocreditosBX es una plataforma web de microcréditos con frontend
  multi-página, API REST en FastAPI y base de datos MySQL. Incluye autenticación con bcrypt,
  flujo de aprobación de solicitudes, créditos, pagos, notificaciones, entidades bancarias,
  prueba virtual de educación financiera y panel de administración."

## Escena 2 — Puesta en marcha automática (start.bat)

- **Qué se muestra**: ejecutar `start.bat` desde el Explorador.
- **Resultado esperado**: consola muestra 3 pasos (MySQL verificando/iniciando → API levantada
  en `http://127.0.0.1:8080` → navegador abre la portada) y la portada carga las estadísticas
  del sistema sin errores.

## Escena 3 — Portada y estadísticas

- **Qué se muestra**: `main\index.html` — hero, sección de estadísticas (créditos aprobados,
  solicitudes aprobadas, entidades aliadas) y "Solicitudes recientes".
- **Resultado esperado**: los números coinciden con la BD demo (7 créditos, 7 entidades);
  las solicitudes recientes muestran monto formateado en pesos colombianos, estado con badge
  de color y entidad bancaria.
- **Captura recomendada**: `docs\capturas\01-portada.png`.

## Escena 4 — Registro de cliente

- **Qué se muestra**: `sesion\registro.html`. Registrar un cliente nuevo:
  - Nombre: Laura / Apellido: Torres
  - Cédula: 1032500001 / Correo: `laura.torres@email.com`
  - Teléfono: 3001234567 / Contraseña: `123456`
- **Resultado esperado**: mensaje "Registro exitoso" y redirección al login.
- **Dato técnico a comentar**: la contraseña se guarda en BD con **bcrypt** (se puede verificar
  en Swagger `POST /api/registro` la respuesta `{"id": 11}`).

## Escena 5 — Inicio de sesión por rol

- **Qué se muestra**: `sesion\iniciarSesion.html`.
- **Caso administrador**: `carlos.martinez@email.com` / `123456` → debe llevar al **panel admin**.
- **Caso cliente**: `maria.lopez@email.com` / `123456` → debe llevar a la **portada** (navbar con
  su nombre, sin enlace "Admin").
- **Error esperado**: contraseña incorrecta → alerta roja "Credenciales incorrectas";
  usuario inactivo (Jorge Sánchez `jorge.sanchez@email.com`) → "Usuario desactivado" (403).

## Escena 6 — Perfil del cliente

- **Qué se muestra**: `sesion\perfil.html` con la sesión de María López.
  - **Stats**: solicitudes, créditos, saldo pendiente (formateado), notificaciones sin leer.
  - **Pestaña Solicitudes**: listado con badge de estado.
  - **Pestaña Créditos**: tarjetas con barra de progreso de cuotas y saldo.
  - **Pestaña Notificaciones**: mensaje nuevo → botón "Marcar leída".
  - **Datos personales**: editar teléfono → "Perfil actualizado".
  - **Cambiar contraseña**: contraseña actual incorrecta → alerta "Contraseña actual incorrecta".
  - **Prueba virtual** (si aplica): responder el cuestionario → "Puntaje 80% — ¡Prueba aprobada!".

## Escena 7 — Solicitud de crédito (cliente)

- **Qué se muestra**: `solicitudes\solicitudes.html` con sesión de María (o Laura, recién creada).
- **Acción**: botón "+ Nueva solicitud" → monto `3.000.000` → "Solicitud creada exitosamente".
- **Resultado esperado**: la solicitud aparece con estado `Pendiente`.

## Escena 8 — Administración: flujo de aprobación

- **Qué se muestra**: sesión de administrador → enlace **Admin** → pestaña **Solicitudes**.
- **Acciones**: abrir "Gestionar" → detalle con datos + historial (`-` → `pendiente`):
  1. **Pasar a revisión** → estado cambia a `en_revision`, log `pendiente → en_revision`.
  2. **Aprobar** → modal con monto aprobado, tasa 2.50, plazo 12 y entidad (ej. "Bancolombia")
     → "Solicitud aprobada y crédito creado".
  3. **Verificar efecto en BD** (opcional, consola/MySQL):
     ```sql
     SELECT * FROM credito WHERE id_solicitud = 11;
     SELECT * FROM estado_solicitud_log WHERE id_solicitud = 11;
     SELECT * FROM notificacion WHERE id_usuario = 4 ORDER BY fecha_envio DESC;
     ```
- **Caso alternativo**: aprobar por segunda vez → error 400 "La solicitud ya está aprobada";
  o bien **rechazar** con observaciones → `?observaciones=...` + notificación al cliente.

## Escena 9 — Créditos y pagos

- **Qué se muestra**: `creditos\creditos.html` — listado con progreso de cuotas y saldos.
- **Detalle**: abrir un crédito → historial de pagos (monto, fecha, método).
- **Registrar pago** (como cliente con crédito activo, ej. María):
  - Monto: `250.000`, método: **PSE**.
- **Resultado esperado**: alerta "Pago de 250000 registrado. Saldo restante: ..." y el saldo
  decrementado en el listado; notificación "pago_recibido" en el perfil.

## Escena 10 — Entidades bancarias

- **Qué se muestra**: `bancos\bancos.html` — listado público (nombre, respuesta con badge,
  fecha y observaciones).
- **Como administrador**: crear entidad (`Banco Caja Social`), editar respuesta a `aprobado`
  (fecha de respuesta se actualiza) y eliminar.

## Escena 11 — Administración de usuarios

- **Qué se muestra**: `admin\index.html` → pestaña **Usuarios**.
- **Acciones**: editar usuario → cambiar rol a `asesor`, nivel `intermedio`, desactivar `activo`,
  y guardar. Verificar que el listado refleja el cambio (fila atenuada si `activo=0`).

## Escena 12 — API en vivo (Swagger / Postman)

- **Qué se muestra**: `http://127.0.0.1:8080/docs` probando con "Try it out":
  - `POST /api/login`
  - `GET /api/creditos`
  - `POST /api/solicitudes`
- **Alternativa**: usar la **colección Postman** (`docs\MicrocreditosBX_Coleccion_Postman.json`).

## Escena 13 — Pruebas automatizadas

- **Qué se muestra**: ejecutar `run_tests.bat` (o el comando pytest).
- **Resultado esperado**: **99 passed** en consola.
- **Locución**: "La suite de pruebas automatizadas valida autenticación, perfil, solicitudes,
  créditos, pagos, bancos, notificaciones, prueba virtual, administración y compatibilidad
  con el frontend antiguo, restaurando la base de datos a un estado limpio en cada ejecución."

## Escena 14 — Cierre

- **Qué se muestra**: portada + estructuras de carpetas (`main/ sesion/ solicitudes/ creditos/
  bancos/ admin/ backend/ tests/ docs/`).
- **Locución**: resumen de tecnologías (FastAPI, MySQL, bcrypt, HTML/CSS/JS vanilla, pytest),
  lista de características y próximos pasos (JWT, cuotas individuales).

---

## Lista de verificación de capturas

| Archivo sugerido | Contenido |
|---|---|
| `docs\capturas\01-portada.png` | Portada con estadísticas cargadas |
| `docs\capturas\02-perfil.png` | Perfil de cliente con stats, tabs y progreso |
| `docs\capturas\03-admin-solicitud.png` | Flujo de aprobación con log |
| `docs\capturas\04-pago.png` | Registro de pago |
| `docs\capturas\05-docs.png` | Swagger con un endpoint probado |
| `docs\capturas\06-tests.png` | Resultado 99 passed |