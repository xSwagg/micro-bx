from pydantic import BaseModel, EmailStr
from typing import Optional


class UsuarioRegistro(BaseModel):
    nombre: str
    apellido: str = ""
    cedula: str
    correo: EmailStr
    contrasena: str = "123456"
    telefono: str = ""


class UsuarioLogin(BaseModel):
    correo: str
    contrasena: str


class SolicitudCreate(BaseModel):
    correo: str
    monto: float


class SolicitudAdminUpdate(BaseModel):
    estado: str = "en_revision"


class AprobarSolicitud(BaseModel):
    monto_aprobado: float
    tasa_interes: float = 2.50
    plazo: int = 12
    id_banco: Optional[int] = None


class CreditoCreate(BaseModel):
    id_solicitud: int
    monto_aprobado: float
    tasa_interes: float = 2.50
    plazo: int = 12
    cuotas_totales: Optional[int] = None


class CreditoUpdate(BaseModel):
    monto_aprobado: Optional[float] = None
    tasa_interes: Optional[float] = None
    plazo: Optional[int] = None
    cuotas_totales: Optional[int] = None
    cuotas_pagadas: Optional[int] = None
    saldo_pendiente: Optional[float] = None


class PagoCreate(BaseModel):
    correo: str
    monto: float
    id_metodo: Optional[int] = None


class BancoCreate(BaseModel):
    nombre_banco: str
    respuesta: str = "pendiente"
    observaciones: str = ""


class BancoUpdate(BaseModel):
    nombre_banco: Optional[str] = None
    respuesta: Optional[str] = None
    observaciones: Optional[str] = None


class PruebaVirtualCreate(BaseModel):
    id_usuario: int
    puntaje: float


class NotificacionLeida(BaseModel):
    leida: int = 1


class PerfilUpdate(BaseModel):
    nombre: Optional[str] = None
    apellido: Optional[str] = None
    telefono: Optional[str] = None
    nivel: Optional[str] = None
    foto: Optional[str] = None


class PasswordUpdate(BaseModel):
    contrasena_actual: str
    contrasena_nueva: str


class UsuarioAdminUpdate(BaseModel):
    nombre: Optional[str] = None
    apellido: Optional[str] = None
    cedula: Optional[str] = None
    correo: Optional[str] = None
    telefono: Optional[str] = None
    rol: Optional[str] = None
    nivel: Optional[str] = None
    activo: Optional[int] = None