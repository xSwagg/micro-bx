from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, EmailStr
import mysql.connector
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def conectar():
    return mysql.connector.connect(
        host="localhost",
        user="root",
        password="",
        database="micropsev2"
    )

class Usuario(BaseModel):
    nombre: str
    cedula: str
    correo: EmailStr
    telefono: str = ""

class Solicitud(BaseModel):
    correo: str
    monto: float

class Pago(BaseModel):
    correo: str
    monto: float

@app.post("/registrar")
def registrar_usuario(data: Usuario):
    try:
        db = conectar()
        cursor = db.cursor()
        cursor.execute("SELECT id_usuario FROM usuario WHERE correo = %s OR cedula = %s", (data.correo, data.cedula))
        if cursor.fetchone():
            raise HTTPException(status_code=400, detail="El correo o cédula ya existe")
        sql = "INSERT INTO usuario (nombre, cedula, correo, telefono, contrasena, activo) VALUES (%s, %s, %s, %s, SHA2('123456', 256), 1)"
        cursor.execute(sql, (data.nombre, data.cedula, data.correo, data.telefono))
        db.commit()
        return {"mensaje": "Usuario registrado correctamente"}
    finally:
        cursor.close()
        db.close()

@app.post("/solicitar")
def crear_solicitud(data: Solicitud):
    try:
        db = conectar()
        cursor = db.cursor()
        cursor.execute("SELECT id_usuario FROM usuario WHERE correo = %s", (data.correo,))
        usuario = cursor.fetchone()
        if not usuario:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")
        sql = "INSERT INTO solicitud (id_usuario, monto, estado) VALUES (%s, %s, 'pendiente')"
        cursor.execute(sql, (usuario[0], data.monto))
        db.commit()
        return {"mensaje": "Solicitud creada exitosamente", "estado": "pendiente"}
    finally:
        cursor.close()
        db.close()

@app.get("/solicitudes/{correo}")
def ver_solicitudes(correo: str):
    try:
        db = conectar()
        cursor = db.cursor()
        cursor.execute("SELECT id_usuario FROM usuario WHERE correo = %s", (correo,))
        usuario = cursor.fetchone()
        if not usuario:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")
        cursor.execute("SELECT id_solicitud, monto, fecha, estado FROM solicitud WHERE id_usuario = %s ORDER BY fecha DESC", (usuario[0],))
        solicitudes = []
        for row in cursor.fetchall():
            solicitudes.append({
                "id_solicitud": row[0],
                "monto": row[1],
                "fecha": row[2],
                "estado": row[3]
            })
        return {"solicitudes": solicitudes}
    finally:
        cursor.close()
        db.close()

@app.get("/credito/{correo}")
def ver_credito(correo: str):
    try:
        db = conectar()
        cursor = db.cursor()
        cursor.execute("""
            SELECT c.monto_aprobado, c.saldo_pendiente, c.cuotas_totales, c.cuotas_pagadas
            FROM credito c
            JOIN solicitud s ON c.id_solicitud = s.id_solicitud
            JOIN usuario u ON s.id_usuario = u.id_usuario
            WHERE u.correo = %s AND c.saldo_pendiente > 0
        """, (correo,))
        credito = cursor.fetchone()
        if not credito:
            return {"mensaje": "No tienes créditos activos"}
        return {
            "monto_aprobado": credito[0],
            "saldo_pendiente": credito[1],
            "cuotas_totales": credito[2],
            "cuotas_pagadas": credito[3]
        }
    finally:
        cursor.close()
        db.close()

@app.post("/pagar")
def registrar_pago(data: Pago):
    try:
        db = conectar()
        cursor = db.cursor()
        cursor.execute("""
            SELECT c.id_credito, c.saldo_pendiente
            FROM credito c
            JOIN solicitud s ON c.id_solicitud = s.id_solicitud
            JOIN usuario u ON s.id_usuario = u.id_usuario
            WHERE u.correo = %s AND c.saldo_pendiente > 0
        """, (data.correo,))
        credito = cursor.fetchone()
        if not credito:
            raise HTTPException(status_code=404, detail="No tienes créditos activos")
        id_credito = credito[0]
        saldo_actual = credito[1]
        nuevo_saldo = saldo_actual - data.monto
        cursor.execute("UPDATE credito SET saldo_pendiente = %s, cuotas_pagadas = cuotas_pagadas + 1 WHERE id_credito = %s", (max(nuevo_saldo, 0), id_credito))
        if nuevo_saldo <= 0:
            cursor.execute("UPDATE usuario SET activo = 0 WHERE correo = %s", (data.correo,))
        db.commit()
        return {"mensaje": f"Pago de ${data.monto} registrado", "saldo_restante": max(nuevo_saldo, 0)}
    finally:
        cursor.close()
        db.close()
        