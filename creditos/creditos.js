/* Créditos */
let creditoActual = null;

document.addEventListener("DOMContentLoaded", () => {
    actualizarHeader("creditos");
    document.getElementById("formPago").addEventListener("submit", registrarPago);
    cargarCreditos();
});

function cerrarModal(id) {
    document.getElementById(id).classList.remove("abierto");
}

function abrirModal(id) {
    document.getElementById(id).classList.add("abierto");
}

async function cargarCreditos() {
    const cont = document.getElementById("listaCreditos");
    cont.innerHTML = "Cargando...";
    try {
        const lista = await peticion(`${API_URL}/creditos`);
        if (!lista.length) {
            cont.innerHTML = "Aún no se han otorgado créditos.";
            return;
        }
        cont.innerHTML = `
            <table class="tabla">
                <thead>
                    <tr>
                        <th>#</th><th>Titular</th><th>Monto</th><th>Tasa</th><th>Cuotas</th><th>Saldo</th><th>Aprobado</th><th></th>
                    </tr>
                </thead>
                <tbody>
                    ${lista.map(c => {
                        const pct = c.cuotas_totales > 0 ? Math.round((c.cuotas_pagadas / c.cuotas_totales) * 100) : 0;
                        const saldo = parseFloat(c.saldo_pendiente);
                        return `
                            <tr>
                                <td>${c.id_credito}</td>
                                <td>${c.nombre}</td>
                                <td>${formatearMoneda(c.monto_aprobado)}</td>
                                <td>${c.tasa_interes}%</td>
                                <td>${c.cuotas_pagadas}/${c.cuotas_totales}
                                    <div class="progreso"><div class="progreso-barra" style="width:${pct}%"></div></div>
                                </td>
                                <td>${formatearMoneda(saldo)}</td>
                                <td>${formatearFecha(c.fecha_aprobacion)}</td>
                                <td><button class="btn btn-sm btn-primario" onclick="verDetalle(${c.id_credito})">Ver</button></td>
                            </tr>
                        `;
                    }).join("")}
                </tbody>
            </table>
        `;
    } catch (e) {
        cont.innerHTML = "No se pudieron cargar los créditos.";
    }
}

async function verDetalle(id) {
    try {
        const c = await peticion(`${API_URL}/creditos/${id}`);
        creditoActual = c;
        const pct = c.cuotas_totales > 0 ? Math.round((c.cuotas_pagadas / c.cuotas_totales) * 100) : 0;
        const pagos = c.pagos && c.pagos.length ? c.pagos.map(p => `
            <tr>
                <td>${p.id_pago}</td>
                <td>${formatearMoneda(p.monto_pago)}</td>
                <td>${formatearFecha(p.fecha_pago)}</td>
                <td>${p.nombre_metodo || "-"}</td>
            </tr>
        `).join("") : `<tr><td colspan="4" class="sin-datos">Sin pagos registrados.</td></tr>`;

        document.getElementById("contenidoDetalle").innerHTML = `
            <h3>Crédito #${c.id_credito}</h3>
            <p style="color:#666; margin-bottom:10px;">Titular: ${c.nombre} (${c.correo})</p>
            <div class="detalle-grid">
                <div class="detalle-item"><span>Monto aprobado</span><strong>${formatearMoneda(c.monto_aprobado)}</strong></div>
                <div class="detalle-item"><span>Saldo pendiente</span><strong>${formatearMoneda(c.saldo_pendiente)}</strong></div>
                <div class="detalle-item"><span>Tasa de interés</span><strong>${c.tasa_interes}%</strong></div>
                <div class="detalle-item"><span>Plazo</span><strong>${c.plazo} meses</strong></div>
                <div class="detalle-item"><span>Cuotas pagadas</span><strong>${c.cuotas_pagadas}/${c.cuotas_totales}</strong></div>
                <div class="detalle-item"><span>Aprobado el</span><strong>${formatearFecha(c.fecha_aprobacion)}</strong></div>
            </div>
            <div class="progreso" style="margin-top:12px;"><div class="progreso-barra" style="width:${pct}%"></div></div>
            <h4 style="margin-top:18px;">Historial de pagos</h4>
            <table class="tabla">
                <thead><tr><th># Pago</th><th>Monto</th><th>Fecha</th><th>Método</th></tr></thead>
                <tbody>${pagos}</tbody>
            </table>
            <div style="margin-top:16px;">
                <button class="btn btn-verde" onclick="abrirPago()">Registrar pago</button>
            </div>
        `;
        abrirModal("modalDetalle");
    } catch (e) {
        mostrarAlerta("alertaCreditos", e.message, "error");
    }
}

function abrirPago() {
    const usuario = obtenerUsuario();
    if (!usuario) {
        window.location.href = "../sesion/iniciarSesion.html";
        return;
    }
    document.getElementById("pagoInfo").textContent =
        `Pagando saldo de crédito #${creditoActual.id_credito} como ${usuario.correo}. Saldo actual: ${formatearMoneda(creditoActual.saldo_pendiente)}`;
    document.getElementById("pagoMonto").value = "";
    cerrarModal("modalDetalle");
    abrirModal("modalPago");
}

async function registrarPago(e) {
    e.preventDefault();
    const usuario = obtenerUsuario();
    if (!usuario) return;
    const monto = parseFloat(document.getElementById("pagoMonto").value);
    const id_metodo = parseInt(document.getElementById("pagoMetodo").value, 10);
    try {
        const res = await peticion(`${API_URL}/pagos`, {
            method: "POST",
            body: JSON.stringify({ correo: usuario.correo, monto, id_metodo }),
        });
        cerrarModal("modalPago");
        mostrarAlerta("alertaCreditos", `${res.message}. Saldo restante: ${formatearMoneda(res.saldo_restante)}`, "exito");
        e.target.reset();
        cargarCreditos();
    } catch (err) {
        mostrarAlerta("alertaPago", err.message, "error");
    }
}