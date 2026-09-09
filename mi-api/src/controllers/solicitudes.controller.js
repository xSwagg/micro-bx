/**
 * ==============================================
 * MÓDULO 2 — SOLICITUDES Y FLUJO DE APROBACIÓN
 * Endpoints:
 *  - GET    /api/solicitudes            (?estado=)
 *  - GET    /api/solicitudes/:solicitud_id
 *  - GET    /api/solicitudes/:solicitud_id/log
 *  - GET    /api/usuario/:usuario_id/solicitudes
 *  - POST   /api/solicitudes
 *  - PUT    /api/admin/solicitudes/:solicitud_id/revision
 *  - PUT    /api/admin/solicitudes/:solicitud_id/aprobar
 *  - PUT    /api/admin/solicitudes/:solicitud_id/rechazar  (?observaciones=)
 * ==============================================
 */
const Solicitud = require('../models/solicitudes.model');

// GET /api/solicitudes
const getAll = async (req, res) => {
  try {
    const { estado } = req.query;
    const rows = await Solicitud.getAll(estado);
    res.json({ ok: true, data: rows });
  } catch (err) {
    res.status(500).json({ ok: false, msg: 'Error de conexión', error: err.message });
  }
};

// GET /api/solicitudes/:solicitud_id
const getById = async (req, res) => {
  try {
    const { solicitud_id } = req.params;

    const solicitud = await Solicitud.getById(solicitud_id);
    if (!solicitud) {
      return res.status(404).json({ ok: false, msg: 'Solicitud no encontrada' });
    }

    solicitud.credito = await Solicitud.getCreditosBySolicitud(solicitud_id);
    res.json({ ok: true, data: solicitud });
  } catch (err) {
    res.status(500).json({ ok: false, msg: 'Error de conexión', error: err.message });
  }
};

// GET /api/solicitudes/:solicitud_id/log
const getLog = async (req, res) => {
  try {
    const { solicitud_id } = req.params;
    const rows = await Solicitud.getLog(solicitud_id);
    res.json({ ok: true, data: rows });
  } catch (err) {
    res.status(500).json({ ok: false, msg: 'Error de conexión', error: err.message });
  }
};

// GET /api/usuario/:usuario_id/solicitudes
const getByUsuario = async (req, res) => {
  try {
    const { usuario_id } = req.params;
    const rows = await Solicitud.getByUsuario(usuario_id);
    res.json({ ok: true, data: rows });
  } catch (err) {
    res.status(500).json({ ok: false, msg: 'Error de conexión', error: err.message });
  }
};

// POST /api/solicitudes
const crear = async (req, res) => {
  try {
    const { correo, monto } = req.body || {};
    if (!correo || monto === undefined) {
      return res.status(400).json({ ok: false, msg: 'correo y monto son requeridos' });
    }

    const usuario = await Solicitud.findUsuarioByCorreo(correo);
    if (!usuario) {
      return res.status(404).json({ ok: false, msg: 'Usuario no encontrado' });
    }

    const id_solicitud = await Solicitud.create({ id_usuario: usuario.id_usuario, monto });

    await Solicitud.insertNotificacion({
      id_usuario: usuario.id_usuario,
      tipo: 'solicitud_creada',
      mensaje: `Tu solicitud de crédito por $${Number(monto).toLocaleString('es-CO')} ha sido creada exitosamente.`,
    });
    await Solicitud.insertLog({
      solicitud_id: id_solicitud,
      estado_anterior: '-',
      estado_nuevo: 'pendiente',
    });

    res.status(201).json({ ok: true, msg: 'Solicitud creada exitosamente', id_solicitud, estado: 'pendiente' });
  } catch (err) {
    res.status(500).json({ ok: false, msg: 'Error de conexión', error: err.message });
  }
};

// PUT /api/admin/solicitudes/:solicitud_id/revision
const pasarRevision = async (req, res) => {
  try {
    const { solicitud_id } = req.params;

    const solicitud = await Solicitud.findEstado(solicitud_id);
    if (!solicitud) {
      return res.status(404).json({ ok: false, msg: 'Solicitud no encontrada' });
    }

    if (['aprobado', 'rechazado'].includes(solicitud.estado)) {
      return res.status(400).json({ ok: false, msg: 'La solicitud ya fue resuelta' });
    }

    await Solicitud.updateEstado(solicitud_id, 'en_revision');
    await Solicitud.insertLog({
      solicitud_id,
      estado_anterior: solicitud.estado,
      estado_nuevo: 'en_revision',
      usuario_responsable: 'admin@micropse.com',
    });

    res.json({ ok: true, msg: 'Solicitud en revisión' });
  } catch (err) {
    res.status(500).json({ ok: false, msg: 'Error de conexión', error: err.message });
  }
};

// PUT /api/admin/solicitudes/:solicitud_id/aprobar
const aprobar = async (req, res) => {
  try {
    const { solicitud_id } = req.params;
    const { monto_aprobado, tasa_interes = 2.50, plazo = 12, id_banco = null } = req.body || {};

    if (monto_aprobado === undefined) {
      return res.status(400).json({ ok: false, msg: 'monto_aprobado es requerido' });
    }

    const solicitud = await Solicitud.findEstado(solicitud_id);
    if (!solicitud) {
      return res.status(404).json({ ok: false, msg: 'Solicitud no encontrada' });
    }

    if (solicitud.estado === 'aprobado') {
      return res.status(400).json({ ok: false, msg: 'La solicitud ya está aprobada' });
    }

    const estado_anterior = solicitud.estado;

    await Solicitud.updateAprobada(solicitud_id, monto_aprobado, tasa_interes, plazo, id_banco);
    await Solicitud.createCredito({
      solicitud_id,
      monto_aprobado,
      tasa_interes,
      plazo,
      cuotas_totales: plazo,
    });
    await Solicitud.insertLog({
      solicitud_id,
      estado_anterior,
      estado_nuevo: 'aprobado',
      usuario_responsable: 'admin@micropse.com',
    });
    await Solicitud.insertNotificacion({
      id_usuario: solicitud.id_usuario,
      tipo: 'aprobacion',
      mensaje: `¡Felicidades! Tu crédito de $${Number(monto_aprobado).toLocaleString('es-CO')} ha sido APROBADO.`,
    });

    if (id_banco) {
      await Solicitud.marcarBancoRespuesta(id_banco, 'aprobado');
    }

    res.json({ ok: true, msg: 'Solicitud aprobada y crédito creado exitosamente' });
  } catch (err) {
    res.status(500).json({ ok: false, msg: 'Error de conexión', error: err.message });
  }
};

// PUT /api/admin/solicitudes/:solicitud_id/rechazar
const rechazar = async (req, res) => {
  try {
    const { solicitud_id } = req.params;
    const { observaciones = null } = req.query;

    const solicitud = await Solicitud.findEstado(solicitud_id);
    if (!solicitud) {
      return res.status(404).json({ ok: false, msg: 'Solicitud no encontrada' });
    }

    if (solicitud.estado === 'rechazado') {
      return res.status(400).json({ ok: false, msg: 'La solicitud ya está rechazada' });
    }

    const estado_anterior = solicitud.estado;

    await Solicitud.updateEstado(solicitud_id, 'rechazado');
    await Solicitud.insertLog({
      solicitud_id,
      estado_anterior,
      estado_nuevo: 'rechazado',
      usuario_responsable: 'admin@micropse.com',
    });

    if (solicitud.id_banco) {
      await Solicitud.marcarBancoRespuesta(solicitud.id_banco, 'rechazado', observaciones);
    }

    await Solicitud.insertNotificacion({
      id_usuario: solicitud.id_usuario,
      tipo: 'rechazo',
      mensaje: `Lo sentimos, tu solicitud de crédito fue rechazada.${observaciones ? ` Motivo: ${observaciones}` : ''}`,
    });

    res.json({ ok: true, msg: 'Solicitud rechazada' });
  } catch (err) {
    res.status(500).json({ ok: false, msg: 'Error de conexión', error: err.message });
  }
};

module.exports = { getAll, getById, getLog, getByUsuario, crear, pasarRevision, aprobar, rechazar };