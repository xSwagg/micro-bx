/* Iniciar sesión */
document.addEventListener("DOMContentLoaded", () => {
    actualizarHeader("sesion");

    if (obtenerUsuario()) {
        window.location.href = "../main/index.html";
        return;
    }

    document.getElementById("formLogin").addEventListener("submit", async (e) => {
        e.preventDefault();
        const correo = document.getElementById("correo").value.trim();
        const contrasena = document.getElementById("contrasena").value;

        try {
            const usuario = await peticion(`${API_URL}/login`, {
                method: "POST",
                body: JSON.stringify({ correo, contrasena }),
            });
            localStorage.setItem("usuario", JSON.stringify(usuario));
            if (usuario.rol === "administrador") {
                window.location.href = "../admin/index.html";
            } else {
                window.location.href = "../main/index.html";
            }
        } catch (err) {
            mostrarAlerta("alertaLogin", err.message || "No se pudo iniciar sesión", "error");
        }
    });
});