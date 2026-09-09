/**
 * Model CRÉDITOS + PAGOS (tablas `credito`, `pago`, `metodo_pago`)
 * Mismo patrón: ? placeholders, devuelve datos.
 */
const pool = require('../db');

// ---------- CRÉDITOS ----------

const getAll = async () => {
  const [rows] = await pool.query(
    `SELECT c.id_credito, c.monto_aprobado, c.tasa_interes, c.plazo,
            c.cuotas_totales, c.cuotas_pagadas, c.saldo_pendiente, c.fecha_aprobacion,
            u.nombre, u.correo, s.id_solicitud, u.id_usuario
     FROM credito c
     JOIN solicitud s ON c.id_solicitud = s.id_solicitud
     JOIN usuario u ON s.id_usuario = u.id_usuario
     ORDER BY c.fecha_aprobacion DESC`
  );
  return rows;
};

const getById = async (credito_id) => {
  const [rows] = await pool.query(
    `SELECT c.id_credito, c.id_solicitud, c.monto_aprobado, c.tasa_interes, c.plazo,
            c.cuotas_totales, c.cuotas_pagadas, c.saldo_pendiente, c.fecha_aprobacion,
            u.id_usuario, u.nombre, u.correo
     FROM credito c
     JOIN solicitud s ON c.id_solicitud = s.id_solicitud
     JOIN usuario u ON s.id_usuario = u.id_usuario
     WHERE c.id_credito = ?`,
    [credito_id]
  );
  return rows[0];
};

const getByUsuario = async (usuario_id, activo) => {
  const whereActivo = activo === 1 ? ' AND c.saldo_pendiente > 0' : '';
  const [rows] = await pool.query(
    `SELECT c.id_credito, c.monto_aprobado, c.tasa_interes, c.plazo,
            c.cuotas_totales, c.cuotas_pagadas, c.saldo_pendiente, c.fecha_aprobacion
     FROM credito c
     JOIN solicitud s ON c.id_solicitud = s.id_solicitud
     WHERE s.id_usuario = ?${whereActivo}
     ORDER BY c.fecha_aprobacion DESC`,
    [usuario_id]
  );
  return rows;
};

const getPagos = async (credito_id) => {
  const [rows] = await pool.query(
    `SELECT p.id_pago, p.monto_pago, p.fecha_pago, m.nombre_metodo
     FROM pago p LEFT JOIN metodo_pago m ON p.id_metodo = m.id_metodo
     WHERE p.id_credito = ? ORDER BY p.fecha_pago DESC`,
    [credito_id]
  );
  return rows;
};

const getAllPagos = async () => {
  const [rows] = await pool.query(
    `SELECT p.id_pago, p.id_credito, p.monto_pago, p.fecha_pago,
            m.nombre_metodo, u.nombre, u.correo
     FROM pago p
     LEFT JOIN metodo_pago m ON p.id_metodo = m.id_metodo
     JOIN credito c ON p.id_credito = c.id_credito
     JOIN solicitud s ON c.id_solicitud = s.id_solicitud
     JOIN usuario u ON s.id_usuario = u.id_usuario
     ORDER BY p.fecha_pago DESC`
  );
  return rows;
};

const findEstadoSolicitud = async (id_solicitud) => {
  const [rows] = await pool.query('SELECT id_solicitud, estado FROM solicitud WHERE id_solicitud = ?', [id_solicitud]);
  return rows[0];
};

const findById = async (credito_id) => {
  const [rows] = await pool.query('SELECT id_credito FROM credito WHERE id_credito = ?', [credito_id]);
  return rows[0];
};

const create = async ({ id_solicitud, monto_aprobado, tasa_interes, plazo, cuotas_totales }) => {
  const [result] = await pool.query(
    `INSERT INTO credito (id_solicitud, monto_aprobado, tasa_interes, plazo, cuotas_totales, saldo_pendiente)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [id_solicitud, monto_aprobado, tasa_interes, plazo, cuotas_totales, monto_aprobado]
  );
  return result.insertId;
};

const update = async (credito_id, { monto_aprobado, tasa_interes, plazo, cuotas_totales, cuotas_pagadas, saldo_pendiente }) => {
  const fields = [];
  const values = [];
  if (monto_aprobado !== undefined) { fields.push('monto_aprobado = ?'); values.push(monto_aprobado); }
  if (tasa_interes !== undefined) { fields.push('tasa_interes = ?'); values.push(tasa_interes); }
  if (plazo !== undefined) { fields.push('plazo = ?'); values.push(plazo); }
  if (cuotas_totales !== undefined) { fields.push('cuotas_totales = ?'); values.push(cuotas_totales); }
  if (cuotas_pagadas !== undefined) { fields.push('cuotas_pagadas = ?'); values.push(cuotas_pagadas); }
  if (saldo_pendiente !== undefined) { fields.push('saldo_pendiente = ?'); values.push(saldo_pendiente); }
  if (fields.length === 0) return 0;
  values.push(credito_id);
  const [result] = await pool.query(
    `UPDATE credito SET ${fields.join(', ')} WHERE id_credito = ?`,
    values
  );
  return result.affectedRows;
};

const remove = async (credito_id) => {
  const [result] = await pool.query('DELETE FROM credito WHERE id_credito = ?', [credito_id]);
  return result.affectedRows;
};

const setSolicitudAprobada = async (id_solicitud, estado_anterior) => {
  await pool.query(`UPDATE solicitud SET estado = 'aprobado' WHERE id_solicitud = ?`, [id_solicitud]);
};

// ---------- PAGOS ----------

const findCreditoActivoByCorreo = async (correo) => {
  const [rows] = await pool.query(
    `SELECT u.id_usuario, c.id_credito, c.saldo_pendiente
     FROM credito c
     JOIN solicitud s ON c.id_solicitud = s.id_solicitud
     JOIN usuario u ON s.id_usuario = u.id_usuario
     WHERE u.correo = ? AND c.saldo_pendiente > 0 LIMIT 1`,
    [correo]
  );
  return rows[0];
};

const registrarPago = async ({ id_credito, id_metodo, monto }) => {
  const [result] = await pool.query(
    'INSERT INTO pago (id_credito, id_metodo, monto_pago) VALUES (?, ?, ?)',
    [id_credito, id_metodo ?? null, monto]
  );
  return result.insertId;
};

const aplicarPagoCredito = async ({ id_credito, nuevo_saldo }) => {
  await pool.query(
    'UPDATE credito SET saldo_pendiente = ?, cuotas_pagadas = cuotas_pagadas + 1 WHERE id_credito = ?',
    [Math.max(nuevo_saldo, 0), id_credito]
  );
};

const desactivarUsuario = async (id_usuario) => {
  await pool.query('UPDATE usuario SET activo = 0 WHERE id_usuario = ?', [id_usuario]);
};

module.exports = {
  getAll, getById, getByUsuario, getPagos, getAllPagos,
  findEstadoSolicitud, findById, create, update, remove, setSolicitudAprobada,
  findCreditoActivoByCorreo, registrarPago, aplicarPagoCredito, desactivarUsuario,
};