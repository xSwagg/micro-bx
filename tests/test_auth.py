import uuid


class TestAuth:
    def test_registro_exitoso(self, api, usuario_test):
        assert usuario_test["resp"].status_code == 200
        data = usuario_test["resp"].json()
        assert "id" in data
        assert data["message"] == "Usuario registrado exitosamente"

    def test_registro_correo_duplicado(self, api):
        payload = {
            "nombre": "Dup",
            "apellido": "Test",
            "cedula": "9999999000",
            "correo": "carlos.martinez@email.com",
            "contrasena": "123456",
        }
        resp = api.post("/api/registro", json=payload)
        assert resp.status_code == 400
        assert "registrados" in resp.json()["detail"].lower()

    def test_registro_cedula_duplicada(self, api):
        payload = {
            "nombre": "Dup",
            "apellido": "Test",
            "cedula": "1012345678",
            "correo": f"new_{uuid.uuid4().hex[:8]}@test.com",
            "contrasena": "123456",
        }
        resp = api.post("/api/registro", json=payload)
        assert resp.status_code == 400
        assert "registrados" in resp.json()["detail"].lower()

    def test_registro_crea_perfil(self, api, usuario_test):
        resp = api.get(f"/api/perfil/{usuario_test['id']}")
        assert resp.status_code == 200
        assert resp.json()["rol"] == "cliente"
        assert resp.json()["nivel"] == "basico"

    def test_registro_correo_invalido(self, api):
        payload = {
            "nombre": "Test",
            "apellido": "User",
            "cedula": "9999999111",
            "correo": "no-es-email",
            "contrasena": "123456",
        }
        resp = api.post("/api/registro", json=payload)
        assert resp.status_code == 422

    def test_registro_sin_contrasena_usar_default(self, api):
        payload = {
            "nombre": "Default",
            "apellido": "Pass",
            "cedula": uuid.uuid4().hex[:10],
            "correo": f"default_{uuid.uuid4().hex[:8]}@test.com",
        }
        resp = api.post("/api/registro", json=payload)
        assert resp.status_code == 200
        user_id = resp.json()["id"]
        login = api.post("/api/login", json={"correo": payload["correo"], "contrasena": "123456"})
        assert login.status_code == 200
        api.delete(f"/api/admin/usuarios/{user_id}")

    def test_login_exitoso(self, api, admin_demo):
        payload = {"correo": admin_demo["correo"], "contrasena": admin_demo["contrasena"]}
        resp = api.post("/api/login", json=payload)
        assert resp.status_code == 200
        data = resp.json()
        assert data["id"] == admin_demo["id"]
        assert "nombre" in data
        assert "correo" in data
        assert "rol" in data
        assert "nivel" in data

    def test_login_contrasena_incorrecta(self, api, admin_demo):
        payload = {"correo": admin_demo["correo"], "contrasena": "wrongpassword"}
        resp = api.post("/api/login", json=payload)
        assert resp.status_code == 401
        assert "credenciales incorrectas" in resp.json()["detail"].lower()

    def test_login_correo_inexistente(self, api):
        resp = api.post("/api/login", json={"correo": "noexiste@test.com", "contrasena": "123456"})
        assert resp.status_code == 401

    def test_login_rol_administrador(self, api, admin_demo):
        resp = api.post("/api/login", json={
            "correo": admin_demo["correo"], "contrasena": admin_demo["contrasena"]
        })
        assert resp.json()["rol"] == "administrador"

    def test_login_usuario_desactivado(self, api):
        resp = api.post("/api/login", json={"correo": "jorge.sanchez@email.com", "contrasena": "123456"})
        assert resp.status_code == 403
        assert "desactivado" in resp.json()["detail"].lower()