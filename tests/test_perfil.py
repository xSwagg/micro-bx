class TestPerfil:
    def test_obtener_perfil(self, api, admin_demo):
        resp = api.get(f"/api/perfil/{admin_demo['id']}")
        assert resp.status_code == 200
        data = resp.json()
        assert "nombre" in data
        assert "apellido" in data
        assert "correo" in data
        assert "cedula" in data
        assert "telefono" in data
        assert "rol" in data
        assert "nivel" in data
        assert "foto" in data
        assert "solicitudes" in data
        assert "creditos" in data
        assert "notificaciones" in data

    def test_perfil_no_existente(self, api):
        resp = api.get("/api/perfil/9999")
        assert resp.status_code == 404

    def test_actualizar_perfil(self, api, usuario_test):
        resp = api.put(
            f"/api/perfil/{usuario_test['id']}",
            json={"nombre": "Nombre Actualizado", "telefono": "3216549870"},
        )
        assert resp.status_code == 200
        assert "actualizado" in resp.json()["message"].lower()

        resp_perfil = api.get(f"/api/perfil/{usuario_test['id']}")
        assert resp_perfil.json()["nombre"] == "Nombre Actualizado"
        assert resp_perfil.json()["telefono"] == "3216549870"

    def test_actualizar_nivel(self, api, usuario_test):
        resp = api.put(f"/api/perfil/{usuario_test['id']}", json={"nivel": "avanzado"})
        assert resp.status_code == 200
        assert api.get(f"/api/perfil/{usuario_test['id']}").json()["nivel"] == "avanzado"

    def test_cambiar_password(self, api, usuario_test):
        resp = api.put(
            f"/api/perfil/{usuario_test['id']}/password",
            json={"contrasena_actual": "123456", "contrasena_nueva": "654321"},
        )
        assert resp.status_code == 200
        assert "actualizada" in resp.json()["message"].lower()

        login = api.post("/api/login", json={"correo": usuario_test["correo"], "contrasena": "654321"})
        assert login.status_code == 200

        api.put(
            f"/api/perfil/{usuario_test['id']}/password",
            json={"contrasena_actual": "654321", "contrasena_nueva": "123456"},
        )

    def test_cambiar_password_incorrecta(self, api, usuario_test):
        resp = api.put(
            f"/api/perfil/{usuario_test['id']}/password",
            json={"contrasena_actual": "wrongpass", "contrasena_nueva": "123456"},
        )
        assert resp.status_code == 401
        assert "incorrecta" in resp.json()["detail"].lower()

    def test_perfil_contiene_solicitudes(self, api, admin_demo):
        resp = api.get(f"/api/perfil/{admin_demo['id']}")
        assert isinstance(resp.json()["solicitudes"], list)

    def test_perfil_contiene_creditos(self, api, admin_demo):
        resp = api.get(f"/api/perfil/{admin_demo['id']}")
        assert isinstance(resp.json()["creditos"], list)

    def test_perfil_contiene_notificaciones(self, api, admin_demo):
        resp = api.get(f"/api/perfil/{admin_demo['id']}")
        assert isinstance(resp.json()["notificaciones"], list)

    def test_perfil_contiene_foto(self, api, admin_demo):
        resp = api.get(f"/api/perfil/{admin_demo['id']}")
        assert "foto" in resp.json()

    def test_actualizar_foto_perfil(self, api, usuario_test):
        resp = api.put(
            f"/api/perfil/{usuario_test['id']}",
            json={"nombre": "Test User", "foto": "mi_avatar.png"},
        )
        assert resp.status_code == 200
        resp_perfil = api.get(f"/api/perfil/{usuario_test['id']}")
        assert resp_perfil.json()["foto"] == "mi_avatar.png"

    def test_cliente_sin_creditos(self, api, cliente_demo):
        resp = api.get(f"/api/perfil/{cliente_demo['id']}")
        assert resp.status_code == 200
        assert resp.json()["creditos"] == []