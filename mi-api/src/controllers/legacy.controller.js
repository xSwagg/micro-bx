/**
 * Endpoints LEGACY para compatibilidad con la SPA antigua (index.html)
 * Mismo contrato que el backend FastAPI original.
 */
const pool = require('../db');

// POST /registrar
const registrar = async (req, res) => {
  const ctrl = require('../controllers/usuarios.controller');
  return ctrl.registro(req, res);
};

// POST /solicitar
const solicitar = async (req, res) => {
  const ctrl = require('../controllers/solicitudes.controller');
  return ctrl.crear(req, res);
};

// POST /pagar
const pagar = async (req, res) => {
  const ctrl = require('../controllers/creditos.controller');
  return ctrl.registrarPago(req, res);
};

// GET /solicitudes/:correo
const verSolicitudes = async (req, res) => {
  try {
    const { correo } = req.params;

    const [usuario] = await pool.query('SELECT id_usuario FROM usuario WHERE correo = ?', [correo]);
    if (!usuario) {
      return res.status(404).json({ ok: false, msg: 'Usuario no encontrado' });
    }

    const [solicitudes] = await pool.query(
      `SELECT id_solicitud, monto, fecha, estado FROM solicitud
       WHERE id_usuario = ? ORDER BY fecha DESC`,
      [usuario.id_usuario]
    );

    res.json({ ok: true, solicitudes });
  } catch (err) {
    res.status(500).json({ ok: false, msg: 'Error de conexión', error: err.message });
  }
};

// GET /credito/:correo
const verCredito = async (req, res) => {
  try {
    const { correo } = req.params;

    const [filas] = await pool.query(
      `SELECT c.monto_aprobado, c.saldo_pendiente, c.cuotas_totales, c.cuotas_pagadas
       FROM credito c
       JOIN solicitud s ON c.id_solicitud = s.id_solicitud
       JOIN usuario u ON s.id_usuario = u.id_usuario
       WHERE u.correo = ? AND c.saldo_pendiente > 0 LIMIT 1`,
      [correo]
    );
    const credito = filas[0];

    if (!credito) {
      return res.json({ ok: true, mensaje: 'No tienes créditos activos' });
    }

    res.json(credito);
  } catch (err) {
    res.status(500).json({ ok: false, msg: 'Error de conexión', error: err.message });
  }
};

module.exports = { registrar, solicitar, pagar, verSolicitudes, verCredito };