const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/pruebaVirtual.controller');

router.post('/prueba-virtual', ctrl.registrar);            // POST /api/prueba-virtual
router.get('/prueba-virtual/:usuario_id', ctrl.getByUsuario); // GET /api/prueba-virtual/:id

module.exports = router;