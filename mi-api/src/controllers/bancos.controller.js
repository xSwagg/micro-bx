/**
 * ==============================================
 * MÓDULO 4 — ENTIDADES BANCARIAS
 * Endpoints:
 *  - GET    /api/bancos
 *  - GET    /api/bancos/:banco_id
 *  - POST   /api/admin/bancos
 *  - PUT    /api/admin/bancos/:banco_id
 *  - DELETE /api/admin/bancos/:banco_id
 * ==============================================
 */
const Banco = require('../models/bancos.model');

const RESPUESTAS = ['aprobado', 'rechazado', 'pendiente'];

// GET /api/bancos
const getAll = async (req, res) => {
  try {
    const rows = await Banco.getAll();
    res.json({ ok: true, data: rows });
  } catch (err) {
    res.status(500).json({ ok: false, msg: 'Error de conexión', error: err.message });
  }
};

// GET /api/bancos/:banco_id
const getById = async (req, res) => {
  try {
    const { banco_id } = req.params;
    const banco = await Banco.getById(banco_id);
    if (!banco) {
      return res.status(404).json({ ok: false, msg: 'Banco no encontrado' });
    }
    res.json({ ok: true, data: banco });
  } catch (err) {
    res.status(500).json({ ok: false, msg: 'Error de conexión', error: err.message });
  }
};

// POST /api/admin/bancos
const create = async (req, res) => {
  try {
    const { nombre_banco, respuesta = 'pendiente', observaciones = '' } = req.body || {};

    if (!nombre_banco) {
      return res.status(400).json({ ok: false, msg: 'nombre_banco es requerido' });
    }
    if (!RESPUESTAS.includes(respuesta)) {
      return res.status(400).json({ ok: false, msg: 'respuesta inválida' });
    }

    const id = await Banco.create({ nombre_banco, respuesta, observaciones });
    res.status(201).json({ ok: true, msg: 'Entidad bancaria creada exitosamente', id });
  } catch (err) {
    res.status(500).json({ ok: false, msg: 'Error de conexión', error: err.message });
  }
};

// PUT /api/admin/bancos/:banco_id
const update = async (req, res) => {
  try {
    const { banco_id } = req.params;
    const body = req.body || {};

    const existe = await Banco.getById(banco_id);
    if (!existe) {
      return res.status(404).json({ ok: false, msg: 'Banco no encontrado' });
    }

    await Banco.update(banco_id, body);
    res.json({ ok: true, msg: 'Entidad bancaria actualizada exitosamente' });
  } catch (err) {
    res.status(500).json({ ok: false, msg: 'Error de conexión', error: err.message });
  }
};

// DELETE /api/admin/bancos/:banco_id
const remove = async (req, res) => {
  try {
    const { banco_id } = req.params;
    const affected = await Banco.remove(banco_id);
    if (affected === 0) {
      return res.status(404).json({ ok: false, msg: 'Banco no encontrado' });
    }
    res.json({ ok: true, msg: 'Entidad bancaria eliminada exitosamente' });
  } catch (err) {
    res.status(500).json({ ok: false, msg: 'Error de conexión', error: err.message });
  }
};

module.exports = { getAll, getById, create, update, remove };