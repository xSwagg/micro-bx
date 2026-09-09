/**
 * Model ENTIDADES BANCARIAS (tabla `entidad_bancaria`)
 * Mismo patrón: ? placeholders, devuelve datos.
 */
const pool = require('../db');

const getAll = async () => {
  const [rows] = await pool.query(
    `SELECT id_banco, nombre_banco, respuesta, fecha_respuesta, observaciones
     FROM entidad_bancaria ORDER BY nombre_banco`
  );
  return rows;
};

const getById = async (banco_id) => {
  const [rows] = await pool.query(
    `SELECT id_banco, nombre_banco, respuesta, fecha_respuesta, observaciones
     FROM entidad_bancaria WHERE id_banco = ?`,
    [banco_id]
  );
  return rows[0];
};

const create = async ({ nombre_banco, respuesta = 'pendiente', observaciones = '' }) => {
  const [result] = await pool.query(
    'INSERT INTO entidad_bancaria (nombre_banco, respuesta, observaciones) VALUES (?, ?, ?)',
    [nombre_banco, respuesta, observaciones]
  );
  return result.insertId;
};

const update = async (banco_id, { nombre_banco, respuesta, observaciones }) => {
  const fields = [];
  const values = [];
  if (nombre_banco !== undefined) { fields.push('nombre_banco = ?'); values.push(nombre_banco); }
  if (respuesta !== undefined) {
    fields.push("respuesta = ?, fecha_respuesta = CASE WHEN ? = 'pendiente' THEN NULL ELSE CURRENT_TIMESTAMP END");
    values.push(respuesta, respuesta);
  }
  if (observaciones !== undefined) { fields.push('observaciones = ?'); values.push(observaciones); }
  if (fields.length === 0) return 0;
  values.push(banco_id);
  const [result] = await pool.query(
    `UPDATE entidad_bancaria SET ${fields.join(', ')} WHERE id_banco = ?`,
    values
  );
  return result.affectedRows;
};

const remove = async (banco_id) => {
  const [result] = await pool.query('DELETE FROM entidad_bancaria WHERE id_banco = ?', [banco_id]);
  return result.affectedRows;
};

module.exports = { getAll, getById, create, update, remove };