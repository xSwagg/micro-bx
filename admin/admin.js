/* Panel de administración */
let bancoActual = null;

document.addEventListener("DOMContentLoaded", () => {
    const usuario = protegerSesion();
    if (!usuario) return;
    if (usuario.rol !== "administrador") {
        window.location.href = "../main/index.html";
        return;
    }
    actualizarHeader("admin");

    document.querySelectorAll(".tab-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
            document.querySelectorAll(".tab-content").forEach(t => t.classList.remove("active"));
            btn.classList.add("active");
            const tab = btn.dataset.tab;
            document.getElementById(`tab-${tab}`).classList.add("active");
            if (tab === "usuarios") cargarUsuarios();
            if (tab === "solicitudes") cargarSolicitudes();
            if (tab === "creditos") cargarCreditos();
            if (tab === "bancos") cargarBancos();
        });
    });

    document.getElementById("formUsuario").addEventListener("submit", guardarUsuario);
    document.getElementById("formBanco").addEventListener("submit", guardarBanco);

    cargarUsuarios();
});

function cerrarModal(id) {
    document.getElementById(id).classList.remove("abierto");
}

function abrirModal(id) {
    document.getElementById(id).classList.add("abierto");
}

/* ---------- Usuarios ---------- */
async function cargarUsuarios() {
    const cont = document.getElementById("listaUsuarios");
    cont.innerHTML = "Cargando...";
    try {
        const lista = await peticion(`${API_URL}/admin/usuarios`);
        if (!lista.length) {
            cont.innerHTML = "No hay usuarios registrados.";
            return;
        }
        cont.innerHTML = `
            <table class="tabla">
                <thead>
                    <tr><th>Nombre</th><th>Correo</th><th>Cédula</th><th>Rol</th><th>Estado</th><th></th></tr>
                </thead>
                <tbody>
                    ${lista.map(u => `
                        <tr style="${u.activo ? "" : "opacity:0.5;"}">
                            <td>${u.nombre} ${u.apellido}</td>
                            <td>${u.correo}</td>
                            <td>${u.cedula}</td>
                            <td>${textoRol(u.rol)}</td>
                            <td>${u.activo ? `<span class="badge estado-aprobado">Activo</span>` : `<span class="badge estado-rechazado">Inactivo</span>`}</td>
                            <td><button class="btn btn-sm btn-primario" onclick="editarUsuario(${u.id_usuario})">Editar</button></td>
                        </tr>
                    `).join("")}
                </tbody>
            </table>
        `;
    } catch (e) {
        cont.innerHTML = "No se pudieron cargar los usuarios.";
    }
}

async function editarUsuario(id) {
    try {
        const lista = await peticion(`${API_URL}/admin/usuarios`);
        const u = lista.find(x => x.id_usuario === id);
        if (!u) return;
        document.getElementById("tituloUsuario").textContent = `Editar: ${u.nombre} ${u.apellido}`;
        document.getElementById("usuarioId").value = u.id_usuario;
        document.getElementById("uxNombre").value = u.nombre;
        document.getElementById("uxApellido").value = u.apellido || "";
        document.getElementById("uxCorreo").value = u.correo;
        document.getElementById("uxCedula").value = u.cedula;
        document.getElementById("uxTelefono").value = u.telefono || "";
        document.getElementById("uxRol").value = u.rol;
        document.getElementById("uxNivel").value = u.nivel || "basico";
        document.getElementById("uxActivo").checked = !!u.activo;
        document.getElementById("alertaUsuarioModal").className = "alerta";
        abrirModal("modalUsuario");
    } catch (e) {
        mostrarAlerta("alertaAdmin", e.message, "error");
    }
}

async function guardarUsuario(e) {
    e.preventDefault();
    const id = document.getElementById("usuarioId").value;
    const datos = {
        nombre: document.getElementById("uxNombre").value.trim(),
        apellido: document.getElementById("uxApellido").value.trim(),
        correo: document.getElementById("uxCorreo").value.trim(),
        cedula: document.getElementById("uxCedula").value.trim(),
        telefono: document.getElementById("uxTelefono").value.trim(),
        rol: document.getElementById("uxRol").value,
        nivel: document.getElementById("uxNivel").value,
        activo: document.getElementById("uxActivo").checked ? 1 : 0,
    };
    try {
        await peticion(`${API_URL}/admin/usuarios/${id}`, {
            method: "PUT",
            body: JSON.stringify(datos),
        });
        cerrarModal("modalUsuario");
        cargarUsuarios();
    } catch (err) {
        mostrarAlerta("alertaUsuarioModal", err.message, "error");
    }
}

/* ---------- Solicitudes ---------- */
async function cargarSolicitudes() {
    const cont = document.getElementById("listaSolicitudes");
    cont.innerHTML = "Cargando...";
    try {
        const lista = await peticion(`${API_URL}/solicitudes`);
        if (!lista.length) {
            cont.innerHTML = "No hay solicitudes.";
            return;
        }
        cont.innerHTML = `
            <table class="tabla">
                <thead>
                    <tr><th>#</th><th>Solicitante</th><th>Monto</th><th>Fecha</th><th>Estado</th><th></th></tr>
                </thead>
                <tbody>
                    ${lista.map(s => `
                        <tr>
                            <td>${s.id_solicitud}</td>
                            <td>${s.nombre} ${s.apellido}</td>
                            <td>${formatearMoneda(s.monto)}</td>
                            <td>${formatearFecha(s.fecha)}</td>
                            <td>${badgeEstado(s.estado)}</td>
                            <td><button class="btn btn-sm btn-primario" onclick="gestionarSolicitud(${s.id_solicitud})">Gestionar</button></td>
                        </tr>
                    `).join("")}
                </tbody>
            </table>
        `;
    } catch (e) {
        cont.innerHTML = "No se pudieron cargar las solicitudes.";
    }
}

function gestionarSolicitud(id) {
    window.location.href = `../solicitudes/solicitudes.html`;
}

/* ---------- Créditos ---------- */
async function cargarCreditos() {
    const cont = document.getElementById("listaCreditos");
    cont.innerHTML = "Cargando...";
    try {
        const lista = await peticion(`${API_URL}/creditos`);
        if (!lista.length) {
            cont.innerHTML = "No hay créditos otorgados.";
            return;
        }
        cont.innerHTML = `
            <table class="tabla">
                <thead>
                    <tr><th>#</th><th>Titular</th><th>Monto</th><th>Cuotas</th><th>Saldo</th><th></th></tr>
                </thead>
                <tbody>
                    ${lista.map(c => `
                        <tr>
                            <td>${c.id_credito}</td>
                            <td>${c.nombre}</td>
                            <td>${formatearMoneda(c.monto_aprobado)}</td>
                            <td>${c.cuotas_pagadas}/${c.cuotas_totales}</td>
                            <td>${formatearMoneda(c.saldo_pendiente)}</td>
                            <td><button class="btn btn-sm btn-primario" onclick="verCredito(${c.id_credito})">Ver</button></td>
                        </tr>
                    `).join("")}
                </tbody>
            </table>
        `;
    } catch (e) {
        cont.innerHTML = "No se pudieron cargar los créditos.";
    }
}

function verCredito(id) {
    window.location.href = `../creditos/creditos.html`;
}

/* ---------- Bancos ---------- */
async function cargarBancos() {
    const cont = document.getElementById("listaBancos");
    cont.innerHTML = "Cargando...";
    try {
        const lista = await peticion(`${API_URL}/bancos`);
        if (!lista.length) {
            cont.innerHTML = "No hay entidades bancarias.";
            return;
        }
        cont.innerHTML = `
            <table class="tabla">
                <thead>
                    <tr><th>Entidad</th><th>Respuesta</th><th>Observaciones</th><th></th></tr>
                </thead>
                <tbody>
                    ${lista.map(b => `
                        <tr>
                            <td>${b.nombre_banco}</td>
                            <td>${badgeBanco(b.respuesta)}</td>
                            <td>${b.observaciones || "-"}</td>
                            <td style="display:flex; gap:6px;">
                                <button class="btn btn-sm btn-primario" onclick="editarBanco(${b.id_banco})">Editar</button>
                                <button class="btn btn-sm btn-danger" onclick="eliminarBanco(${b.id_banco})">Eliminar</button>
                            </td>
                        </tr>
                    `).join("")}
                </tbody>
            </table>
        `;
    } catch (e) {
        cont.innerHTML = "No se pudieron cargar las entidades.";
    }
}

function abrirNuevoBanco() {
    document.getElementById("tituloBanco").textContent = "Nueva entidad";
    document.getElementById("bancoId").value = "";
    document.getElementById("bancoNombre").value = "";
    document.getElementById("bancoRespuesta").value = "pendiente";
    document.getElementById("bancoObs").value = "";
    document.getElementById("alertaBancoModal").className = "alerta";
    abrirModal("modalBanco");
}

async function editarBanco(id) {
    try {
        const b = await peticion(`${API_URL}/bancos/${id}`);
        document.getElementById("tituloBanco").textContent = `Editar: ${b.nombre_banco}`;
        document.getElementById("bancoId").value = b.id_banco;
        document.getElementById("bancoNombre").value = b.nombre_banco;
        document.getElementById("bancoRespuesta").value = b.respuesta || "pendiente";
        document.getElementById("bancoObs").value = b.observaciones || "";
        document.getElementById("alertaBancoModal").className = "alerta";
        abrirModal("modalBanco");
    } catch (e) {
        mostrarAlerta("alertaAdmin", e.message, "error");
    }
}

async function guardarBanco(e) {
    e.preventDefault();
    const id = document.getElementById("bancoId").value;
    const datos = {
        nombre_banco: document.getElementById("bancoNombre").value.trim(),
        respuesta: document.getElementById("bancoRespuesta").value,
        observaciones: document.getElementById("bancoObs").value.trim(),
    };
    try {
        if (id) {
            await peticion(`${API_URL}/admin/bancos/${id}`, {
                method: "PUT",
                body: JSON.stringify(datos),
            });
        } else {
            await peticion(`${API_URL}/admin/bancos`, {
                method: "POST",
                body: JSON.stringify(datos),
            });
        }
        cerrarModal("modalBanco");
        cargarBancos();
    } catch (err) {
        mostrarAlerta("alertaBancoModal", err.message, "error");
    }
}

async function eliminarBanco(id) {
    if (!confirm("¿Eliminar esta entidad bancaria?")) return;
    try {
        await peticion(`${API_URL}/admin/bancos/${id}`, { method: "DELETE" });
        cargarBancos();
    } catch (e) {
        mostrarAlerta("alertaAdmin", e.message, "error");
    }
}