# División del trabajo en equipo (4–5 miembros)

Repositorio: `mi-api/`. Cada miembro trabaja sobre sus propios archivos (`controller` + `routes`,
y si aplica `model`) y los sube a git por separado. El proyecto se conecta a la base de datos
**MySQL `micropsev2`** existente (misma que usa el backend FastAPI de MicrocreditosBX).

## Requisitos previos (todos)
```bash
cd mi-api
npm install express dotenv mysql2 bcryptjs
npm install -D nodemon
```

Configurar `.env`:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=micropsev2
PORT=3000
```

Correr: `npm run dev` (o `start-api.bat`).

---

## MIEMBRO 1 — Usuarios, Perfil y Autenticación (9 endpoints)
Archivos:
- `src/controllers/usuarios.controller.js` + `src/routes/usuarios.routes.js`
- `src/models/usuarios.model.js`

| Endpoint | Método |
|----------|--------|
| `/api/registro` | POST |
| `/api/login` | POST |
| `/api/perfil/:usuario_id` | GET |
| `/api/perfil/:usuario_id` | PUT |
| `/api/perfil/:usuario_id/password` | PUT |
| `/api/admin/usuarios` | GET |
| `/api/admin/usuarios/:usuario_id/rol` | PUT |
| `/api/admin/usuarios/:usuario_id` | PUT |
| `/api/admin/usuarios/:usuario_id` | DELETE |

---

## MIEMBRO 2 — Solicitudes y flujo admin (8 endpoints)
Archivos:
- `src/controllers/solicitudes.controller.js` + `src/routes/solicitudes.routes.js`
- `src/models/solicitudes.model.js`

| Endpoint | Método |
|----------|--------|
| `/api/solicitudes?estado=` | GET |
| `/api/solicitudes/:id` | GET |
| `/api/solicitudes/:id/log` | GET |
| `/api/usuario/:id/solicitudes` | GET |
| `/api/solicitudes` | POST |
| `/api/admin/solicitudes/:id/revision` | PUT |
| `/api/admin/solicitudes/:id/aprobar` | PUT |
| `/api/admin/solicitudes/:id/rechazar?observaciones=` | PUT |

---

## MIEMBRO 3 — Créditos y pagos (9 endpoints)
Archivos:
- `src/controllers/creditos.controller.js` + `src/routes/creditos.routes.js`
- `src/models/creditos.model.js`

| Endpoint | Método |
|----------|--------|
| `/api/creditos` | GET |
| `/api/creditos/usuario/:usuario_id?activo=` | GET |
| `/api/creditos/:credito_id` | GET |
| `/api/creditos/:credito_id/pagos` | GET |
| `/api/pagos` | GET |
| `/api/pagos` | POST |
| `/api/admin/creditos` | POST |
| `/api/admin/creditos/:credito_id` | PUT |
| `/api/admin/creditos/:credito_id` | DELETE |

---

## MIEMBRO 4 — Bancos, Notificaciones y Prueba virtual (9 endpoints)
Archivos:
- `src/controllers/bancos.controller.js` + `src/routes/bancos.routes.js`
- `src/controllers/notificaciones.controller.js` + `src/routes/notificaciones.routes.js`
- `src/controllers/pruebaVirtual.controller.js` + `src/routes/pruebaVirtual.routes.js`

| Endpoint | Método |
|----------|--------|
| `/api/bancos` | GET |
| `/api/bancos/:id` | GET |
| `/api/admin/bancos` | POST |
| `/api/admin/bancos/:id` | PUT |
| `/api/admin/bancos/:id` | DELETE |
| `/api/notificaciones/:usuario_id` | GET |
| `/api/notificaciones/:id/leida` | PUT |
| `/api/prueba-virtual` | POST |
| `/api/prueba-virtual/:usuario_id` | GET |

---

## MIEMBRO 5 (opcional) — Legacy SPA antigua (5 endpoints)
Archivos:
- `src/controllers/legacy.controller.js` + `src/routes/legacy.routes.js`

| Endpoint | Método |
|----------|--------|
| `/registrar` | POST |
| `/solicitar` | POST |
| `/solicitudes/:correo` | GET |
| `/credito/:correo` | GET |
| `/pagar` | POST |

---

## Cómo subir cada parte a git

Cada miembro hace su commit y push de sus propios archivos:

```bash
git add src/controllers/mi_archivo.controller.js src/routes/mi_archivo.routes.js src/models/mi_archivo.model.js
git commit -m "feat(mi-api): endpoints de <sección>"
git push origin <rama>
```

> **IMPORTANTE:** NO subir `.env` ni `node_modules/` (están en `.gitignore`).
> Asegúrate de que exista un `.gitignore` con estas líneas:
> ```
> node_modules/
> .env
> ```

## Cableado central (`src/app.js`)

`src/app.js` registra los 6 routers (`usuarios`, `solicitudes`, `creditos`, `bancos`,
`notificaciones`, `pruebaVirtual`) y el router `legacy`. Si un miembro crea un archivo con
otro nombre, debe actualizar la línea correspondiente en `app.js`, pero lo ideal es mantener
los nombres de arriba para que cada quien solo suba sus archivos sin tocar los de los demás.