/**
 * Model NOTIFICACIONES (tabla `notificacion`)
 * Mismo patrón: ? placeholders, devuelve datos.
 */
const pool = require('../db');

const getByUsuario = async (usuario_id) => {
  const [rows] = await pool.query(
    `SELECT id_notificacion, tipo, mensaje, leida, fecha_envio
     FROM notificacion WHERE id_usuario = ? ORDER BY fecha_envio DESC`,
    [usuario_id]
  );
  return rows;
};

const setLeida = async (notificacion_id, leida) => {
  const [result] = await pool.query(
    'UPDATE notificacion SET leida = ? WHERE id_notificacion = ?',
    [leida, notificacion_id]
  );
  return result.affectedRows;
};

module.exports = { getByUsuario, setLeida };