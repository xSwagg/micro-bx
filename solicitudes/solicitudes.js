/* Gestión de solicitudes */
let solicitudActual = null;

document.addEventListener("DOMContentLoaded", () => {
    actualizarHeader("solicitudes");
    const usuario = obtenerUsuario();
    if (usuario) {
        document.getElementById("btnNuevaSolicitud").style.display = "inline-block";
    }
    document.getElementById("btnFiltrar").addEventListener("click", cargarSolicitudes);
    document.getElementById("formNueva").addEventListener("submit", crearSolicitud);
    document.getElementById("formAprobar").addEventListener("submit", aprobarSolicitud);
    cargarSolicitudes();
});

function cerrarModal(id) {
    document.getElementById(id).classList.remove("abierto");
}

function abrirModal(id) {
    document.getElementById(id).classList.add("abierto");
}

async function cargarSolicitudes() {
    const filtro = document.getElementById("filtroEstado").value;
    const cont = document.getElementById("listaSolicitudes");
    cont.innerHTML = "Cargando...";
    try {
        const lista = await peticion(`${API_URL}/solicitudes${filtro !== "todas" ? `?estado=${filtro}` : ""}`);
        if (!lista.length) {
            cont.innerHTML = `No hay solicitudes${filtro !== "todas" ? ` con estado "${textoEstado(filtro)}"` : ""}.`;
            return;
        }
        cont.innerHTML = `
            <table class="tabla">
                <thead>
                    <tr>
                        <th>#</th><th>Solicitante</th><th>Entidad</th><th>Monto</th><th>Fecha</th><th>Estado</th><th></th>
                    </tr>
                </thead>
                <tbody>
                    ${lista.map(s => `
                        <tr>
                            <td>${s.id_solicitud}</td>
                            <td>${s.nombre} ${s.apellido}</td>
                            <td>${s.nombre_banco || "-"}</td>
                            <td>${formatearMoneda(s.monto)}</td>
                            <td>${formatearFecha(s.fecha)}</td>
                            <td>${badgeEstado(s.estado)}</td>
                            <td><button class="btn btn-sm btn-primario" onclick="verDetalle(${s.id_solicitud})">Ver</button></td>
                        </tr>
                    `).join("")}
                </tbody>
            </table>
        `;
    } catch (e) {
        cont.innerHTML = "No se pudieron cargar las solicitudes.";
    }
}

async function verDetalle(id) {
    try {
        const s = await peticion(`${API_URL}/solicitudes/${id}`);
        solicitudActual = s;
        const log = await peticion(`${API_URL}/solicitudes/${id}/log`);
        const usuario = obtenerUsuario();
        const esAdmin = usuario && usuario.rol === "administrador";

        const historial = log.length ? log.map(l => `
            <div class="item-card">
                <div class="item-info">
                    <h4>${textoEstado(l.estado_anterior)} &rarr; ${textoEstado(l.estado_nuevo)}</h4>
                    <p>${formatearFecha(l.fecha_cambio)} &middot; Responsable: ${l.usuario_responsable}</p>
                </div>
            </div>
        `).join("") : `<div class="sin-datos">Sin historial.</div>`;

        let acciones = "";
        if (esAdmin && ["pendiente", "en_revision"].includes(s.estado)) {
            acciones = `
                <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-top: 14px;">
                    ${s.estado !== "en_revision" ? `<button class="btn btn-info" onclick="pasarRevision(${s.id_solicitud})">Pasar a revisión</button>` : ""}
                    <button class="btn btn-verde" onclick="abrirAprobar(${s.id_solicitud}, ${s.monto})">Aprobar</button>
                    <button class="btn btn-danger" onclick="rechazarSolicitud(${s.id_solicitud})">Rechazar</button>
                </div>
            `;
        }

        document.getElementById("contenidoDetalle").innerHTML = `
            <h3>Solicitud #${s.id_solicitud} ${badgeEstado(s.estado)}</h3>
            <div class="detalle-grid">
                <div class="detalle-item"><span>Solicitante</span><strong>${s.nombre} ${s.apellido}</strong></div>
                <div class="detalle-item"><span>Correo</span><strong>${s.correo}</strong></div>
                <div class="detalle-item"><span>Cédula</span><strong>${s.cedula}</strong></div>
                <div class="detalle-item"><span>Entidad</span><strong>${s.nombre_banco || "No asignada"}</strong></div>
                <div class="detalle-item"><span>Monto</span><strong>${formatearMoneda(s.monto)}</strong></div>
                <div class="detalle-item"><span>Fecha</span><strong>${formatearFecha(s.fecha)}</strong></div>
            </div>
            ${s.credito && s.credito.length ? `
                <h4 style="margin-top:16px;">Crédito vinculado</h4>
                ${s.credito.map(c => `
                    <div class="item-card">
                        <div class="item-info">
                            <h4>Crédito #${c.id_credito}</h4>
                            <p>${c.cuotas_pagadas}/${c.cuotas_totales} cuotas &middot; ${c.tasa_interes}% interés</p>
                        </div>
                        <strong>${formatearMoneda(c.saldo_pendiente)}</strong>
                    </div>
                `).join("")}
            ` : ""}
            <h4 style="margin-top:16px;">Historial</h4>
            <div id="historialLog">${historial}</div>
            <div id="alertaDetalle" class="alerta"></div>
            ${acciones}
        `;
        abrirModal("modalDetalle");
    } catch (e) {
        mostrarAlerta("alertaSolicitudes", e.message, "error");
    }
}

async function crearSolicitud(e) {
    e.preventDefault();
    const usuario = obtenerUsuario();
    if (!usuario) {
        window.location.href = "../sesion/iniciarSesion.html";
        return;
    }
    const monto = parseFloat(document.getElementById("nuevoMonto").value);
    try {
        await peticion(`${API_URL}/solicitudes`, {
            method: "POST",
            body: JSON.stringify({ correo: usuario.correo, monto }),
        });
        cerrarModal("modalNueva");
        mostrarAlerta("alertaSolicitudes", "Solicitud creada exitosamente", "exito");
        e.target.reset();
        cargarSolicitudes();
    } catch (err) {
        mostrarAlerta("alertaNueva", err.message, "error");
    }
}

async function pasarRevision(id) {
    try {
        await peticion(`${API_URL}/admin/solicitudes/${id}/revision`, {
            method: "PUT",
            body: JSON.stringify({ estado: "en_revision" }),
        });
        cerrarModal("modalDetalle");
        cargarSolicitudes();
    } catch (e) {
        mostrarAlerta("alertaDetalle", e.message, "error");
    }
}

async function abrirAprobar(id, montoPropuesto) {
    document.getElementById("apMonto").value = montoPropuesto;
    document.getElementById("solicitudAprobarId").value = id;
    try {
        const bancos = await peticion(`${API_URL}/bancos`);
        document.getElementById("apBanco").innerHTML = `
            <option value="">Sin asignar</option>
            ${bancos.map(b => `<option value="${b.id_banco}">${b.nombre_banco}</option>`).join("")}
        `;
    } catch (e) { /* lista vacía */ }
    cerrarModal("modalDetalle");
    abrirModal("modalAprobar");
}

async function aprobarSolicitud(e) {
    e.preventDefault();
    const id = document.getElementById("solicitudAprobarId").value;
    const datos = {
        monto_aprobado: parseFloat(document.getElementById("apMonto").value),
        tasa_interes: parseFloat(document.getElementById("apTasa").value) || 2.50,
        plazo: parseInt(document.getElementById("apPlazo").value, 10) || 12,
        id_banco: document.getElementById("apBanco").value ? parseInt(document.getElementById("apBanco").value, 10) : null,
    };
    try {
        await peticion(`${API_URL}/admin/solicitudes/${id}/aprobar`, {
            method: "PUT",
            body: JSON.stringify(datos),
        });
        cerrarModal("modalAprobar");
        mostrarAlerta("alertaSolicitudes", "Solicitud aprobada y crédito creado", "exito");
        cargarSolicitudes();
    } catch (err) {
        mostrarAlerta("alertaAprobar", err.message, "error");
    }
}

async function rechazarSolicitud(id) {
    const motivo = prompt("Observaciones para el rechazo (opcional):");
    if (motivo === null) return;
    try {
        const url = `${API_URL}/admin/solicitudes/${id}/rechazar${motivo.trim() ? `?observaciones=${encodeURIComponent(motivo.trim())}` : ""}`;
        await peticion(url, { method: "PUT" });
        cerrarModal("modalDetalle");
        mostrarAlerta("alertaSolicitudes", "Solicitud rechazada", "exito");
        cargarSolicitudes();
    } catch (e) {
        mostrarAlerta("alertaDetalle", e.message, "error");
    }
}