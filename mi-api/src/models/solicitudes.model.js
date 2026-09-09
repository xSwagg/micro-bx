/**
 * Model SOLICITUDES (tabla `solicitud` + `estado_solicitud_log`)
 * Mismo patrón: ? placeholders, devuelve datos.
 */
const pool = require('../db');

const BASE_COLUMNS = `
  s.id_solicitud, s.monto, s.fecha, s.estado, s.id_banco,
  u.nombre, u.apellido, u.correo, u.cedula,
  b.nombre_banco`;

const getAll = async (estado) => {
  const select = `FROM solicitud s
    JOIN usuario u ON s.id_usuario = u.id_usuario
    LEFT JOIN entidad_bancaria b ON s.id_banco = b.id_banco`;

  if (estado && estado !== 'todas') {
    const [rows] = await pool.query(
      `SELECT ${BASE_COLUMNS} ${select} WHERE s.estado = ? ORDER BY s.fecha DESC`,
      [estado]
    );
    return rows;
  }
  const [rows] = await pool.query(`SELECT ${BASE_COLUMNS} ${select} ORDER BY s.fecha DESC`);
  return rows;
};

const getById = async (id) => {
  const [rows] = await pool.query(
    `SELECT ${BASE_COLUMNS}, u.id_usuario
     FROM solicitud s
     JOIN usuario u ON s.id_usuario = u.id_usuario
     LEFT JOIN entidad_bancaria b ON s.id_banco = b.id_banco
     WHERE s.id_solicitud = ?`,
    [id]
  );
  return rows[0];
};

const getCreditosBySolicitud = async (solicitud_id) => {
  const [rows] = await pool.query(
    `SELECT id_credito, monto_aprobado, tasa_interes, plazo,
            cuotas_totales, cuotas_pagadas, saldo_pendiente, fecha_aprobacion
     FROM credito WHERE id_solicitud = ?`,
    [solicitud_id]
  );
  return rows;
};

const getLog = async (solicitud_id) => {
  const [rows] = await pool.query(
    `SELECT id_log, id_solicitud, estado_anterior, estado_nuevo, fecha_cambio, usuario_responsable
     FROM estado_solicitud_log WHERE id_solicitud = ? ORDER BY fecha_cambio DESC`,
    [solicitud_id]
  );
  return rows;
};

const getByUsuario = async (usuario_id) => {
  const [rows] = await pool.query(
    `SELECT id_solicitud, monto, fecha, estado, id_banco
     FROM solicitud WHERE id_usuario = ? ORDER BY fecha DESC`,
    [usuario_id]
  );
  return rows;
};

const findUsuarioByCorreo = async (correo) => {
  const [rows] = await pool.query('SELECT id_usuario FROM usuario WHERE correo = ?', [correo]);
  return rows[0];
};

const findEstado = async (id) => {
  const [rows] = await pool.query('SELECT id_solicitud, id_usuario, monto, estado, id_banco FROM solicitud WHERE id_solicitud = ?', [id]);
  return rows[0];
};

const create = async ({ id_usuario, monto }) => {
  const [result] = await pool.query(
    'INSERT INTO solicitud (id_usuario, monto) VALUES (?, ?)',
    [id_usuario, monto]
  );
  return result.insertId;
};

const insertNotificacion = async ({ id_usuario, tipo, mensaje }) => {
  await pool.query(
    'INSERT INTO notificacion (id_usuario, tipo, mensaje) VALUES (?, ?, ?)',
    [id_usuario, tipo, mensaje]
  );
};

const insertLog = async ({ solicitud_id, estado_anterior, estado_nuevo, usuario_responsable = 'sistema' }) => {
  await pool.query(
    `INSERT INTO estado_solicitud_log (id_solicitud, estado_anterior, estado_nuevo, usuario_responsable)
     VALUES (?, ?, ?, ?)`,
    [solicitud_id, estado_anterior, estado_nuevo, usuario_responsable]
  );
};

const updateEstado = async (id, estado) => {
  const [result] = await pool.query('UPDATE solicitud SET estado = ? WHERE id_solicitud = ?', [estado, id]);
  return result.affectedRows;
};

const updateAprobada = async (id, monto_aprobado, tasa_interes, plazo, id_banco) => {
  const [result] = await pool.query(
    `UPDATE solicitud SET estado = 'aprobado', id_banco = COALESCE(?, id_banco)
     WHERE id_solicitud = ?`,
    [id_banco ?? null, id]
  );
  return result.affectedRows;
};

const createCredito = async ({ solicitud_id, monto_aprobado, tasa_interes, plazo, cuotas_totales }) => {
  const [result] = await pool.query(
    `INSERT INTO credito (id_solicitud, monto_aprobado, tasa_interes, plazo, cuotas_totales, saldo_pendiente)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [solicitud_id, monto_aprobado, tasa_interes, plazo, cuotas_totales, monto_aprobado]
  );
  return result.insertId;
};

const marcarBancoRespuesta = async (id_banco, respuesta, observaciones = null) => {
  if (respuesta === 'rechazado') {
    await pool.query(
      `UPDATE entidad_bancaria SET respuesta = 'rechazado', fecha_respuesta = CURRENT_TIMESTAMP, observaciones = COALESCE(?, observaciones)
       WHERE id_banco = ?`,
      [observaciones, id_banco]
    );
  } else {
    await pool.query(
      `UPDATE entidad_bancaria SET respuesta = 'aprobado', fecha_respuesta = CURRENT_TIMESTAMP WHERE id_banco = ?`,
      [id_banco]
    );
  }
};

module.exports = {
  getAll, getById, getCreditosBySolicitud, getLog, getByUsuario,
  findUsuarioByCorreo, findEstado, create, insertNotificacion, insertLog,
  updateEstado, updateAprobada, createCredito, marcarBancoRespuesta,
};