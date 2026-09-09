from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional, List
import bcrypt
import mysql.connector
from database import get_db_connection
from models import *

app = FastAPI(
    title="MicrocreditosBX API",
    description="API para gestión de microcréditos (solicitudes, créditos, pagos, entidades bancarias)",
    version="2.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==============================================
# CREAR BASE DE DATOS Y TABLAS (AUTOMÁTICO)
# ==============================================

def init_database():
    try:
        conn = mysql.connector.connect(
            host="localhost",
            user="root",
            password=""
        )
        cursor = conn.cursor()

        cursor.execute("CREATE DATABASE IF NOT EXISTS micropsev2")
        print("[OK] Base de datos 'micropsev2' creada/verificada")

        cursor.execute("USE micropsev2")

        # ==========================================
        # TABLA: usuario
        # ==========================================
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS usuario (
                id_usuario INT NOT NULL AUTO_INCREMENT,
                nombre VARCHAR(100) NOT NULL,
                apellido VARCHAR(100) NOT NULL,
                cedula VARCHAR(20) NOT NULL,
                correo VARCHAR(100) NOT NULL UNIQUE,
                contrasena VARCHAR(255) NOT NULL,
                telefono VARCHAR(20) NULL,
                prueba_virtual_completada TINYINT(1) NOT NULL DEFAULT 0,
                fecha_registro DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                activo TINYINT(1) NOT NULL DEFAULT 1,
                PRIMARY KEY (id_usuario),
                UNIQUE INDEX idx_usuario_cedula (cedula)
            ) ENGINE = InnoDB
        """)
        print("[OK] Tabla 'usuario' creada/verificada")

        # ==========================================
        # TABLA: perfil (rol, nivel, foto)
        # ==========================================
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS perfil (
                id_usuario INT NOT NULL,
                foto VARCHAR(255) NULL DEFAULT 'default_avatar.png',
                nivel VARCHAR(30) NULL DEFAULT 'basico',
                rol ENUM('cliente', 'asesor', 'administrador') NOT NULL DEFAULT 'cliente',
                PRIMARY KEY (id_usuario),
                CONSTRAINT fk_perfil_usuario
                    FOREIGN KEY (id_usuario) REFERENCES usuario (id_usuario) ON DELETE CASCADE
            ) ENGINE = InnoDB
        """)
        print("[OK] Tabla 'perfil' creada/verificada")

        # ==========================================
        # TABLA: entidad_bancaria
        # ==========================================
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS entidad_bancaria (
                id_banco INT NOT NULL AUTO_INCREMENT,
                nombre_banco VARCHAR(100) NOT NULL,
                respuesta ENUM('aprobado', 'rechazado', 'pendiente') NOT NULL DEFAULT 'pendiente',
                fecha_respuesta DATETIME NULL,
                observaciones TEXT NULL,
                PRIMARY KEY (id_banco)
            ) ENGINE = InnoDB
        """)
        print("[OK] Tabla 'entidad_bancaria' creada/verificada")

        # ==========================================
        # TABLA: solicitud
        # ==========================================
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS solicitud (
                id_solicitud INT NOT NULL AUTO_INCREMENT,
                id_usuario INT NOT NULL,
                id_banco INT NULL,
                monto DECIMAL(12,2) NOT NULL,
                fecha DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                estado ENUM('pendiente', 'en_revision', 'aprobado', 'rechazado') NOT NULL DEFAULT 'pendiente',
                PRIMARY KEY (id_solicitud),
                INDEX idx_solicitud_estado (estado),
                CONSTRAINT fk_sol_usuario FOREIGN KEY (id_usuario) REFERENCES usuario (id_usuario) ON DELETE CASCADE,
                CONSTRAINT fk_sol_banco FOREIGN KEY (id_banco) REFERENCES entidad_bancaria (id_banco) ON DELETE SET NULL
            ) ENGINE = InnoDB
        """)
        print("[OK] Tabla 'solicitud' creada/verificada")

        # ==========================================
        # TABLA: credito
        # ==========================================
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS credito (
                id_credito INT NOT NULL AUTO_INCREMENT,
                id_solicitud INT NOT NULL,
                monto_aprobado DECIMAL(12,2) NOT NULL,
                tasa_interes DECIMAL(5,2) NOT NULL,
                plazo INT NOT NULL COMMENT 'Plazo en meses',
                cuotas_totales INT NOT NULL DEFAULT 0,
                cuotas_pagadas INT NOT NULL DEFAULT 0,
                saldo_pendiente DECIMAL(12,2) NOT NULL,
                fecha_aprobacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (id_credito),
                INDEX idx_credito_saldo (saldo_pendiente),
                CONSTRAINT fk_cred_solicitud FOREIGN KEY (id_solicitud) REFERENCES solicitud (id_solicitud) ON DELETE CASCADE
            ) ENGINE = InnoDB
        """)
        print("[OK] Tabla 'credito' creada/verificada")

        # ==========================================
        # TABLA: metodo_pago (antes de pago por la FK)
        # ==========================================
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS metodo_pago (
                id_metodo INT NOT NULL AUTO_INCREMENT,
                nombre_metodo VARCHAR(50) NOT NULL,
                PRIMARY KEY (id_metodo)
            ) ENGINE = InnoDB
        """)

        # ==========================================
        # TABLA: pago
        # ==========================================
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS pago (
                id_pago INT NOT NULL AUTO_INCREMENT,
                id_credito INT NOT NULL,
                id_metodo INT NULL,
                monto_pago DECIMAL(12,2) NOT NULL,
                fecha_pago DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (id_pago),
                CONSTRAINT fk_pago_credito FOREIGN KEY (id_credito) REFERENCES credito (id_credito) ON DELETE CASCADE,
                CONSTRAINT fk_pago_metodo FOREIGN KEY (id_metodo) REFERENCES metodo_pago (id_metodo) ON DELETE SET NULL
            ) ENGINE = InnoDB
        """)
        print("[OK] Tablas 'pago' y 'metodo_pago' creadas/verificadas")

        # ==========================================
        # TABLA: notificacion
        # ==========================================
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS notificacion (
                id_notificacion INT NOT NULL AUTO_INCREMENT,
                id_usuario INT NOT NULL,
                tipo VARCHAR(50) NOT NULL,
                mensaje TEXT NOT NULL,
                leida TINYINT(1) NOT NULL DEFAULT 0,
                fecha_envio DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (id_notificacion),
                INDEX idx_notificacion_usuario (id_usuario, leida),
                CONSTRAINT fk_notif_usuario FOREIGN KEY (id_usuario) REFERENCES usuario (id_usuario) ON DELETE CASCADE
            ) ENGINE = InnoDB
        """)
        print("[OK] Tabla 'notificacion' creada/verificada")

        # ==========================================
        # TABLA: estado_solicitud_log
        # ==========================================
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS estado_solicitud_log (
                id_log INT NOT NULL AUTO_INCREMENT,
                id_solicitud INT NOT NULL,
                estado_anterior VARCHAR(20) NOT NULL,
                estado_nuevo VARCHAR(20) NOT NULL,
                fecha_cambio DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                usuario_responsable VARCHAR(100) NOT NULL,
                PRIMARY KEY (id_log),
                CONSTRAINT fk_log_solicitud FOREIGN KEY (id_solicitud) REFERENCES solicitud (id_solicitud) ON DELETE CASCADE
            ) ENGINE = InnoDB
        """)
        print("[OK] Tabla 'estado_solicitud_log' creada/verificada")

        # ==========================================
        # TABLA: prueba_virtual
        # ==========================================
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS prueba_virtual (
                id_prueba INT NOT NULL AUTO_INCREMENT,
                id_usuario INT NOT NULL,
                fecha_completada DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                puntaje DECIMAL(5,2) NOT NULL DEFAULT 0.00,
                aprobada TINYINT(1) NOT NULL DEFAULT 0,
                PRIMARY KEY (id_prueba),
                CONSTRAINT fk_prueba_usuario FOREIGN KEY (id_usuario) REFERENCES usuario (id_usuario) ON DELETE CASCADE
            ) ENGINE = InnoDB
        """)
        print("[OK] Tabla 'prueba_virtual' creada/verificada")

        # ==========================================
        # DATOS BASE: metodo_pago
        # ==========================================
        cursor.execute("SELECT COUNT(*) FROM metodo_pago")
        if cursor.fetchone()[0] == 0:
            cursor.executemany(
                "INSERT INTO metodo_pago (nombre_metodo) VALUES (%s)",
                [("PSE",), ("Nequi",), ("Daviplata",), ("Transferencia bancaria",), ("Efectivo",)]
            )
            print("[OK] metodo_pago sembrado (5 métodos)")
        else:
            print("[OK] metodo_pago ya tiene datos, se omite el seed")

        conn.commit()
        cursor.close()
        conn.close()
        print("\n[OK] BASE DE DATOS COMPLETA CREADA/VERIFICADA!")

    except Exception as e:
        print(f"[ERROR] Error al inicializar la base de datos: {e}")


init_database()

# ==============================================
# AUTH (Autenticación)
# ==============================================

@app.post("/api/registro")
def registro(usuario: UsuarioRegistro):
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Error de conexión")

    cursor = conn.cursor(dictionary=True)

    cursor.execute("SELECT id_usuario FROM usuario WHERE correo = %s OR cedula = %s", (usuario.correo, usuario.cedula))
    if cursor.fetchone():
        cursor.close()
        conn.close()
        raise HTTPException(status_code=400, detail="El correo o cédula ya están registrados")

    hashed = bcrypt.hashpw(usuario.contrasena.encode('utf-8'), bcrypt.gensalt())

    cursor.execute("""
        INSERT INTO usuario (nombre, apellido, cedula, correo, contrasena, telefono)
        VALUES (%s, %s, %s, %s, %s, %s)
    """, (usuario.nombre, usuario.apellido, usuario.cedula, usuario.correo,
          hashed.decode('utf-8'), usuario.telefono))
    user_id = cursor.lastrowid

    cursor.execute("INSERT INTO perfil (id_usuario) VALUES (%s)", (user_id,))

    conn.commit()
    cursor.close()
    conn.close()

    return {"message": "Usuario registrado exitosamente", "id": user_id}


@app.post("/api/login")
def login(credenciales: UsuarioLogin):
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Error de conexión")

    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT u.id_usuario, u.nombre, u.apellido, u.correo, u.contrasena, u.telefono, u.activo,
               p.rol, p.nivel
        FROM usuario u
        JOIN perfil p ON u.id_usuario = p.id_usuario
        WHERE u.correo = %s
    """, (credenciales.correo,))

    usuario = cursor.fetchone()
    cursor.close()
    conn.close()

    if not usuario:
        raise HTTPException(status_code=401, detail="Credenciales incorrectas")

    if not usuario["activo"]:
        raise HTTPException(status_code=403, detail="Usuario desactivado")

    if not bcrypt.checkpw(credenciales.contrasena.encode('utf-8'), usuario["contrasena"].encode('utf-8')):
        raise HTTPException(status_code=401, detail="Credenciales incorrectas")

    return {
        "id": usuario["id_usuario"],
        "nombre": usuario["nombre"],
        "apellido": usuario["apellido"],
        "correo": usuario["correo"],
        "telefono": usuario["telefono"],
        "rol": usuario["rol"],
        "nivel": usuario["nivel"]
    }


# ==============================================
# PERFIL (COMPLETO)
# ==============================================

@app.get("/api/perfil/{usuario_id}")
def get_perfil(usuario_id: int):
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Error de conexión")

    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT u.id_usuario, u.nombre, u.apellido, u.correo, u.telefono, u.cedula,
               u.fecha_registro, u.prueba_virtual_completada, u.activo,
               p.foto, p.nivel, p.rol
        FROM usuario u
        JOIN perfil p ON u.id_usuario = p.id_usuario
        WHERE u.id_usuario = %s
    """, (usuario_id,))

    perfil = cursor.fetchone()

    if not perfil:
        cursor.close()
        conn.close()
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    cursor.execute("""
        SELECT id_solicitud, monto, fecha, estado
        FROM solicitud WHERE id_usuario = %s
        ORDER BY fecha DESC
    """, (usuario_id,))
    perfil["solicitudes"] = cursor.fetchall()

    cursor.execute("""
        SELECT c.id_credito, c.monto_aprobado, c.saldo_pendiente,
               c.cuotas_totales, c.cuotas_pagadas, c.tasa_interes, c.fecha_aprobacion
        FROM credito c
        JOIN solicitud s ON c.id_solicitud = s.id_solicitud
        WHERE s.id_usuario = %s
        ORDER BY c.fecha_aprobacion DESC
    """, (usuario_id,))
    perfil["creditos"] = cursor.fetchall()

    cursor.execute("""
        SELECT id_notificacion, tipo, mensaje, leida, fecha_envio
        FROM notificacion WHERE id_usuario = %s
        ORDER BY fecha_envio DESC
    """, (usuario_id,))
    perfil["notificaciones"] = cursor.fetchall()

    cursor.close()
    conn.close()

    return perfil


@app.put("/api/perfil/{usuario_id}")
def update_perfil(usuario_id: int, datos: PerfilUpdate):
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Error de conexión")

    cursor = conn.cursor()

    if datos.nombre is not None:
        cursor.execute("UPDATE usuario SET nombre = %s WHERE id_usuario = %s", (datos.nombre, usuario_id))
    if datos.apellido is not None:
        cursor.execute("UPDATE usuario SET apellido = %s WHERE id_usuario = %s", (datos.apellido, usuario_id))
    if datos.telefono is not None:
        cursor.execute("UPDATE usuario SET telefono = %s WHERE id_usuario = %s", (datos.telefono, usuario_id))
    if datos.nivel is not None:
        cursor.execute("UPDATE perfil SET nivel = %s WHERE id_usuario = %s", (datos.nivel, usuario_id))
    if datos.foto is not None:
        cursor.execute("UPDATE perfil SET foto = %s WHERE id_usuario = %s", (datos.foto, usuario_id))

    conn.commit()
    cursor.close()
    conn.close()

    return {"message": "Perfil actualizado correctamente"}


@app.put("/api/perfil/{usuario_id}/password")
def update_password(usuario_id: int, datos: PasswordUpdate):
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Error de conexión")

    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT contrasena FROM usuario WHERE id_usuario = %s", (usuario_id,))
    usuario = cursor.fetchone()

    if not usuario:
        cursor.close()
        conn.close()
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    if not bcrypt.checkpw(datos.contrasena_actual.encode('utf-8'), usuario["contrasena"].encode('utf-8')):
        cursor.close()
        conn.close()
        raise HTTPException(status_code=401, detail="Contraseña actual incorrecta")

    hashed = bcrypt.hashpw(datos.contrasena_nueva.encode('utf-8'), bcrypt.gensalt())
    cursor.execute("UPDATE usuario SET contrasena = %s WHERE id_usuario = %s",
                   (hashed.decode('utf-8'), usuario_id))

    conn.commit()
    cursor.close()
    conn.close()

    return {"message": "Contraseña actualizada correctamente"}


# ==============================================
# SOLICITUDES
# ==============================================

@app.get("/api/solicitudes")
def get_solicitudes(estado: Optional[str] = None):
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Error de conexión")

    cursor = conn.cursor(dictionary=True)

    if estado and estado != "todas":
        cursor.execute("""
            SELECT s.id_solicitud, s.monto, s.fecha, s.estado, s.id_banco,
                   u.nombre, u.apellido, u.correo, u.cedula,
                   b.nombre_banco
            FROM solicitud s
            JOIN usuario u ON s.id_usuario = u.id_usuario
            LEFT JOIN entidad_bancaria b ON s.id_banco = b.id_banco
            WHERE s.estado = %s
            ORDER BY s.fecha DESC
        """, (estado,))
    else:
        cursor.execute("""
            SELECT s.id_solicitud, s.monto, s.fecha, s.estado, s.id_banco,
                   u.nombre, u.apellido, u.correo, u.cedula,
                   b.nombre_banco
            FROM solicitud s
            JOIN usuario u ON s.id_usuario = u.id_usuario
            LEFT JOIN entidad_bancaria b ON s.id_banco = b.id_banco
            ORDER BY s.fecha DESC
        """)

    solicitudes = cursor.fetchall()
    cursor.close()
    conn.close()

    return solicitudes


@app.get("/api/solicitudes/{solicitud_id}")
def get_solicitud(solicitud_id: int):
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Error de conexión")

    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT s.id_solicitud, s.monto, s.fecha, s.estado, s.id_banco,
               u.id_usuario, u.nombre, u.apellido, u.correo, u.cedula,
               b.nombre_banco
        FROM solicitud s
        JOIN usuario u ON s.id_usuario = u.id_usuario
        LEFT JOIN entidad_bancaria b ON s.id_banco = b.id_banco
        WHERE s.id_solicitud = %s
    """, (solicitud_id,))

    solicitud = cursor.fetchone()

    if not solicitud:
        cursor.close()
        conn.close()
        raise HTTPException(status_code=404, detail="Solicitud no encontrada")

    cursor.execute("""
        SELECT id_credito, monto_aprobado, tasa_interes, plazo,
               cuotas_totales, cuotas_pagadas, saldo_pendiente, fecha_aprobacion
        FROM credito WHERE id_solicitud = %s
    """, (solicitud_id,))
    solicitud["credito"] = cursor.fetchall()

    cursor.close()
    conn.close()

    return solicitud


@app.get("/api/solicitudes/{solicitud_id}/log")
def get_solicitud_log(solicitud_id: int):
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Error de conexión")

    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT id_log, id_solicitud, estado_anterior, estado_nuevo, fecha_cambio, usuario_responsable
        FROM estado_solicitud_log
        WHERE id_solicitud = %s
        ORDER BY fecha_cambio DESC
    """, (solicitud_id,))

    log = cursor.fetchall()
    cursor.close()
    conn.close()

    return log


@app.get("/api/usuario/{usuario_id}/solicitudes")
def get_solicitudes_usuario(usuario_id: int):
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Error de conexión")

    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT id_solicitud, monto, fecha, estado, id_banco
        FROM solicitud WHERE id_usuario = %s
        ORDER BY fecha DESC
    """, (usuario_id,))

    solicitudes = cursor.fetchall()
    cursor.close()
    conn.close()

    return solicitudes


@app.post("/api/solicitudes")
def crear_solicitud(data: SolicitudCreate):
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Error de conexión")

    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT id_usuario FROM usuario WHERE correo = %s", (data.correo,))
    usuario = cursor.fetchone()

    if not usuario:
        cursor.close()
        conn.close()
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    user_id = usuario["id_usuario"]

    cursor.execute("INSERT INTO solicitud (id_usuario, monto) VALUES (%s, %s)", (user_id, data.monto))
    solicitud_id = cursor.lastrowid

    cursor.execute("INSERT INTO notificacion (id_usuario, tipo, mensaje) VALUES (%s, 'solicitud_creada', %s)",
                   (user_id, f"Tu solicitud de crédito por ${data.monto:,.0f} ha sido creada exitosamente."))
    cursor.execute("INSERT INTO estado_solicitud_log (id_solicitud, estado_anterior, estado_nuevo, usuario_responsable) VALUES (%s, '-', 'pendiente', 'sistema')", (solicitud_id,))

    conn.commit()
    cursor.close()
    conn.close()

    return {"message": "Solicitud creada exitosamente", "id_solicitud": solicitud_id, "estado": "pendiente"}


# ==============================================
# ADMIN - FLUJO DE SOLICITUDES
# ==============================================

@app.put("/api/admin/solicitudes/{solicitud_id}/revision")
def pasar_solicitud_revision(solicitud_id: int, datos: SolicitudAdminUpdate):
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Error de conexión")

    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT id_solicitud, estado FROM solicitud WHERE id_solicitud = %s", (solicitud_id,))
    solicitud = cursor.fetchone()

    if not solicitud:
        cursor.close()
        conn.close()
        raise HTTPException(status_code=404, detail="Solicitud no encontrada")

    estado_anterior = solicitud["estado"]
    if estado_anterior in ("aprobado", "rechazado"):
        cursor.close()
        conn.close()
        raise HTTPException(status_code=400, detail="La solicitud ya fue resuelta")

    cursor.execute("UPDATE solicitud SET estado = 'en_revision' WHERE id_solicitud = %s", (solicitud_id,))
    cursor.execute("""
        INSERT INTO estado_solicitud_log (id_solicitud, estado_anterior, estado_nuevo, usuario_responsable)
        VALUES (%s, %s, 'en_revision', 'admin@micropse.com')
    """, (solicitud_id, estado_anterior))

    conn.commit()
    cursor.close()
    conn.close()

    return {"message": "Solicitud en revisión"}


@app.put("/api/admin/solicitudes/{solicitud_id}/aprobar")
def aprobar_solicitud(solicitud_id: int, datos: AprobarSolicitud):
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Error de conexión")

    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT id_solicitud, id_usuario, monto, estado FROM solicitud WHERE id_solicitud = %s", (solicitud_id,))
    solicitud = cursor.fetchone()

    if not solicitud:
        cursor.close()
        conn.close()
        raise HTTPException(status_code=404, detail="Solicitud no encontrada")

    if solicitud["estado"] == "aprobado":
        cursor.close()
        conn.close()
        raise HTTPException(status_code=400, detail="La solicitud ya está aprobada")

    estado_anterior = solicitud["estado"]

    cuotas_totales = datos.plazo
    cursor.execute("""
        UPDATE solicitud SET estado = 'aprobado', id_banco = %s
        WHERE id_solicitud = %s
    """, (datos.id_banco, solicitud_id))

    cursor.execute("""
        INSERT INTO credito (id_solicitud, monto_aprobado, tasa_interes, plazo, cuotas_totales, saldo_pendiente)
        VALUES (%s, %s, %s, %s, %s, %s)
    """, (solicitud_id, datos.monto_aprobado, datos.tasa_interes, datos.plazo,
          cuotas_totales, datos.monto_aprobado))

    cursor.execute("""
        INSERT INTO estado_solicitud_log (id_solicitud, estado_anterior, estado_nuevo, usuario_responsable)
        VALUES (%s, %s, 'aprobado', 'admin@micropse.com')
    """, (solicitud_id, estado_anterior))

    cursor.execute("""
        INSERT INTO notificacion (id_usuario, tipo, mensaje)
        VALUES (%s, 'aprobacion', %s)
    """, (solicitud["id_usuario"], f"¡Felicidades! Tu crédito de ${datos.monto_aprobado:,.0f} ha sido APROBADO."))

    if datos.id_banco:
        cursor.execute("UPDATE entidad_bancaria SET respuesta = 'aprobado', fecha_respuesta = CURRENT_TIMESTAMP WHERE id_banco = %s", (datos.id_banco,))

    conn.commit()
    cursor.close()
    conn.close()

    return {"message": "Solicitud aprobada y crédito creado exitosamente"}


@app.put("/api/admin/solicitudes/{solicitud_id}/rechazar")
def rechazar_solicitud(solicitud_id: int, observaciones: Optional[str] = None):
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Error de conexión")

    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT id_solicitud, id_usuario, estado, id_banco FROM solicitud WHERE id_solicitud = %s", (solicitud_id,))
    solicitud = cursor.fetchone()

    if not solicitud:
        cursor.close()
        conn.close()
        raise HTTPException(status_code=404, detail="Solicitud no encontrada")

    if solicitud["estado"] == "rechazado":
        cursor.close()
        conn.close()
        raise HTTPException(status_code=400, detail="La solicitud ya está rechazada")

    estado_anterior = solicitud["estado"]

    cursor.execute("UPDATE solicitud SET estado = 'rechazado' WHERE id_solicitud = %s", (solicitud_id,))
    cursor.execute("""
        INSERT INTO estado_solicitud_log (id_solicitud, estado_anterior, estado_nuevo, usuario_responsable)
        VALUES (%s, %s, 'rechazado', 'admin@micropse.com')
    """, (solicitud_id, estado_anterior))

    if solicitud["id_banco"]:
        cursor.execute("UPDATE entidad_bancaria SET respuesta = 'rechazado', fecha_respuesta = CURRENT_TIMESTAMP, observaciones = %s WHERE id_banco = %s", (observaciones, solicitud["id_banco"]))

    cursor.execute("""
        INSERT INTO notificacion (id_usuario, tipo, mensaje)
        VALUES (%s, 'rechazo', 'Lo sentimos, tu solicitud de crédito ha sido RECHAZADA.')
    """, (solicitud["id_usuario"],))

    conn.commit()
    cursor.close()
    conn.close()

    return {"message": "Solicitud rechazada"}


# ==============================================
# CRÉDITOS
# ==============================================

@app.get("/api/creditos")
def get_creditos():
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Error de conexión")

    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT c.id_credito, c.monto_aprobado, c.tasa_interes, c.plazo,
               c.cuotas_totales, c.cuotas_pagadas, c.saldo_pendiente, c.fecha_aprobacion,
               u.nombre, u.correo, s.id_solicitud
        FROM credito c
        JOIN solicitud s ON c.id_solicitud = s.id_solicitud
        JOIN usuario u ON s.id_usuario = u.id_usuario
        ORDER BY c.fecha_aprobacion DESC
    """)

    creditos = cursor.fetchall()
    cursor.close()
    conn.close()

    return creditos


@app.get("/api/creditos/{credito_id}")
def get_credito(credito_id: int):
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Error de conexión")

    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT c.id_credito, c.id_solicitud, c.monto_aprobado, c.tasa_interes, c.plazo,
               c.cuotas_totales, c.cuotas_pagadas, c.saldo_pendiente, c.fecha_aprobacion,
               u.id_usuario, u.nombre, u.correo
        FROM credito c
        JOIN solicitud s ON c.id_solicitud = s.id_solicitud
        JOIN usuario u ON s.id_usuario = u.id_usuario
        WHERE c.id_credito = %s
    """, (credito_id,))

    credito = cursor.fetchone()

    if not credito:
        cursor.close()
        conn.close()
        raise HTTPException(status_code=404, detail="Crédito no encontrado")

    cursor.execute("""
        SELECT p.id_pago, p.monto_pago, p.fecha_pago, m.nombre_metodo
        FROM pago p
        LEFT JOIN metodo_pago m ON p.id_metodo = m.id_metodo
        WHERE p.id_credito = %s
        ORDER BY p.fecha_pago DESC
    """, (credito_id,))
    credito["pagos"] = cursor.fetchall()

    cursor.close()
    conn.close()

    return credito


@app.get("/api/creditos/usuario/{usuario_id}")
def get_credito_usuario(usuario_id: int, activo: Optional[int] = None):
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Error de conexión")

    cursor = conn.cursor(dictionary=True)

    if activo == 1:
        cursor.execute("""
            SELECT c.id_credito, c.monto_aprobado, c.tasa_interes, c.plazo,
                   c.cuotas_totales, c.cuotas_pagadas, c.saldo_pendiente, c.fecha_aprobacion
            FROM credito c
            JOIN solicitud s ON c.id_solicitud = s.id_solicitud
            WHERE s.id_usuario = %s AND c.saldo_pendiente > 0
            ORDER BY c.fecha_aprobacion DESC
        """, (usuario_id,))
    else:
        cursor.execute("""
            SELECT c.id_credito, c.monto_aprobado, c.tasa_interes, c.plazo,
                   c.cuotas_totales, c.cuotas_pagadas, c.saldo_pendiente, c.fecha_aprobacion
            FROM credito c
            JOIN solicitud s ON c.id_solicitud = s.id_solicitud
            WHERE s.id_usuario = %s
            ORDER BY c.fecha_aprobacion DESC
        """, (usuario_id,))

    creditos = cursor.fetchall()
    cursor.close()
    conn.close()

    return creditos


@app.get("/api/creditos/{credito_id}/pagos")
def get_pagos_credito(credito_id: int):
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Error de conexión")

    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT p.id_pago, p.monto_pago, p.fecha_pago, m.nombre_metodo
        FROM pago p
        LEFT JOIN metodo_pago m ON p.id_metodo = m.id_metodo
        WHERE p.id_credito = %s
        ORDER BY p.fecha_pago DESC
    """, (credito_id,))

    pagos = cursor.fetchall()
    cursor.close()
    conn.close()

    return pagos


# ==============================================
# PAGOS
# ==============================================

@app.get("/api/pagos")
def get_pagos():
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Error de conexión")

    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT p.id_pago, p.id_credito, p.monto_pago, p.fecha_pago,
               m.nombre_metodo, u.nombre, u.correo
        FROM pago p
        LEFT JOIN metodo_pago m ON p.id_metodo = m.id_metodo
        JOIN credito c ON p.id_credito = c.id_credito
        JOIN solicitud s ON c.id_solicitud = s.id_solicitud
        JOIN usuario u ON s.id_usuario = u.id_usuario
        ORDER BY p.fecha_pago DESC
    """)

    pagos = cursor.fetchall()
    cursor.close()
    conn.close()

    return pagos


@app.post("/api/pagos")
def registrar_pago(data: PagoCreate):
    if data.monto <= 0:
        raise HTTPException(status_code=400, detail="El monto debe ser mayor a cero")

    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Error de conexión")

    cursor = conn.cursor(dictionary=True)

    cursor.execute("""
        SELECT u.id_usuario AS id_usuario, c.id_credito, c.saldo_pendiente
        FROM credito c
        JOIN solicitud s ON c.id_solicitud = s.id_solicitud
        JOIN usuario u ON s.id_usuario = u.id_usuario
        WHERE u.correo = %s AND c.saldo_pendiente > 0
    """, (data.correo,))
    credito = cursor.fetchone()

    if not credito:
        cursor.close()
        conn.close()
        raise HTTPException(status_code=404, detail="No tienes créditos activos")

    id_usuario = credito["id_usuario"]
    id_credito = credito["id_credito"]
    saldo_actual = float(credito["saldo_pendiente"])
    nuevo_saldo = saldo_actual - data.monto

    cursor.execute("INSERT INTO pago (id_credito, id_metodo, monto_pago) VALUES (%s, %s, %s)",
                   (id_credito, data.id_metodo, data.monto))

    cursor.execute("""
        UPDATE credito SET saldo_pendiente = %s, cuotas_pagadas = cuotas_pagadas + 1
        WHERE id_credito = %s
    """, (max(nuevo_saldo, 0), id_credito))

    cursor.execute("""
        INSERT INTO notificacion (id_usuario, tipo, mensaje)
        VALUES (%s, 'pago_recibido', %s)
    """, (id_usuario, f"Se ha recibido tu pago de ${data.monto:,.0f}. Saldo pendiente: ${max(nuevo_saldo, 0):,.0f}"))

    if nuevo_saldo <= 0:
        cursor.execute("UPDATE usuario SET activo = 0 WHERE id_usuario = %s", (id_usuario,))

    conn.commit()
    cursor.close()
    conn.close()

    return {"message": f"Pago de ${data.monto} registrado", "saldo_restante": round(max(nuevo_saldo, 0), 2)}


# ==============================================
# ENTIDADES BANCARIAS
# ==============================================

@app.get("/api/bancos")
def get_bancos():
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Error de conexión")

    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT id_banco, nombre_banco, respuesta, fecha_respuesta, observaciones FROM entidad_bancaria ORDER BY nombre_banco")

    bancos = cursor.fetchall()
    cursor.close()
    conn.close()

    return bancos


@app.get("/api/bancos/{banco_id}")
def get_banco(banco_id: int):
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Error de conexión")

    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT id_banco, nombre_banco, respuesta, fecha_respuesta, observaciones FROM entidad_bancaria WHERE id_banco = %s", (banco_id,))

    banco = cursor.fetchone()

    if not banco:
        cursor.close()
        conn.close()
        raise HTTPException(status_code=404, detail="Banco no encontrado")

    cursor.close()
    conn.close()

    return banco


@app.post("/api/admin/bancos")
def create_banco(banco: BancoCreate):
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Error de conexión")

    cursor = conn.cursor()
    cursor.execute("INSERT INTO entidad_bancaria (nombre_banco, respuesta, observaciones) VALUES (%s, %s, %s)",
                   (banco.nombre_banco, banco.respuesta, banco.observaciones))

    banco_id = cursor.lastrowid
    conn.commit()
    cursor.close()
    conn.close()

    return {"message": "Entidad bancaria creada exitosamente", "id": banco_id}


@app.put("/api/admin/bancos/{banco_id}")
def update_banco(banco_id: int, banco: BancoUpdate):
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Error de conexión")

    cursor = conn.cursor()

    cursor.execute("SELECT id_banco FROM entidad_bancaria WHERE id_banco = %s", (banco_id,))
    if not cursor.fetchone():
        cursor.close()
        conn.close()
        raise HTTPException(status_code=404, detail="Banco no encontrado")

    if banco.nombre_banco is not None:
        cursor.execute("UPDATE entidad_bancaria SET nombre_banco = %s WHERE id_banco = %s", (banco.nombre_banco, banco_id))
    if banco.respuesta is not None:
        cursor.execute("""
            UPDATE entidad_bancaria SET respuesta = %s, fecha_respuesta = CASE WHEN %s = 'pendiente' THEN NULL ELSE CURRENT_TIMESTAMP END
            WHERE id_banco = %s
        """, (banco.respuesta, banco.respuesta, banco_id))
    if banco.observaciones is not None:
        cursor.execute("UPDATE entidad_bancaria SET observaciones = %s WHERE id_banco = %s", (banco.observaciones, banco_id))

    conn.commit()
    cursor.close()
    conn.close()

    return {"message": "Entidad bancaria actualizada exitosamente"}


@app.delete("/api/admin/bancos/{banco_id}")
def delete_banco(banco_id: int):
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Error de conexión")

    cursor = conn.cursor()
    cursor.execute("DELETE FROM entidad_bancaria WHERE id_banco = %s", (banco_id,))
    conn.commit()

    cursor.close()
    conn.close()

    return {"message": "Entidad bancaria eliminada exitosamente"}


# ==============================================
# ADMIN - CRÉDITOS (CRUD)
# ==============================================

@app.post("/api/admin/creditos")
def create_credito(credito: CreditoCreate):
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Error de conexión")

    cursor = conn.cursor(dictionary=True)

    cursor.execute("SELECT id_solicitud, estado FROM solicitud WHERE id_solicitud = %s", (credito.id_solicitud,))
    solicitud = cursor.fetchone()

    if not solicitud:
        cursor.close()
        conn.close()
        raise HTTPException(status_code=404, detail="Solicitud no encontrada")

    cuotas_totales = credito.cuotas_totales or credito.plazo

    cursor.execute("""
        INSERT INTO credito (id_solicitud, monto_aprobado, tasa_interes, plazo, cuotas_totales, saldo_pendiente)
        VALUES (%s, %s, %s, %s, %s, %s)
    """, (credito.id_solicitud, credito.monto_aprobado, credito.tasa_interes,
          credito.plazo, cuotas_totales, credito.monto_aprobado))

    credito_id = cursor.lastrowid

    cursor.execute("UPDATE solicitud SET estado = 'aprobado' WHERE id_solicitud = %s", (credito.id_solicitud,))

    cursor.execute("""
        INSERT INTO estado_solicitud_log (id_solicitud, estado_anterior, estado_nuevo, usuario_responsable)
        VALUES (%s, %s, 'aprobado', 'admin@micropse.com')
    """, (credito.id_solicitud, solicitud["estado"]))

    conn.commit()
    cursor.close()
    conn.close()

    return {"message": "Crédito creado exitosamente", "id": credito_id}


@app.put("/api/admin/creditos/{credito_id}")
def update_credito(credito_id: int, datos: CreditoUpdate):
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Error de conexión")

    cursor = conn.cursor()

    cursor.execute("SELECT id_credito FROM credito WHERE id_credito = %s", (credito_id,))
    if not cursor.fetchone():
        cursor.close()
        conn.close()
        raise HTTPException(status_code=404, detail="Crédito no encontrado")

    if datos.monto_aprobado is not None:
        cursor.execute("UPDATE credito SET monto_aprobado = %s WHERE id_credito = %s", (datos.monto_aprobado, credito_id))
    if datos.tasa_interes is not None:
        cursor.execute("UPDATE credito SET tasa_interes = %s WHERE id_credito = %s", (datos.tasa_interes, credito_id))
    if datos.plazo is not None:
        cursor.execute("UPDATE credito SET plazo = %s WHERE id_credito = %s", (datos.plazo, credito_id))
    if datos.cuotas_totales is not None:
        cursor.execute("UPDATE credito SET cuotas_totales = %s WHERE id_credito = %s", (datos.cuotas_totales, credito_id))
    if datos.cuotas_pagadas is not None:
        cursor.execute("UPDATE credito SET cuotas_pagadas = %s WHERE id_credito = %s", (datos.cuotas_pagadas, credito_id))
    if datos.saldo_pendiente is not None:
        cursor.execute("UPDATE credito SET saldo_pendiente = %s WHERE id_credito = %s", (datos.saldo_pendiente, credito_id))

    conn.commit()
    cursor.close()
    conn.close()

    return {"message": "Crédito actualizado exitosamente"}


@app.delete("/api/admin/creditos/{credito_id}")
def delete_credito(credito_id: int):
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Error de conexión")

    cursor = conn.cursor()
    cursor.execute("DELETE FROM credito WHERE id_credito = %s", (credito_id,))
    conn.commit()

    cursor.close()
    conn.close()

    return {"message": "Crédito eliminado exitosamente"}


# ==============================================
# ADMIN - USUARIOS
# ==============================================

@app.get("/api/admin/usuarios")
def get_usuarios():
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Error de conexión")

    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT u.id_usuario, u.nombre, u.apellido, u.correo, u.cedula, u.telefono,
               u.fecha_registro, u.activo, u.prueba_virtual_completada,
               p.rol, p.nivel
        FROM usuario u
        JOIN perfil p ON u.id_usuario = p.id_usuario
        ORDER BY u.nombre
    """)

    usuarios = cursor.fetchall()
    cursor.close()
    conn.close()

    return usuarios


@app.put("/api/admin/usuarios/{usuario_id}/rol")
def update_rol(usuario_id: int, rol: str):
    if rol not in ("cliente", "asesor", "administrador"):
        raise HTTPException(status_code=400, detail="Rol inválido")

    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Error de conexión")

    cursor = conn.cursor(dictionary=True)

    cursor.execute("SELECT id_usuario FROM usuario WHERE id_usuario = %s", (usuario_id,))
    if not cursor.fetchone():
        cursor.close()
        conn.close()
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    cursor.execute("UPDATE perfil SET rol = %s WHERE id_usuario = %s", (rol, usuario_id))
    conn.commit()

    cursor.close()
    conn.close()

    return {"message": "Rol actualizado"}


@app.put("/api/admin/usuarios/{usuario_id}")
def update_usuario_admin(usuario_id: int, datos: UsuarioAdminUpdate):
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Error de conexión")

    cursor = conn.cursor(dictionary=True)

    cursor.execute("SELECT id_usuario FROM usuario WHERE id_usuario = %s", (usuario_id,))
    if not cursor.fetchone():
        cursor.close()
        conn.close()
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    if datos.nombre is not None:
        cursor.execute("UPDATE usuario SET nombre = %s WHERE id_usuario = %s", (datos.nombre, usuario_id))
    if datos.apellido is not None:
        cursor.execute("UPDATE usuario SET apellido = %s WHERE id_usuario = %s", (datos.apellido, usuario_id))
    if datos.cedula is not None:
        cursor.execute("SELECT id_usuario FROM usuario WHERE cedula = %s AND id_usuario != %s", (datos.cedula, usuario_id))
        if cursor.fetchone():
            cursor.close()
            conn.close()
            raise HTTPException(status_code=400, detail="Cédula ya registrada")
        cursor.execute("UPDATE usuario SET cedula = %s WHERE id_usuario = %s", (datos.cedula, usuario_id))
    if datos.correo is not None:
        cursor.execute("SELECT id_usuario FROM usuario WHERE correo = %s AND id_usuario != %s", (datos.correo, usuario_id))
        if cursor.fetchone():
            cursor.close()
            conn.close()
            raise HTTPException(status_code=400, detail="Correo ya registrado")
        cursor.execute("UPDATE usuario SET correo = %s WHERE id_usuario = %s", (datos.correo, usuario_id))
    if datos.telefono is not None:
        cursor.execute("UPDATE usuario SET telefono = %s WHERE id_usuario = %s", (datos.telefono, usuario_id))
    if datos.rol is not None:
        cursor.execute("UPDATE perfil SET rol = %s WHERE id_usuario = %s", (datos.rol, usuario_id))
    if datos.nivel is not None:
        cursor.execute("UPDATE perfil SET nivel = %s WHERE id_usuario = %s", (datos.nivel, usuario_id))
    if datos.activo is not None:
        cursor.execute("UPDATE usuario SET activo = %s WHERE id_usuario = %s", (datos.activo, usuario_id))

    conn.commit()
    cursor.close()
    conn.close()

    return {"message": "Usuario actualizado exitosamente"}


@app.delete("/api/admin/usuarios/{usuario_id}")
def delete_usuario(usuario_id: int):
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Error de conexión")

    cursor = conn.cursor()
    cursor.execute("UPDATE usuario SET activo = 0 WHERE id_usuario = %s", (usuario_id,))
    conn.commit()

    cursor.close()
    conn.close()

    return {"message": "Usuario desactivado"}


# ==============================================
# NOTIFICACIONES
# ==============================================

@app.get("/api/notificaciones/{usuario_id}")
def get_notificaciones(usuario_id: int):
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Error de conexión")

    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT id_notificacion, tipo, mensaje, leida, fecha_envio
        FROM notificacion WHERE id_usuario = %s
        ORDER BY fecha_envio DESC
    """, (usuario_id,))

    notificaciones = cursor.fetchall()
    cursor.close()
    conn.close()

    return notificaciones


@app.put("/api/notificaciones/{notificacion_id}/leida")
def marcar_notificacion_leida(notificacion_id: int, datos: NotificacionLeida):
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Error de conexión")

    cursor = conn.cursor()
    cursor.execute("UPDATE notificacion SET leida = %s WHERE id_notificacion = %s",
                   (datos.leida, notificacion_id))
    conn.commit()

    cursor.close()
    conn.close()

    return {"message": "Notificación actualizada"}


# ==============================================
# PRUEBA VIRTUAL
# ==============================================

@app.post("/api/prueba-virtual")
def registrar_prueba(data: PruebaVirtualCreate):
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Error de conexión")

    cursor = conn.cursor(dictionary=True)

    cursor.execute("SELECT id_usuario FROM usuario WHERE id_usuario = %s", (data.id_usuario,))
    if not cursor.fetchone():
        cursor.close()
        conn.close()
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    aprobada = 1 if data.puntaje >= 60 else 0

    cursor.execute("""
        INSERT INTO prueba_virtual (id_usuario, puntaje, aprobada)
        VALUES (%s, %s, %s)
    """, (data.id_usuario, data.puntaje, aprobada))

    cursor.execute("UPDATE usuario SET prueba_virtual_completada = %s WHERE id_usuario = %s", (aprobada, data.id_usuario))

    conn.commit()
    cursor.close()
    conn.close()

    return {"message": "Prueba registrada", "aprobada": bool(aprobada)}


@app.get("/api/prueba-virtual/{usuario_id}")
def get_prueba_virtual(usuario_id: int):
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Error de conexión")

    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT id_prueba, fecha_completada, puntaje, aprobada
        FROM prueba_virtual WHERE id_usuario = %s
        ORDER BY fecha_completada DESC
    """, (usuario_id,))

    pruebas = cursor.fetchall()
    cursor.close()
    conn.close()

    return pruebas


# ==============================================
# COMPATIBILIDAD (frontend antiguo — se migrará)
# ==============================================

@app.post("/registrar")
def registrar_legacy(data: UsuarioRegistro):
    return registro(data)


@app.post("/solicitar")
def solicitar_legacy(data: SolicitudCreate):
    return crear_solicitud(data)


@app.get("/solicitudes/{correo}")
def ver_solicitudes_legacy(correo: str):
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Error de conexión")

    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT id_usuario FROM usuario WHERE correo = %s", (correo,))
    usuario = cursor.fetchone()

    if not usuario:
        cursor.close()
        conn.close()
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    cursor.execute("""
        SELECT id_solicitud, monto, fecha, estado FROM solicitud
        WHERE id_usuario = %s ORDER BY fecha DESC
    """, (usuario["id_usuario"],))

    solicitudes = cursor.fetchall()
    cursor.close()
    conn.close()

    return {"solicitudes": solicitudes}


@app.get("/credito/{correo}")
def ver_credito_legacy(correo: str):
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Error de conexión")

    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT c.monto_aprobado, c.saldo_pendiente, c.cuotas_totales, c.cuotas_pagadas
        FROM credito c
        JOIN solicitud s ON c.id_solicitud = s.id_solicitud
        JOIN usuario u ON s.id_usuario = u.id_usuario
        WHERE u.correo = %s AND c.saldo_pendiente > 0
    """, (correo,))

    credito = cursor.fetchone()

    if not credito:
        cursor.close()
        conn.close()
        return {"mensaje": "No tienes créditos activos"}

    cursor.close()
    conn.close()

    return credito


@app.post("/pagar")
def pagar_legacy(data: PagoCreate):
    return registrar_pago(data)


# ==============================================
# EJECUCIÓN
# ==============================================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8080)