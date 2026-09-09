/* Entidades bancarias */
document.addEventListener("DOMContentLoaded", () => {
    actualizarHeader("bancos");
    const usuario = obtenerUsuario();
    if (usuario && usuario.rol === "administrador") {
        document.getElementById("panelAdmin").style.display = "block";
    }
    document.getElementById("formBanco").addEventListener("submit", guardarBanco);
    cargarBancos();
});

function cerrarModal(id) {
    document.getElementById(id).classList.remove("abierto");
}

function abrirModal(id) {
    document.getElementById(id).classList.add("abierto");
}

async function cargarBancos() {
    const cont = document.getElementById("listaBancos");
    cont.innerHTML = "Cargando...";
    try {
        const lista = await peticion(`${API_URL}/bancos`);
        if (!lista.length) {
            cont.innerHTML = "No hay entidades bancarias registradas.";
            return;
        }
        const usuario = obtenerUsuario();
        const esAdmin = usuario && usuario.rol === "administrador";

        cont.innerHTML = `
            <table class="tabla">
                <thead>
                    <tr>
                        <th>Entidad</th><th>Respuesta</th><th>Fecha respuesta</th><th>Observaciones</th>${esAdmin ? "<th>Acciones</th>" : ""}
                    </tr>
                </thead>
                <tbody>
                    ${lista.map(b => `
                        <tr>
                            <td>${b.nombre_banco}</td>
                            <td>${badgeBanco(b.respuesta)}</td>
                            <td>${formatearFecha(b.fecha_respuesta)}</td>
                            <td>${b.observaciones || "-"}</td>
                            ${esAdmin ? `
                                <td style="display:flex; gap:6px;">
                                    <button class="btn btn-sm btn-primario" onclick="editarBanco(${b.id_banco})">Editar</button>
                                    <button class="btn btn-sm btn-danger" onclick="eliminarBanco(${b.id_banco})">Eliminar</button>
                                </td>
                            ` : ""}
                        </tr>
                    `).join("")}
                </tbody>
            </table>
        `;
    } catch (e) {
        cont.innerHTML = "No se pudieron cargar las entidades bancarias.";
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
        mostrarAlerta("alertaBancos", e.message, "error");
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
        mostrarAlerta("alertaBancos", e.message, "error");
    }
}