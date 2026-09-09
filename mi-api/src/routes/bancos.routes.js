const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/bancos.controller');

// ENTIDADES BANCARIAS (público)
router.get('/bancos', ctrl.getAll);                    // GET    /api/bancos
router.get('/bancos/:banco_id', ctrl.getById);        // GET    /api/bancos/:id

// ADMIN - ENTIDADES
router.post('/admin/bancos', ctrl.create);            // POST   /api/admin/bancos
router.put('/admin/bancos/:banco_id', ctrl.update);   // PUT    /api/admin/bancos/:id
router.delete('/admin/bancos/:banco_id', ctrl.remove); // DELETE /api/admin/bancos/:id

module.exports = router;