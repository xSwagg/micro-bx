/**
 * ==============================================
 * MÓDULO 3 — CRÉDITOS Y PAGOS
 * Endpoints:
 *  - GET    /api/creditos
 *  - GET    /api/creditos/:credito_id
 *  - GET    /api/creditos/usuario/:usuario_id   (?activo=1)
 *  - GET    /api/creditos/:credito_id/pagos
 *  - POST   /api/admin/creditos
 *  - PUT    /api/admin/creditos/:credito_id
 *  - DELETE /api/admin/creditos/:credito_id
 *  - GET    /api/pagos
 *  - POST   /api/pagos
 * ==============================================
 */
const Credito = require('../models/creditos.model');

// GET /api/creditos
const getAll = async (req, res) => {
  try {
    const rows = await Credito.getAll();
    res.json({ ok: true, data: rows });
  } catch (err) {
    res.status(500).json({ ok: false, msg: 'Error de conexión', error: err.message });
  }
};

// GET /api/creditos/:credito_id
const getById = async (req, res) => {
  try {
    const { credito_id } = req.params;

    const credito = await Credito.getById(credito_id);
    if (!credito) {
      return res.status(404).json({ ok: false, msg: 'Crédito no encontrado' });
    }

    credito.pagos = await Credito.getPagos(credito_id);
    res.json({ ok: true, data: credito });
  } catch (err) {
    res.status(500).json({ ok: false, msg: 'Error de conexión', error: err.message });
  }
};

// GET /api/creditos/usuario/:usuario_id
const getByUsuario = async (req, res) => {
  try {
    const { usuario_id } = req.params;
    const activo = Number(req.query.activo) === 1 ? 1 : undefined;
    const rows = await Credito.getByUsuario(usuario_id, activo);
    res.json({ ok: true, data: rows });
  } catch (err) {
    res.status(500).json({ ok: false, msg: 'Error de conexión', error: err.message });
  }
};

// GET /api/creditos/:credito_id/pagos
const getPagos = async (req, res) => {
  try {
    const { credito_id } = req.params;
    const rows = await Credito.getPagos(credito_id);
    res.json({ ok: true, data: rows });
  } catch (err) {
    res.status(500).json({ ok: false, msg: 'Error de conexión', error: err.message });
  }
};

// POST /api/admin/creditos
const create = async (req, res) => {
  try {
    const { id_solicitud, monto_aprobado, tasa_interes = 2.50, plazo = 12, cuotas_totales = null } = req.body || {};

    if (!id_solicitud || monto_aprobado === undefined) {
      return res.status(400).json({ ok: false, msg: 'id_solicitud y monto_aprobado son requeridos' });
    }

    const solicitud = await Credito.findEstadoSolicitud(id_solicitud);
    if (!solicitud) {
      return res.status(404).json({ ok: false, msg: 'Solicitud no encontrada' });
    }

    const id_credito = await Credito.create({
      id_solicitud,
      monto_aprobado,
      tasa_interes,
      plazo,
      cuotas_totales: cuotas_totales || plazo,
    });

    await Credito.setSolicitudAprobada(id_solicitud, solicitud.estado);

    res.status(201).json({ ok: true, msg: 'Crédito creado exitosamente', id: id_credito });
  } catch (err) {
    res.status(500).json({ ok: false, msg: 'Error de conexión', error: err.message });
  }
};

// PUT /api/admin/creditos/:credito_id
const update = async (req, res) => {
  try {
    const { credito_id } = req.params;
    const body = req.body || {};

    const existe = await Credito.findById(credito_id);
    if (!existe) {
      return res.status(404).json({ ok: false, msg: 'Crédito no encontrado' });
    }

    await Credito.update(credito_id, body);
    res.json({ ok: true, msg: 'Crédito actualizado exitosamente' });
  } catch (err) {
    res.status(500).json({ ok: false, msg: 'Error de conexión', error: err.message });
  }
};

// DELETE /api/admin/creditos/:credito_id
const remove = async (req, res) => {
  try {
    const { credito_id } = req.params;
    const affected = await Credito.remove(credito_id);
    if (affected === 0) {
      return res.status(404).json({ ok: false, msg: 'Crédito no encontrado' });
    }
    res.json({ ok: true, msg: 'Crédito eliminado exitosamente' });
  } catch (err) {
    res.status(500).json({ ok: false, msg: 'Error de conexión', error: err.message });
  }
};

// GET /api/pagos
const getAllPagos = async (req, res) => {
  try {
    const rows = await Credito.getAllPagos();
    res.json({ ok: true, data: rows });
  } catch (err) {
    res.status(500).json({ ok: false, msg: 'Error de conexión', error: err.message });
  }
};

// POST /api/pagos
const registrarPago = async (req, res) => {
  try {
    const { correo, monto, id_metodo = null } = req.body || {};

    if (!correo || monto === undefined) {
      return res.status(400).json({ ok: false, msg: 'correo y monto son requeridos' });
    }
    if (monto <= 0) {
      return res.status(400).json({ ok: false, msg: 'El monto debe ser mayor a cero' });
    }

    const credito = await Credito.findCreditoActivoByCorreo(correo);
    if (!credito) {
      return res.status(404).json({ ok: false, msg: 'No tienes créditos activos' });
    }

    const nuevo_saldo = Number(credito.saldo_pendiente) - Number(monto);

    await Credito.registrarPago({ id_credito: credito.id_credito, id_metodo, monto });
    await Credito.aplicarPagoCredito({ id_credito: credito.id_credito, nuevo_saldo });

    const saldo_final = Math.max(nuevo_saldo, 0);

    const notificacion = require('../models/solicitudes.model');
    await notificacion.insertNotificacion({
      id_usuario: credito.id_usuario,
      tipo: 'pago_recibido',
      mensaje: `Se ha recibido tu pago de $${Number(monto).toLocaleString('es-CO')}. Saldo pendiente: $${Math.round(saldo_final).toLocaleString('es-CO')}`,
    });

    if (nuevo_saldo <= 0) {
      await Credito.desactivarUsuario(credito.id_usuario);
    }

    res.json({ ok: true, msg: `Pago de ${monto} registrado`, saldo_restante: saldo_final });
  } catch (err) {
    res.status(500).json({ ok: false, msg: 'Error de conexión', error: err.message });
  }
};

module.exports = { getAll, getById, getByUsuario, getPagos, create, update, remove, getAllPagos, registrarPago };