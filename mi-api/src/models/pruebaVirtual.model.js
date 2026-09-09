/**
 * Model PRUEBA VIRTUAL (tabla `prueba_virtual`)
 * Mismo patrón: ? placeholders, devuelve datos.
 */
const pool = require('../db');

const findUsuario = async (id_usuario) => {
  const [rows] = await pool.query('SELECT id_usuario FROM usuario WHERE id_usuario = ?', [id_usuario]);
  return rows[0];
};

const create = async ({ id_usuario, puntaje, aprobada }) => {
  const [result] = await pool.query(
    'INSERT INTO prueba_virtual (id_usuario, puntaje, aprobada) VALUES (?, ?, ?)',
    [id_usuario, puntaje, aprobada]
  );
  return result.insertId;
};

const setCompletada = async (id_usuario, aprobada) => {
  await pool.query(
    'UPDATE usuario SET prueba_virtual_completada = ? WHERE id_usuario = ?',
    [aprobada ? 1 : 0, id_usuario]
  );
};

const getByUsuario = async (usuario_id) => {
  const [rows] = await pool.query(
    `SELECT id_prueba, fecha_completada, puntaje, aprobada
     FROM prueba_virtual WHERE id_usuario = ? ORDER BY fecha_completada DESC`,
    [usuario_id]
  );
  return rows;
};

module.exports = { findUsuario, create, setCompletada, getByUsuario };