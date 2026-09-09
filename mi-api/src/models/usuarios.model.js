/**
 * Model USUARIOS + PERFIL (tablas `usuario` y `perfil`)
 * Mismo patrón que mi-api (Pal' Monte): ? placeholders, devuelve datos.
 */
const pool = require('../db');

// ? = placeholder seguro (evita SQL Injection)

const findByCorreoOCedula = async ({ correo, cedula }) => {
  const [rows] = await pool.query(
    'SELECT id_usuario FROM usuario WHERE correo = ? OR cedula = ?',
    [correo, cedula]
  );
  return rows[0];
};

const findByCorreo = async (correo) => {
  const [rows] = await pool.query(
    'SELECT id_usuario FROM usuario WHERE correo = ?',
    [correo]
  );
  return rows[0];
};

const findLogin = async (correo) => {
  const [rows] = await pool.query(
    `SELECT u.id_usuario, u.nombre, u.apellido, u.correo, u.contrasena, u.telefono, u.activo,
            p.rol, p.nivel
     FROM usuario u JOIN perfil p ON u.id_usuario = p.id_usuario
     WHERE u.correo = ?`,
    [correo]
  );
  return rows[0];
};

const create = async ({ nombre, apellido, cedula, correo, hash, telefono }) => {
  const [result] = await pool.query(
    `INSERT INTO usuario (nombre, apellido, cedula, correo, contrasena, telefono)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [nombre, apellido || '', cedula, correo, hash, telefono || '']
  );
  return { id: result.insertId, nombre, correo };
};

const createPerfil = async (user_id) => {
  await pool.query('INSERT INTO perfil (id_usuario) VALUES (?)', [user_id]);
  return { id_usuario: user_id };
};

const getPerfil = async (usuario_id) => {
  const [rows] = await pool.query(
    `SELECT u.id_usuario, u.nombre, u.apellido, u.correo, u.telefono, u.cedula,
            u.fecha_registro, u.prueba_virtual_completada, u.activo,
            p.foto, p.nivel, p.rol
     FROM usuario u JOIN perfil p ON u.id_usuario = p.id_usuario
     WHERE u.id_usuario = ?`,
    [usuario_id]
  );
  return rows[0];
};

const getSolicitudesByUsuario = async (usuario_id) => {
  const [rows] = await pool.query(
    `SELECT id_solicitud, monto, fecha, estado
     FROM solicitud WHERE id_usuario = ? ORDER BY fecha DESC`,
    [usuario_id]
  );
  return rows;
};

const getCreditosByUsuario = async (usuario_id) => {
  const [rows] = await pool.query(
    `SELECT c.id_credito, c.monto_aprobado, c.saldo_pendiente,
            c.cuotas_totales, c.cuotas_pagadas, c.tasa_interes, c.fecha_aprobacion
     FROM credito c JOIN solicitud s ON c.id_solicitud = s.id_solicitud
     WHERE s.id_usuario = ? ORDER BY c.fecha_aprobacion DESC`,
    [usuario_id]
  );
  return rows;
};

const getNotificacionesByUsuario = async (usuario_id) => {
  const [rows] = await pool.query(
    `SELECT id_notificacion, tipo, mensaje, leida, fecha_envio
     FROM notificacion WHERE id_usuario = ? ORDER BY fecha_envio DESC`,
    [usuario_id]
  );
  return rows;
};

const getAll = async () => {
  const [rows] = await pool.query(
    `SELECT u.id_usuario, u.nombre, u.apellido, u.correo, u.cedula, u.telefono,
            u.fecha_registro, u.activo, u.prueba_virtual_completada,
            p.rol, p.nivel
     FROM usuario u JOIN perfil p ON u.id_usuario = p.id_usuario
     ORDER BY u.nombre`
  );
  return rows;
};

const updateUsuario = async (id, { nombre, apellido, telefono }) => {
  const fields = [];
  const values = [];
  if (nombre !== undefined) { fields.push('nombre = ?'); values.push(nombre); }
  if (apellido !== undefined) { fields.push('apellido = ?'); values.push(apellido); }
  if (telefono !== undefined) { fields.push('telefono = ?'); values.push(telefono); }
  if (fields.length === 0) return 0;
  values.push(id);
  const [result] = await pool.query(
    `UPDATE usuario SET ${fields.join(', ')} WHERE id_usuario = ?`,
    values
  );
  return result.affectedRows;
};

const updateCedula = async (id, cedula) => {
  const [result] = await pool.query('UPDATE usuario SET cedula = ? WHERE id_usuario = ?', [cedula, id]);
  return result.affectedRows;
};

const updateCorreo = async (id, correo) => {
  const [result] = await pool.query('UPDATE usuario SET correo = ? WHERE id_usuario = ?', [correo, id]);
  return result.affectedRows;
};

const updatePerfil = async (id, { nivel, foto, rol, activo }) => {
  const [result] = await pool.query(
    `UPDATE perfil SET
       nivel = COALESCE(?, nivel),
       foto  = COALESCE(?, foto),
       rol   = COALESCE(?, rol)
     WHERE id_usuario = ?`,
    [nivel ?? null, foto ?? null, rol ?? null, id]
  );
  return result.affectedRows;
};

const updateActivo = async (id, activo) => {
  const [result] = await pool.query('UPDATE usuario SET activo = ? WHERE id_usuario = ?', [activo, id]);
  return result.affectedRows;
};

const findByCedulaOtro = async (cedula, id) => {
  const [rows] = await pool.query(
    'SELECT id_usuario FROM usuario WHERE cedula = ? AND id_usuario != ?',
    [cedula, id]
  );
  return rows[0];
};

const findByCorreoOtro = async (correo, id) => {
  const [rows] = await pool.query(
    'SELECT id_usuario FROM usuario WHERE correo = ? AND id_usuario != ?',
    [correo, id]
  );
  return rows[0];
};

const findById = async (id) => {
  const [rows] = await pool.query('SELECT id_usuario FROM usuario WHERE id_usuario = ?', [id]);
  return rows[0];
};

const getPassword = async (id) => {
  const [rows] = await pool.query('SELECT contrasena FROM usuario WHERE id_usuario = ?', [id]);
  return rows[0];
};

const updatePassword = async (id, hash) => {
  const [result] = await pool.query('UPDATE usuario SET contrasena = ? WHERE id_usuario = ?', [hash, id]);
  return result.affectedRows;
};

const deactivate = async (id) => {
  const [result] = await pool.query('UPDATE usuario SET activo = 0 WHERE id_usuario = ?', [id]);
  return result.affectedRows;
};

module.exports = {
  findByCorreoOCedula, findByCorreo, findLogin, create, createPerfil,
  getPerfil, getSolicitudesByUsuario, getCreditosByUsuario, getNotificacionesByUsuario,
  getAll, updateUsuario, updateCedula, updateCorreo, updatePerfil, updateActivo,
  findByCedulaOtro, findByCorreoOtro, findById, getPassword, updatePassword, deactivate,
};