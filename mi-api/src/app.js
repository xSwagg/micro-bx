const express = require('express');
const app = express();

// Middleware para parsear JSON
app.use(express.json());

// =====================================================
// CABLEADO DE RUTAS
// Cada miembro del equipo crea su módulo de rutas y lo
// registra aquí. Consulta src/PLAN_DIVISION.md para ver
// qué parte corresponde a cada uno.
// =====================================================

// Módulo 1: Usuarios, Perfil y Autenticación
const usuariosRouter = require('./routes/usuarios.routes');
app.use('/api', usuariosRouter);

// Módulo 2: Solicitudes y flujo de aprobación
const solicitudesRouter = require('./routes/solicitudes.routes');
app.use('/api', solicitudesRouter);

// Módulo 3: Créditos y Pagos
const creditosRouter = require('./routes/creditos.routes');
app.use('/api', creditosRouter);

// Módulo 4: Entidades bancarias, Notificaciones y Prueba virtual
const bancosRouter = require('./routes/bancos.routes');
app.use('/api', bancosRouter);
const notificacionesRouter = require('./routes/notificaciones.routes');
app.use('/api', notificacionesRouter);
const pruebaRouter = require('./routes/pruebaVirtual.routes');
app.use('/api', pruebaRouter);

// Endpoints legacy (compatibilidad con la SPA antigua)
const legacyRouter = require('./routes/legacy.routes');
app.use('/', legacyRouter);

// Ruta raíz informativa
app.get('/', (req, res) => {
  res.json({ ok: true, msg: 'MicrocreditosBX API (Node/Express). Docs: /api/registro, /api/login, ...' });
});

module.exports = app;