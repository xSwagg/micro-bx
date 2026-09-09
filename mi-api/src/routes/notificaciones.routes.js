const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/notificaciones.controller');

router.get('/notificaciones/:usuario_id', ctrl.getByUsuario);        // GET /api/notificaciones/:id
router.put('/notificaciones/:notificacion_id/leida', ctrl.setLeida); // PUT /api/notificaciones/:id/leida

module.exports = router;