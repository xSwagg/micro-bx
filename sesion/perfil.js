/* Perfil de usuario */
let perfilActual = null;
let usuarioSesion = null;

const PREGUNTAS_PRUEBA = [
    { p: "¿Qué es una tasa de interés?", o: ["El costo de pedir dinero prestado", "Un impuesto a las ganancias", "La garantía del crédito"], r: 0 },
    { p: "¿Qué significa amortizar?", o: ["Aumentar la deuda", "Reducir la deuda mediante pagos periódicos", "Cambiar de entidad"], r: 1 },
    { p: "¿Cuándo es recomendable solicitar un crédito?", o: ["Cuando se necesita con urgencia sin planear", "Cuando los ingresos futuros permiten pagarlo", "Nunca"], r: 1 },
    { p: "¿Qué es el saldo pendiente?", o: ["El total aún por pagar del crédito", "El interés acumulado", "Lo ya pagado"], r: 0 },
    { p: "¿Qué pasa si no pagas una cuota?", o: ["Nada grave", "Se generan intereses de mora y afecta tu historial", "El crédito se cancela solo"], r: 1 },
];

document.addEventListener("DOMContentLoaded", () => {
    usuarioSesion = protegerSesion();
    if (!usuarioSesion) return;
    actualizarHeader("sesion");
    cargarPerfil();

    // Pestañas
    document.querySelectorAll(".tab-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
            document.querySelectorAll(".tab-content").forEach(t => t.classList.remove("active"));
            btn.classList.add("active");
            document.getElementById(`tab-${btn.dataset.tab}`).classList.add("active");
        });
    });

    document.getElementById("formPerfil").addEventListener("submit", guardarPerfil);
    document.getElementById("formPassword").addEventListener("submit", cambiarPassword);
    document.getElementById("formPrueba").addEventListener("submit", enviarPrueba);
});

async function cargarPerfil() {
    try {
        perfilActual = await peticion(`${API_URL}/perfil/${usuarioSesion.id}`);
    } catch (e) {
        perfilActual = usuarioSesion;
    }

    const original = localStorage.getItem("usuario");
    let sesion = JSON.parse(original);
    sesion.rol = perfilActual.rol || sesion.rol;
    sesion.nivel = perfilActual.nivel || sesion.nivel;
    sesion.nombre = perfilActual.nombre;
    sesion.apellido = perfilActual.apellido;
    localStorage.setItem("usuario", JSON.stringify(sesion));
    usuarioSesion = sesion;

    document.querySelector(".perfil-header h1").textContent = `${perfilActual.nombre} ${perfilActual.apellido}`.trim();
    document.querySelector(".perfil-header").innerHTML += `
        <span class="rol-badge">${textoRol(perfilActual.rol)}</span>
        <span class="nivel-badge">Nivel ${perfilActual.nivel || "básico"}</span>
    `;

    const solicitudes = perfilActual.solicitudes || [];
    const creditos = perfilActual.creditos || [];
    const notificaciones = perfilActual.notificaciones || [];
    const saldo = creditos.reduce((acc, c) => acc + (parseFloat(c.saldo_pendiente) || 0), 0);
    const sinLeer = notificaciones.filter(n => !n.leida).length;

    document.getElementById("statsGrid").innerHTML = `
        <div class="stat-card"><div class="stat-numero">${solicitudes.length}</div><div class="stat-label">Solicitudes</div></div>
        <div class="stat-card"><div class="stat-numero">${creditos.length}</div><div class="stat-label">Créditos</div></div>
        <div class="stat-card"><div class="stat-numero">${formatearMoneda(saldo)}</div><div class="stat-label">Saldo pendiente</div></div>
        <div class="stat-card"><div class="stat-numero">${sinLeer}</div><div class="stat-label">Notificaciones sin leer</div></div>
    `;

    renderSolicitudes(solicitudes);
    renderCreditos(creditos);
    renderNotificaciones(notificaciones);

    // Datos en formularios
    document.getElementById("nombre").value = perfilActual.nombre || "";
    document.getElementById("apellido").value = perfilActual.apellido || "";
    document.getElementById("telefono").value = perfilActual.telefono || "";
    document.getElementById("nivel").value = perfilActual.nivel || "basico";

    // Prueba virtual
    if (Number(perfilActual.prueba_virtual_completada) === 0) {
        document.getElementById("pruebaVirtualCard").style.display = "block";
        document.getElementById("preguntasPrueba").innerHTML = PREGUNTAS_PRUEBA.map((q, i) => `
            <div class="form-group">
                <label>${i + 1}. ${q.p}</label>
                ${q.o.map((op, j) => `
                    <label style="display:block; font-weight: normal;">
                        <input type="radio" name="prueba${i}" value="${j}" required> ${op}
                    </label>
                `).join("")}
            </div>
        `).join("");
    }
}

function renderSolicitudes(lista) {
    const cont = document.getElementById("listaSolicitudes");
    if (!lista.length) {
        cont.innerHTML = `<div class="sin-datos">Aún no has solicitado créditos. <a href="../solicitudes/solicitudes.html" style="color:#0d5fa8;">Solicitar ahora</a></div>`;
        return;
    }
    cont.innerHTML = lista.map(s => `
        <div class="item-card">
            <div class="item-info">
                <h4>Solicitud #${s.id_solicitud} ${badgeEstado(s.estado)}</h4>
                <p>${formatearFecha(s.fecha)}</p>
            </div>
            <strong>${formatearMoneda(s.monto)}</strong>
        </div>
    `).join("");
}

function renderCreditos(lista) {
    const cont = document.getElementById("listaCreditos");
    if (!lista.length) {
        cont.innerHTML = `<div class="sin-datos">No tienes créditos asignados aún.</div>`;
        return;
    }
    cont.innerHTML = lista.map(c => {
        const pct = c.cuotas_totales > 0 ? Math.round((c.cuotas_pagadas / c.cuotas_totales) * 100) : 0;
        const activo = parseFloat(c.saldo_pendiente) > 0;
        return `
            <div class="item-card">
                <div class="item-info">
                    <h4>Crédito #${c.id_credito} ${activo ? `<span class="badge estado-en_revision">En curso</span>` : `<span class="badge estado-aprobado">Paz y salvo</span>`}</h4>
                    <p>${c.cuotas_pagadas}/${c.cuotas_totales} cuotas pagadas &middot; tasa ${c.tasa_interes}%</p>
                    <div class="progreso"><div class="progreso-barra" style="width:${pct}%"></div></div>
                </div>
                <strong>${formatearMoneda(c.saldo_pendiente)}</strong>
            </div>
        `;
    }).join("");
}

function renderNotificaciones(lista) {
    const cont = document.getElementById("listaNotificaciones");
    if (!lista.length) {
        cont.innerHTML = `<div class="sin-datos">No tienes notificaciones.</div>`;
        return;
    }
    cont.innerHTML = lista.map(n => `
        <div class="item-card" style="${n.leida ? "opacity:0.65;" : ""}">
            <div class="item-info">
                <h4>${n.tipo} ${n.leida ? "" : `<span class="badge estado-pendiente">Nuevo</span>`}</h4>
                <p>${n.mensaje}</p>
                <small>${formatearFecha(n.fecha_envio)}</small>
            </div>
            ${n.leida ? "" : `<button class="btn btn-sm btn-primario" onclick="marcarLeida(${n.id_notificacion})">Marcar leída</button>`}
        </div>
    `).join("");
}

async function marcarLeida(id) {
    try {
        await peticion(`${API_URL}/notificaciones/${id}/leida`, {
            method: "PUT",
            body: JSON.stringify({ leida: 1 }),
        });
        cargarPerfil();
    } catch (e) {
        mostrarAlerta("alertaPerfil", e.message, "error");
    }
}

async function guardarPerfil(e) {
    e.preventDefault();
    const datos = {
        nombre: document.getElementById("nombre").value.trim(),
        apellido: document.getElementById("apellido").value.trim(),
        telefono: document.getElementById("telefono").value.trim(),
        nivel: document.getElementById("nivel").value,
    };
    try {
        await peticion(`${API_URL}/perfil/${usuarioSesion.id}`, {
            method: "PUT",
            body: JSON.stringify(datos),
        });
        mostrarAlerta("alertaPerfil", "Perfil actualizado", "exito");
        cargarPerfil();
    } catch (err) {
        mostrarAlerta("alertaPerfil", err.message, "error");
    }
}

async function cambiarPassword(e) {
    e.preventDefault();
    const datos = {
        contrasena_actual: document.getElementById("pwActual").value,
        contrasena_nueva: document.getElementById("pwNueva").value,
    };
    try {
        await peticion(`${API_URL}/perfil/${usuarioSesion.id}/password`, {
            method: "PUT",
            body: JSON.stringify(datos),
        });
        mostrarAlerta("alertaPassword", "Contraseña actualizada", "exito");
        e.target.reset();
    } catch (err) {
        mostrarAlerta("alertaPassword", err.message, "error");
    }
}

async function enviarPrueba(e) {
    e.preventDefault();
    let aciertos = 0;
    PREGUNTAS_PRUEBA.forEach((q, i) => {
        const seleccion = document.querySelector(`input[name="prueba${i}"]:checked`);
        if (seleccion && parseInt(seleccion.value, 10) === q.r) aciertos++;
    });
    const puntaje = (aciertos / PREGUNTAS_PRUEBA.length) * 100;
    try {
        const res = await peticion(`${API_URL}/prueba-virtual`, {
            method: "POST",
            body: JSON.stringify({ id_usuario: usuarioSesion.id, puntaje: puntaje }),
        });
        mostrarAlerta("alertaPrueba", `Puntaje ${puntaje}% — ${res.aprobada ? "¡Prueba aprobada!" : "No aprobada, intenta de nuevo."}`, res.aprobada ? "exito" : "error");
        if (res.aprobada) {
            setTimeout(() => cargarPerfil(), 1500);
        }
    } catch (err) {
        mostrarAlerta("alertaPrueba", err.message, "error");
    }
}