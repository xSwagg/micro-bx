# ENDPOINTS — MicrocreditosBX API

Base de la API: `http://127.0.0.1:8080/api`

Documentación interactiva (Swagger): `http://127.0.0.1:8080/docs`

Formato: JSON. Codificación: UTF-8.

---

## Índice

- [Auth](#auth)
- [Perfil](#perfil)
- [Solicitudes](#solicitudes)
- [Flujo de solicitudes (admin)](#flujo-de-solicitudes-admin)
- [Créditos](#créditos)
- [Pagos](#pagos)
- [Entidades bancarias](#entidades-bancarias)
- [Notificaciones](#notificaciones)
- [Prueba virtual](#prueba-virtual)
- [Administración de usuarios](#administración-de-usuarios)
- [Endpoints legacy (compatibilidad)](#endpoints-legacy-compatibilidad)

---

## Auth

### POST `/api/registro`

Registra un usuario y su perfil (rol por defecto `cliente`). Encripta la contraseña con **bcrypt**.

Body:

```json
{
  "nombre": "Laura",
  "apellido": "Torres",
  "cedula": "1032500001",
  "correo": "laura.torres@email.com",
  "contrasena": "123456",
  "telefono": "3001234567"
}
```

`apellido`, `contrasena` (default `123456`) y `telefono` son opcionales.

```bash
curl -X POST http://127.0.0.1:8080/api/registro ^
  -H "Content-Type: application/json" ^
  -d "{\"nombre\":\"Laura\",\"apellido\":\"Torres\",\"cedula\":\"1032500001\",\"correo\":\"laura.torres@email.com\",\"contrasena\":\"123456\"}"
```

Respuesta 200:

```json
{ "message": "Usuario registrado exitosamente", "id": 11 }
```

Errores: `400` correo o cédula ya registrados.

### POST `/api/login`

Body:

```json
{ "correo": "carlos.martinez@email.com", "contrasena": "123456" }
```

```bash
curl -X POST http://127.0.0.1:8080/api/login ^
  -H "Content-Type: application/json" ^
  -d "{\"correo\":\"carlos.martinez@email.com\",\"contrasena\":\"123456\"}"
```

Respuesta 200:

```json
{
  "id": 1,
  "nombre": "Carlos",
  "apellido": "Martínez",
  "correo": "carlos.martinez@email.com",
  "telefono": "3001112233",
  "rol": "administrador",
  "nivel": "avanzado"
}
```

Errores: `401` credenciales incorrectas, `403` usuario desactivado.

---

## Perfil

### GET `/api/perfil/{usuario_id}`

Devuelve el perfil + solicitudes + créditos + notificaciones del usuario.

```bash
curl http://127.0.0.1:8080/api/perfil/1
```

Respuesta 200 (resumida):

```json
{
  "id_usuario": 1,
  "nombre": "Carlos",
  "apellido": "Martínez",
  "correo": "carlos.martinez@email.com",
  "telefono": "3001112233",
  "cedula": "1010101",
  "fecha_registro": "2025-01-10T10:00:00",
  "prueba_virtual_completada": 1,
  "activo": 1,
  "foto": "default_avatar.png",
  "nivel": "avanzado",
  "rol": "administrador",
  "solicitudes": [ { "id_solicitud": 1, "monto": 5000000.0, "fecha": "...", "estado": "aprobado" } ],
  "creditos":     [ { "id_credito": 1, "monto_aprobado": 5000000.0, "saldo_pendiente": 4000000.0, "cuotas_totales": 12, "cuotas_pagadas": 2, "tasa_interes": 2.5, "fecha_aprobacion": "..." } ],
  "notificaciones": [ { "id_notificacion": 1, "tipo": "aprobacion", "mensaje": "...", "leida": 0, "fecha_envio": "..." } ]
}
```

### PUT `/api/perfil/{usuario_id}`

Actualiza campos opcionales: `nombre`, `apellido`, `telefono`, `nivel` (`basico|intermedio|avanzado`), `foto`.

```bash
curl -X PUT http://127.0.0.1:8080/api/perfil/11 ^
  -H "Content-Type: application/json" ^
  -d "{\"nombre\":\"Laura\",\"telefono\":\"3000009999\",\"nivel\":\"intermedio\"}"
```

### PUT `/api/perfil/{usuario_id}/password`

Body:

```json
{ "contrasena_actual": "123456", "contrasena_nueva": "nueva123" }
```

Error `401`: contraseña actual incorrecta.

---

## Solicitudes

### GET `/api/solicitudes`

Lista todas las solicitudes con datos del solicitante y entidad bancaria.

```bash
curl "http://127.0.0.1:8080/api/solicitudes"
```

Filtro por estado:

```bash
curl "http://127.0.0.1:8080/api/solicitudes?estado=pendiente"
```

Respuesta 200 (elemento):

```json
{
  "id_solicitud": 1,
  "monto": 5000000.0,
  "fecha": "2025-01-15T09:00:00",
  "estado": "aprobado",
  "id_banco": 1,
  "nombre": "Carlos",
  "apellido": "Martínez",
  "correo": "carlos.martinez@email.com",
  "cedula": "1010101",
  "nombre_banco": "Banco de Bogotá"
}
```

### GET `/api/solicitudes/{solicitud_id}`

Detalle de la solicitud + arr. `credito` con los créditos vinculados.

### GET `/api/solicitudes/{solicitud_id}/log`

Historial de cambios de estado (`estado_anterior`, `estado_nuevo`, `fecha_cambio`, `usuario_responsable`).

### GET `/api/usuario/{usuario_id}/solicitudes`

Solicitudes de un usuario específico.

### POST `/api/solicitudes`

Crea una solicitud pendiente (usa el **correo** del solicitante), crea notificación y el primer registro de log.

Body:

```json
{ "correo": "maria.lopez@email.com", "monto": 3000000 }
```

```bash
curl -X POST http://127.0.0.1:8080/api/solicitudes ^
  -H "Content-Type: application/json" ^
  -d "{\"correo\":\"maria.lopez@email.com\",\"monto\":3000000}"
```

Respuesta 200:

```json
{ "message": "Solicitud creada exitosamente", "id_solicitud": 11, "estado": "pendiente" }
```

---

## Flujo de solicitudes (admin)

### PUT `/api/admin/solicitudes/{solicitud_id}/revision`

Pasa la solicitud a `en_revision`. Si ya está aprobada/rechazada responde `400`.

Body (opcional):

```json
{ "estado": "en_revision" }
```

```bash
curl -X PUT http://127.0.0.1:8080/api/admin/solicitudes/11/revision ^
  -H "Content-Type: application/json" ^
  -d "{\"estado\":\"en_revision\"}"
```

### PUT `/api/admin/solicitudes/{solicitud_id}/aprobar`

Aprueba, crea el **crédito**, actualiza la entidad bancaria, escribe el log y notifica al usuario.

Body:

```json
{
  "monto_aprobado": 3000000,
  "tasa_interes": 2.50,
  "plazo": 12,
  "id_banco": 2
}
```

`tasa_interes` (default `2.50`), `plazo` (default `12`) e `id_banco` (null por defecto) son opcionales.

```bash
curl -X PUT http://127.0.0.1:8080/api/admin/solicitudes/11/aprobar ^
  -H "Content-Type: application/json" ^
  -d "{\"monto_aprobado\":3000000,\"tasa_interes\":2.50,\"plazo\":12,\"id_banco\":2}"
```

### PUT `/api/admin/solicitudes/{solicitud_id}/rechazar`

Rechaza la solicitud. **No recibe body**; las observaciones van como query param:

```bash
curl -X PUT "http://127.0.0.1:8080/api/admin/solicitudes/11/rechazar?observaciones=Falta%20documentaci%C3%B3n"
```

*(el parámetro `observaciones` es opcional)*

---

## Créditos

### GET `/api/creditos`

Todos los créditos con titular, saldo, cuotas y fecha de aprobación.

### GET `/api/creditos/{credito_id}`

Detalle del crédito + arr. `pagos` (`id_pago`, `monto_pago`, `fecha_pago`, `nombre_metodo`).

### GET `/api/creditos/usuario/{usuario_id}`

Créditos del usuario. Con `?activo=1` devuelve solo los que tienen `saldo_pendiente > 0`.

### GET `/api/creditos/{credito_id}/pagos`

Pagos del crédito.

### POST `/api/admin/creditos`

Crea un crédito manualmente y marca la solicitud como `aprobado`.

Body:

```json
{
  "id_solicitud": 11,
  "monto_aprobado": 3000000,
  "tasa_interes": 2.50,
  "plazo": 12,
  "cuotas_totales": 12
}
```

### PUT `/api/admin/creditos/{credito_id}`

Actualiza campos opcionales: `monto_aprobado`, `tasa_interes`, `plazo`, `cuotas_totales`, `cuotas_pagadas`, `saldo_pendiente`.

### DELETE `/api/admin/creditos/{credito_id}`

```bash
curl -X DELETE http://127.0.0.1:8080/api/admin/creditos/11
```

---

## Pagos

### GET `/api/pagos`

Todos los pagos con crédito, usuario, método y fecha.

### POST `/api/pagos`

Registra un pago para el crédito **activo** (`saldo_pendiente > 0`) del usuario. Reduce el saldo, incrementa `cuotas_pagadas`, crea notificación y **desactiva el usuario** (`activo=0`) cuando el saldo llega a 0.

Body:

```json
{ "correo": "maria.lopez@email.com", "monto": 250000, "id_metodo": 1 }
```

`id_metodo` opcional. Métodos disponibles: `1` PSE, `2` Nequi, `3` Daviplata, `4` Transferencia bancaria, `5` Efectivo.

```bash
curl -X POST http://127.0.0.1:8080/api/pagos ^
  -H "Content-Type: application/json" ^
  -d "{\"correo\":\"maria.lopez@email.com\",\"monto\":250000,\"id_metodo\":1}"
```

Respuesta 200:

```json
{ "message": "Pago de 250000 registrado", "saldo_restante": 2750000.0 }
```

Error `400`: monto <= 0. Error `404`: el usuario no tiene créditos activos.

---

## Entidades bancarias

### GET `/api/bancos`

Todas las entidades (`respuesta` en `aprobado|rechazado|pendiente`).

### GET `/api/bancos/{banco_id}`

Detalle de una entidad.

### POST `/api/admin/bancos`

Body:

```json
{ "nombre_banco": "Banco Caja Social", "respuesta": "pendiente", "observaciones": "" }
```

### PUT `/api/admin/bancos/{banco_id}`

Actualiza campos opcionales: `nombre_banco`, `respuesta` (al cambiarla de `pendiente` se actualiza `fecha_respuesta`), `observaciones`.

### DELETE `/api/admin/bancos/{banco_id}`

Elimina la entidad.

---

## Notificaciones

### GET `/api/notificaciones/{usuario_id}`

Lista de notificaciones del usuario (nuevas primero).

### PUT `/api/notificaciones/{notificacion_id}/leida`

Body: `{"leida": 1}` (o `0` para marcar como no leída).

---

## Prueba virtual

### POST `/api/prueba-virtual`

Registra la prueba. Se considera aprobada si `puntaje >= 60`.

Body:

```json
{ "id_usuario": 11, "puntaje": 80 }
```

Respuesta 200:

```json
{ "message": "Prueba registrada", "aprobada": true }
```

### GET `/api/prueba-virtual/{usuario_id}`

Historial de pruebas del usuario.

---

## Administración de usuarios

### GET `/api/admin/usuarios`

Todos los usuarios con rol y nivel.

### PUT `/api/admin/usuarios/{usuario_id}/rol`

El rol va como **query param** (no en el body):

```bash
curl -X PUT "http://127.0.0.1:8080/api/admin/usuarios/11/rol?rol=asesor"
```

Valores válidos: `cliente`, `asesor`, `administrador`.

### PUT `/api/admin/usuarios/{usuario_id}`

Actualiza campos opcionales: `nombre`, `apellido`, `cedula`, `correo`, `telefono`, `rol`, `nivel`, `activo` (0/1).

```bash
curl -X PUT http://127.0.0.1:8080/api/admin/usuarios/11 ^
  -H "Content-Type: application/json" ^
  -d "{\"rol\":\"cliente\",\"activo\":1,\"nivel\":\"basico\"}"
```

### DELETE `/api/admin/usuarios/{usuario_id}`

Desactiva el usuario (`activo = 0`, no lo elimina físicamente por integridad referencial).

---

## Endpoints legacy (compatibilidad)

Soportados por la SPA antigua `index.html`; se mantienen hasta la migración total.

| Método | Ruta | Equivalente moderno |
|---|---|---|
| POST | `/registrar` | `/api/registro` |
| POST | `/solicitar` | `/api/solicitudes` |
| GET | `/solicitudes/{correo}` | `/api/usuario/{id}/solicitudes` |
| GET | `/credito/{correo}` | `/api/creditos/usuario/{id}?activo=1` |
| POST | `/pagar` | `/api/pagos` |

Ejemplo legacy:

```bash
curl "http://127.0.0.1:8080/solicitudes/maria.lopez@email.com"
```

---

## Cuadro de códigos de error

| Código | Motivo |
|---|---|
| 400 | Petición inválida (datos duplicados, montos no válidos, estados ya resueltos…) |
| 401 | Credenciales incorrectas / contraseña actual errónea |
| 403 | Usuario desactivado |
| 404 | Recurso no encontrado (usuario, solicitud, crédito, banco…) |
| 500 | Error de conexión con la base de datos |