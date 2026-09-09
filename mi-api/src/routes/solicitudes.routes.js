const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/solicitudes.controller');

// SOLICITUDES (público)
router.get('/solicitudes', ctrl.getAll);                          // GET    /api/solicitudes?estado=
router.get('/solicitudes/:solicitud_id', ctrl.getById);          // GET    /api/solicitudes/:id
router.get('/solicitudes/:solicitud_id/log', ctrl.getLog);       // GET    /api/solicitudes/:id/log
router.get('/usuario/:usuario_id/solicitudes', ctrl.getByUsuario); // GET /api/usuario/:id/solicitudes
router.post('/solicitudes', ctrl.crear);                          // POST   /api/solicitudes

// ADMIN - FLUJO DE SOLICITUDES
router.put('/admin/solicitudes/:solicitud_id/revision', ctrl.pasarRevision); // PUT /api/admin/solicitudes/:id/revision
router.put('/admin/solicitudes/:solicitud_id/aprobar', ctrl.aprobar);        // PUT /api/admin/solicitudes/:id/aprobar
router.put('/admin/solicitudes/:solicitud_id/rechazar', ctrl.rechazar);      // PUT /api/admin/solicitudes/:id/rechazar?observaciones=

module.exports = router;