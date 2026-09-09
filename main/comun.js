/* =============================================
   MicrocreditosBX - Utilidades compartidas
   (multi-página, similar a Pal' Monte)
   ============================================= */

const API_URL = "http://127.0.0.1:8080/api";

function obtenerUsuario() {
    const guardado = localStorage.getItem("usuario");
    return guardado ? JSON.parse(guardado) : null;
}

function formatearMoneda(valor) {
    const n = parseFloat(valor) || 0;
    return new Intl.NumberFormat("es-CO", {
        style: "currency",
        currency: "COP",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(n);
}

function formatearFecha(fecha) {
    if (!fecha) return "-";
    return new Date(fecha).toLocaleString("es-CO");
}

function textoEstado(estado) {
    const map = { pendiente: "Pendiente", en_revision: "En revisión", aprobado: "Aprobado", rechazado: "Rechazado" };
    return map[estado] || estado;
}

function badgeEstado(estado) {
    return `<span class="badge estado-${estado}">${textoEstado(estado)}</span>`;
}

function badgeBanco(respuesta) {
    const mapa = { aprobado: "Aprobado", rechazado: "Rechazado", pendiente: "Pendiente" };
    return `<span class="badge estado-${respuesta}">${mapa[respuesta] || respuesta}</span>`;
}

function textoRol(rol) {
    const mapa = { cliente: "Cliente", asesor: "Asesor", administrador: "Administrador" };
    return mapa[rol] || rol;
}

function mostrarAlerta(id, mensaje, tipo) {
    const el = document.getElementById(id);
    if (!el) return;
    el.className = `alerta mostrar alerta-${tipo || "info"}`;
    el.textContent = mensaje;
    setTimeout(() => { el.classList.remove("mostrar"); }, 6000);
}

// Fetch con manejo de errores estandarizado
async function peticion(url, opciones = {}) {
    const config = { headers: { "Content-Type": "application/json" }, ...opciones };
    let res;
    try {
        res = await fetch(url, config);
    } catch (e) {
        throw new Error("Error de conexión con el servidor");
    }
    let data = null;
    try { data = await res.json(); } catch (e) { /* sin cuerpo JSON */ }
    if (!res.ok) {
        let detalle = "Error en la petición";
        if (data && data.detail) {
            detalle = typeof data.detail === "string" ? data.detail : JSON.stringify(data.detail);
        }
        const error = new Error(detalle);
        error.status = res.status;
        throw error;
    }
    return data;
}

// Navbar dinámico según sesión
function actualizarHeader(pagina = "") {
    const nav = document.getElementById("navLinks");
    if (!nav) return;

    const usuario = obtenerUsuario();
    const esAdmin = usuario && usuario.rol === "administrador";

    let enlaces = [
        `<a href="../main/index.html" class="${pagina === "inicio" ? "active" : ""}">Inicio</a>`,
        `<a href="../solicitudes/solicitudes.html" class="${pagina === "solicitudes" ? "active" : ""}">Solicitudes</a>`,
        `<a href="../creditos/creditos.html" class="${pagina === "creditos" ? "active" : ""}">Créditos</a>`,
        `<a href="../bancos/bancos.html" class="${pagina === "bancos" ? "active" : ""}">Entidades</a>`,
    ];

    if (esAdmin) {
        enlaces.push(`<a href="../admin/index.html" class="${pagina === "admin" ? "active" : ""}">Admin</a>`);
    }

    if (usuario) {
        const nombres = `${usuario.nombre} ${usuario.apellido || ""}`.trim();
        enlaces.push(`<a href="../sesion/perfil.html" class="btn">${nombres}</a>`);
        enlaces.push(`<button class="btn btn-danger" id="btnLogoutNav">Cerrar sesión</button>`);
    } else {
        enlaces.push(`<a href="../sesion/iniciarSesion.html" class="btn">Iniciar sesión</a>`);
        enlaces.push(`<a href="../sesion/registro.html" class="btn btn-primario">Registrarme</a>`);
    }

    nav.innerHTML = enlaces.join("");

    const btnLogout = document.getElementById("btnLogoutNav");
    if (btnLogout) {
        btnLogout.addEventListener("click", () => {
            localStorage.removeItem("usuario");
            window.location.href = "../main/index.html";
        });
    }
}

// Redirigir a login si no hay sesión
function protegerSesion() {
    if (!obtenerUsuario()) {
        window.location.href = "../sesion/iniciarSesion.html";
        return null;
    }
    return obtenerUsuario();
}