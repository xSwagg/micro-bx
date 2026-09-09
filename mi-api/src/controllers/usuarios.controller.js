/**
 * ==============================================
 * MÓDULO 1 — USUARIOS, PERFIL Y AUTENTICACIÓN
 * Endpoints:
 *  - POST   /api/registro
 *  - POST   /api/login
 *  - GET    /api/perfil/:usuario_id
 *  - PUT    /api/perfil/:usuario_id
 *  - PUT    /api/perfil/:usuario_id/password
 *  - GET    /api/admin/usuarios
 *  - PUT    /api/admin/usuarios/:usuario_id/rol   (?rol=)
 *  - PUT    /api/admin/usuarios/:usuario_id
 *  - DELETE /api/admin/usuarios/:usuario_id
 * ==============================================
 */
const bcrypt = require('bcryptjs');
const Usuario = require('../models/usuarios.model');

const ROLES = ['cliente', 'asesor', 'administrador'];

// POST /api/registro
const registro = async (req, res) => {
  try {
    const { nombre, apellido = '', cedula, correo, contrasena = '123456', telefono = '' } = req.body || {};

    if (!nombre || !cedula || !correo) {
      return res.status(400).json({ ok: false, msg: 'nombre, cedula y correo son requeridos' });
    }

    const existe = await Usuario.findByCorreoOCedula({ correo, cedula });
    if (existe) {
      return res.status(400).json({ ok: false, msg: 'El correo o cédula ya están registrados' });
    }

    const hash = bcrypt.hashSync(contrasena, 10);

    const nuevo = await Usuario.create({ nombre, apellido, cedula, correo, hash, telefono });
    await Usuario.createPerfil(nuevo.id);

    res.status(201).json({ ok: true, msg: 'Usuario registrado exitosamente', id: nuevo.id });
  } catch (err) {
    res.status(500).json({ ok: false, msg: 'Error de conexión', error: err.message });
  }
};

// POST /api/login
const login = async (req, res) => {
  try {
    const { correo, contrasena } = req.body || {};
    if (!correo || !contrasena) {
      return res.status(400).json({ ok: false, msg: 'correo y contrasena son requeridos' });
    }

    const u = await Usuario.findLogin(correo);
    if (!u) {
      return res.status(401).json({ ok: false, msg: 'Credenciales incorrectas' });
    }

    if (!u.activo) {
      return res.status(403).json({ ok: false, msg: 'Usuario desactivado' });
    }

    if (!bcrypt.compareSync(contrasena, u.contrasena)) {
      return res.status(401).json({ ok: false, msg: 'Credenciales incorrectas' });
    }

    res.json({
      ok: true,
      data: {
        id: u.id_usuario,
        nombre: u.nombre,
        apellido: u.apellido,
        correo: u.correo,
        telefono: u.telefono,
        rol: u.rol,
        nivel: u.nivel,
      },
    });
  } catch (err) {
    res.status(500).json({ ok: false, msg: 'Error de conexión', error: err.message });
  }
};

// GET /api/perfil/:usuario_id
const getPerfil = async (req, res) => {
  try {
    const { usuario_id } = req.params;

    const perfil = await Usuario.getPerfil(usuario_id);
    if (!perfil) {
      return res.status(404).json({ ok: false, msg: 'Usuario no encontrado' });
    }

    const [solicitudes, creditos, notificaciones] = await Promise.all([
      Usuario.getSolicitudesByUsuario(usuario_id),
      Usuario.getCreditosByUsuario(usuario_id),
      Usuario.getNotificacionesByUsuario(usuario_id),
    ]);

    res.json({ ok: true, data: { ...perfil, solicitudes, creditos, notificaciones } });
  } catch (err) {
    res.status(500).json({ ok: false, msg: 'Error de conexión', error: err.message });
  }
};

// PUT /api/perfil/:usuario_id
const updatePerfil = async (req, res) => {
  try {
    const { usuario_id } = req.params;
    const { nombre, apellido, telefono, nivel, foto } = req.body || {};

    await Usuario.updateUsuario(usuario_id, { nombre, apellido, telefono });
    await Usuario.updatePerfil(usuario_id, { nivel, foto });

    res.json({ ok: true, msg: 'Perfil actualizado correctamente' });
  } catch (err) {
    res.status(500).json({ ok: false, msg: 'Error de conexión', error: err.message });
  }
};

// PUT /api/perfil/:usuario_id/password
const updatePassword = async (req, res) => {
  try {
    const { usuario_id } = req.params;
    const { contrasena_actual, contrasena_nueva } = req.body || {};

    if (!contrasena_actual || !contrasena_nueva) {
      return res.status(400).json({ ok: false, msg: 'contrasena_actual y contrasena_nueva son requeridos' });
    }

    const row = await Usuario.getPassword(usuario_id);
    if (!row) {
      return res.status(404).json({ ok: false, msg: 'Usuario no encontrado' });
    }

    if (!bcrypt.compareSync(contrasena_actual, row.contrasena)) {
      return res.status(401).json({ ok: false, msg: 'Contraseña actual incorrecta' });
    }

    const hash = bcrypt.hashSync(contrasena_nueva, 10);
    await Usuario.updatePassword(usuario_id, hash);

    res.json({ ok: true, msg: 'Contraseña actualizada correctamente' });
  } catch (err) {
    res.status(500).json({ ok: false, msg: 'Error de conexión', error: err.message });
  }
};

// GET /api/admin/usuarios
const getAllUsuarios = async (req, res) => {
  try {
    const rows = await Usuario.getAll();
    res.json({ ok: true, data: rows });
  } catch (err) {
    res.status(500).json({ ok: false, msg: 'Error de conexión', error: err.message });
  }
};

// PUT /api/admin/usuarios/:usuario_id/rol?rol=
const updateRol = async (req, res) => {
  try {
    const { usuario_id } = req.params;
    const { rol } = req.query;

    if (!ROLES.includes(rol)) {
      return res.status(400).json({ ok: false, msg: 'Rol inválido' });
    }

    const existe = await Usuario.findById(usuario_id);
    if (!existe) {
      return res.status(404).json({ ok: false, msg: 'Usuario no encontrado' });
    }

    await Usuario.updatePerfil(usuario_id, { rol });
    res.json({ ok: true, msg: 'Rol actualizado' });
  } catch (err) {
    res.status(500).json({ ok: false, msg: 'Error de conexión', error: err.message });
  }
};

// PUT /api/admin/usuarios/:usuario_id
const updateUsuarioAdmin = async (req, res) => {
  try {
    const { usuario_id } = req.params;
    const { nombre, apellido, cedula, correo, telefono, rol, nivel, activo } = req.body || {};

    const existe = await Usuario.findById(usuario_id);
    if (!existe) {
      return res.status(404).json({ ok: false, msg: 'Usuario no encontrado' });
    }

    if (cedula !== undefined) {
      const duplicado = await Usuario.findByCedulaOtro(cedula, usuario_id);
      if (duplicado) {
        return res.status(400).json({ ok: false, msg: 'Cédula ya registrada' });
      }
      await Usuario.updateCedula(usuario_id, cedula);
    }

    if (correo !== undefined) {
      const duplicado = await Usuario.findByCorreoOtro(correo, usuario_id);
      if (duplicado) {
        return res.status(400).json({ ok: false, msg: 'Correo ya registrado' });
      }
      await Usuario.updateCorreo(usuario_id, correo);
    }

    await Usuario.updateUsuario(usuario_id, { nombre, apellido, telefono });
    await Usuario.updatePerfil(usuario_id, { rol, nivel });
    if (activo !== undefined) {
      await Usuario.updateActivo(usuario_id, activo);
    }

    res.json({ ok: true, msg: 'Usuario actualizado exitosamente' });
  } catch (err) {
    res.status(500).json({ ok: false, msg: 'Error de conexión', error: err.message });
  }
};

// DELETE /api/admin/usuarios/:usuario_id  (desactiva)
const deleteUsuario = async (req, res) => {
  try {
    const { usuario_id } = req.params;
    await Usuario.deactivate(usuario_id);
    res.json({ ok: true, msg: 'Usuario desactivado' });
  } catch (err) {
    res.status(500).json({ ok: false, msg: 'Error de conexión', error: err.message });
  }
};

module.exports = {
  registro, login, getPerfil, updatePerfil, updatePassword,
  getAllUsuarios, updateRol, updateUsuarioAdmin, deleteUsuario,
};