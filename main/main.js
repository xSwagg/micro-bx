/* Portada de MicrocreditosBX */
document.addEventListener("DOMContentLoaded", () => {
    actualizarHeader("inicio");
    cargarResumen();
    cargarRecientes();
});

async function cargarResumen() {
    const statsEl = document.getElementById("statsContainer");
    try {
        const [solicitudes, creditos, bancos] = await Promise.all([
            peticion(`${API_URL}/solicitudes`),
            peticion(`${API_URL}/creditos`),
            peticion(`${API_URL}/bancos`),
        ]);

        const aprobadas = solicitudes.filter(s => s.estado === "aprobado").length;

        statsEl.innerHTML = `
            <div class="stats-item"><strong>${creditos.length}</strong> Créditos aprobados</div>
            <div class="stats-item"><strong>${aprobadas}</strong> Solicitudes aprobadas</div>
            <div class="stats-item"><strong>${bancos.length}</strong> Entidades aliadas</div>
        `;
    } catch (e) {
        statsEl.innerHTML = `
            <div class="stats-item">No se pudieron cargar las estadísticas.</div>
        `;
    }
}

async function cargarRecientes() {
    const cont = document.getElementById("recientes");
    try {
        const solicitudes = await peticion(`${API_URL}/solicitudes`);
        const recientes = solicitudes.slice(0, 5);
        if (!recientes.length) {
            cont.innerHTML = "Aún no hay solicitudes registradas.";
            return;
        }
        cont.innerHTML = recientes.map(s => `
            <div class="item-card">
                <div class="item-info">
                    <h4>${s.nombre} ${s.apellido} <span class="badge estado-${s.estado}">${textoEstado(s.estado)}</span></h4>
                    <p>${s.nombre_banco ? s.nombre_banco : "Entidad no asignada"} &middot; ${formatearFecha(s.fecha)}</p>
                </div>
                <strong>${formatearMoneda(s.monto)}</strong>
            </div>
        `).join("");
    } catch (e) {
        cont.innerHTML = "No se pudieron cargar las solicitudes recientes.";
    }
}