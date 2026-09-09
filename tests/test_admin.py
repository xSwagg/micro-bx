class TestAdminUsuarios:
    def test_listar_usuarios(self, api):
        resp = api.get("/api/admin/usuarios")
        assert resp.status_code == 200
        usuarios = resp.json()
        assert isinstance(usuarios, list)
        assert len(usuarios) >= 10
        assert "id_usuario" in usuarios[0]
        assert "rol" in usuarios[0]
        assert "correo" in usuarios[0]

    def test_cambiar_rol(self, api, usuario_test):
        resp = api.put(
            f"/api/admin/usuarios/{usuario_test['id']}/rol", params={"rol": "asesor"}
        )
        assert resp.status_code == 200
        assert "actualizado" in resp.json()["message"].lower()
        assert api.get(f"/api/perfil/{usuario_test['id']}").json()["rol"] == "asesor"

        api.put(f"/api/admin/usuarios/{usuario_test['id']}/rol", params={"rol": "cliente"})

    def test_cambiar_rol_invalido(self, api, usuario_test):
        resp = api.put(
            f"/api/admin/usuarios/{usuario_test['id']}/rol", params={"rol": "superadmin"}
        )
        assert resp.status_code == 400
        assert "Rol inválido" in resp.json()["detail"]

    def test_cambiar_rol_usuario_no_existente(self, api):
        resp = api.put("/api/admin/usuarios/9999/rol", params={"rol": "asesor"})
        assert resp.status_code == 404

    def test_actualizar_usuario_admin(self, api, usuario_test):
        resp = api.put(
            f"/api/admin/usuarios/{usuario_test['id']}",
            json={"nombre": "Admin Editado", "telefono": "3000000111", "nivel": "avanzado"},
        )
        assert resp.status_code == 200
        assert "actualizado" in resp.json()["message"].lower()

        perfil = api.get(f"/api/perfil/{usuario_test['id']}").json()
        assert perfil["nombre"] == "Admin Editado"
        assert perfil["nivel"] == "avanzado"

    def test_actualizar_usuario_admin_rol(self, api, usuario_test):
        api.put(
            f"/api/admin/usuarios/{usuario_test['id']}",
            json={"rol": "asesor"},
        )
        assert api.get(f"/api/perfil/{usuario_test['id']}").json()["rol"] == "asesor"

    def test_actualizar_usuario_admin_correo_duplicado(self, api, usuario_test):
        resp = api.put(
            f"/api/admin/usuarios/{usuario_test['id']}",
            json={"correo": "carlos.martinez@email.com"},
        )
        assert resp.status_code == 400
        assert "ya registrado" in resp.json()["detail"].lower()

    def test_actualizar_usuario_admin_cedula_duplicada(self, api, usuario_test):
        resp = api.put(
            f"/api/admin/usuarios/{usuario_test['id']}",
            json={"cedula": "1012345678"},
        )
        assert resp.status_code == 400

    def test_actualizar_usuario_admin_no_existente(self, api):
        resp = api.put("/api/admin/usuarios/9999", json={"nombre": "No existe"})
        assert resp.status_code == 404

    def test_desactivar_usuario(self, api, usuario_test):
        resp = api.delete(f"/api/admin/usuarios/{usuario_test['id']}")
        assert resp.status_code == 200
        assert "desactivado" in resp.json()["message"].lower()

        login = api.post("/api/login", json={
            "correo": usuario_test["correo"], "contrasena": "123456"
        })
        assert login.status_code == 403


class TestAdminCreditos:
    def test_crear_credito(self, api, usuario_test):
        r = api.post("/api/solicitudes", json={"correo": usuario_test["correo"], "monto": 500000})
        sol_id = r.json()["id_solicitud"]

        resp = api.post("/api/admin/creditos", json={
            "id_solicitud": sol_id,
            "monto_aprobado": 450000,
            "tasa_interes": 2.0,
            "plazo": 6,
        })
        assert resp.status_code == 200
        cred_id = resp.json()["id"]

        cred = api.get(f"/api/creditos/{cred_id}").json()
        assert float(cred["saldo_pendiente"]) == 450000.0
        assert api.get(f"/api/solicitudes/{sol_id}").json()["estado"] == "aprobado"

        api.delete(f"/api/admin/creditos/{cred_id}")

    def test_crear_credito_solicitud_inexistente(self, api):
        resp = api.post("/api/admin/creditos", json={
            "id_solicitud": 9999,
            "monto_aprobado": 100000,
            "tasa_interes": 2.5,
            "plazo": 12,
        })
        assert resp.status_code == 404

    def test_actualizar_credito(self, api, credito_test):
        resp = api.put(
            f"/api/admin/creditos/{credito_test['id_credito']}",
            json={"saldo_pendiente": 123456.78, "cuotas_pagadas": 2},
        )
        assert resp.status_code == 200
        assert "actualizado" in resp.json()["message"].lower()

        cred = api.get(f"/api/creditos/{credito_test['id_credito']}").json()
        assert float(cred["saldo_pendiente"]) == 123456.78
        assert cred["cuotas_pagadas"] == 2

    def test_actualizar_credito_no_existente(self, api):
        resp = api.put("/api/admin/creditos/9999", json={"saldo_pendiente": 1000})
        assert resp.status_code == 404

    def test_eliminar_credito(self, api, credito_test):
        resp = api.delete(f"/api/admin/creditos/{credito_test['id_credito']}")
        assert resp.status_code == 200
        assert "eliminado" in resp.json()["message"].lower()
        assert api.get(f"/api/creditos/{credito_test['id_credito']}").status_code == 404