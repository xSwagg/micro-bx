/* Registro de usuarios */
document.addEventListener("DOMContentLoaded", () => {
    actualizarHeader("sesion");

    document.getElementById("formRegistro").addEventListener("submit", async (e) => {
        e.preventDefault();
        const datos = {
            nombre: document.getElementById("nombre").value.trim(),
            apellido: document.getElementById("apellido").value.trim(),
            cedula: document.getElementById("cedula").value.trim(),
            correo: document.getElementById("correo").value.trim(),
            contrasena: document.getElementById("contrasena").value,
            telefono: document.getElementById("telefono").value.trim(),
        };

        try {
            const res = await peticion(`${API_URL}/registro`, {
                method: "POST",
                body: JSON.stringify(datos),
            });
            mostrarAlerta("alertaRegistro", res.message || "Registro exitoso", "exito");
            setTimeout(() => {
                window.location.href = "../sesion/iniciarSesion.html";
            }, 1500);
        } catch (err) {
            mostrarAlerta("alertaRegistro", err.message || "No se pudo registrar", "error");
        }
    });
});