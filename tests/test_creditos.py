class TestCreditos:
    def test_listar_creditos(self, api):
        resp = api.get("/api/creditos")
        assert resp.status_code == 200
        creditos = resp.json()
        assert isinstance(creditos, list)
        assert len(creditos) >= 7
        assert "id_credito" in creditos[0]
        assert "saldo_pendiente" in creditos[0]
        assert "correo" in creditos[0]

    def test_obtener_credito(self, api, credito_test):
        resp = api.get(f"/api/creditos/{credito_test['id_credito']}")
        assert resp.status_code == 200
        data = resp.json()
        assert data["id_credito"] == credito_test["id_credito"]
        assert "pagos" in data
        assert float(data["saldo_pendiente"]) == credito_test["saldo"]
        assert data["cuotas_pagadas"] == 0

    def test_credito_no_existente(self, api):
        resp = api.get("/api/creditos/9999")
        assert resp.status_code == 404

    def test_creditos_por_usuario(self, api, credito_test):
        resp = api.get(f"/api/creditos/usuario/{credito_test['usuario']['id']}")
        assert resp.status_code == 200
        creditos = resp.json()
        assert isinstance(creditos, list)
        assert len(creditos) == 1

    def test_creditos_por_usuario_activos(self, api, credito_test):
        resp = api.get(
            f"/api/creditos/usuario/{credito_test['usuario']['id']}", params={"activo": 1}
        )
        assert resp.status_code == 200
        assert len(resp.json()) == 1

    def test_creditos_usuario_sin_datos(self, api, usuario_test):
        resp = api.get(f"/api/creditos/usuario/{usuario_test['id']}")
        assert resp.status_code == 200
        assert resp.json() == []

    def test_pagos_de_credito(self, api, credito_test):
        resp = api.get(f"/api/creditos/{credito_test['id_credito']}/pagos")
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)

    def test_credito_incluye_solicitud(self, api, credito_test):
        data = api.get(f"/api/creditos/{credito_test['id_credito']}").json()
        assert data["id_solicitud"] == credito_test["id_solicitud"]
        assert "monto_aprobado" in data
        assert "tasa_interes" in data
        assert "plazo" in data