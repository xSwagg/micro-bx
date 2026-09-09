class TestPagos:
    def test_listar_pagos(self, api):
        resp = api.get("/api/pagos")
        assert resp.status_code == 200
        pagos = resp.json()
        assert isinstance(pagos, list)
        assert len(pagos) >= 1
        assert "id_pago" in pagos[0]
        assert "monto_pago" in pagos[0]
        assert "correo" in pagos[0]

    def test_registrar_pago(self, api, credito_test):
        resp = api.post(
            "/api/pagos",
            json={"correo": credito_test["usuario"]["correo"], "monto": 200000, "id_metodo": 1},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert float(data["saldo_restante"]) == 300000.0
        assert "Pago de" in data["message"]
        assert "registrado" in data["message"]

        cred = api.get(f"/api/creditos/{credito_test['id_credito']}").json()
        assert float(cred["saldo_pendiente"]) == 300000.0
        assert cred["cuotas_pagadas"] == 1
        assert len(cred["pagos"]) == 1

    def test_pago_monto_cero(self, api, credito_test):
        resp = api.post("/api/pagos", json={"correo": credito_test["usuario"]["correo"], "monto": 0})
        assert resp.status_code == 400
        assert "mayor a cero" in resp.json()["detail"].lower()

    def test_pago_monto_negativo(self, api, credito_test):
        resp = api.post("/api/pagos", json={"correo": credito_test["usuario"]["correo"], "monto": -500})
        assert resp.status_code == 400

    def test_pago_crea_notificacion(self, api, credito_test):
        api.post("/api/pagos", json={"correo": credito_test["usuario"]["correo"], "monto": 100000})
        notifs = api.get(f"/api/notificaciones/{credito_test['usuario']['id']}").json()
        assert any(n["tipo"] == "pago_recibido" for n in notifs)

    def test_pago_sin_creditos(self, api, usuario_test):
        resp = api.post("/api/pagos", json={"correo": usuario_test["correo"], "monto": 100000})
        assert resp.status_code == 404
        assert "No tienes créditos activos" in resp.json()["detail"]

    def test_pago_saldo_total_desactiva_usuario(self, api, credito_test):
        resp = api.post(
            "/api/pagos",
            json={"correo": credito_test["usuario"]["correo"], "monto": credito_test["saldo"]},
        )
        assert resp.status_code == 200
        assert float(resp.json()["saldo_restante"]) == 0.0

        cred = api.get(f"/api/creditos/{credito_test['id_credito']}").json()
        assert float(cred["saldo_pendiente"]) == 0.0

        login = api.post("/api/login", json={
            "correo": credito_test["usuario"]["correo"], "contrasena": "123456"
        })
        assert login.status_code == 403

    def test_pago_monto_mayor_a_saldo(self, api, credito_test):
        resp = api.post(
            "/api/pagos",
            json={"correo": credito_test["usuario"]["correo"], "monto": credito_test["saldo"] + 1000},
        )
        assert resp.status_code == 200
        assert float(resp.json()["saldo_restante"]) == 0.0