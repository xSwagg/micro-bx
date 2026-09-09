/**
 * ==============================================
 * MÓDULO 4 — NOTIFICACIONES
 * Endpoints:
 *  - GET  /api/notificaciones/:usuario_id
 *  - PUT  /api/notificaciones/:notificacion_id/leida
 * ==============================================
 */
const Notificacion = require('../models/notificaciones.model');

// GET /api/notificaciones/:usuario_id
const getByUsuario = async (req, res) => {
  try {
    const { usuario_id } = req.params;
    const rows = await Notificacion.getByUsuario(usuario_id);
    res.json({ ok: true, data: rows });
  } catch (err) {
    res.status(500).json({ ok: false, msg: 'Error de conexión', error: err.message });
  }
};

// PUT /api/notificaciones/:notificacion_id/leida
const setLeida = async (req, res) => {
  try {
    const { notificacion_id } = req.params;
    const { leida = 1 } = req.body || {};

    const affected = await Notificacion.setLeida(notificacion_id, leida);
    if (affected === 0) {
      return res.status(404).json({ ok: false, msg: 'Notificación no encontrada' });
    }

    res.json({ ok: true, msg: 'Notificación actualizada' });
  } catch (err) {
    res.status(500).json({ ok: false, msg: 'Error de conexión', error: err.message });
  }
};

module.exports = { getByUsuario, setLeida };