const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/legacy.controller');

// Compatibilidad con la SPA antigua (sin prefijo /api)
router.post('/registrar', ctrl.registrar);                  // POST /registrar
router.post('/solicitar', ctrl.solicitar);                  // POST /solicitar
router.post('/pagar', ctrl.pagar);                          // POST /pagar
router.get('/solicitudes/:correo', ctrl.verSolicitudes);    // GET  /solicitudes/:correo
router.get('/credito/:correo', ctrl.verCredito);            // GET  /credito/:correo

module.exports = router;