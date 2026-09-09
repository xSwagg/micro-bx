import uuid


class TestLegacy:
    """Endpoints legacy que consume index.html (se preservan durante la migración)."""

    def test_registrar_legacy(self, api):
        payload = {
            "nombre": "Legacy",
            "apellido": "User",
            "cedula": uuid.uuid4().hex[:10],
            "correo": f"legacy_{uuid.uuid4().hex[:8]}@test.com",
            "contrasena": "123456",
            "telefono": "3000000000",
        }
        resp = api.post("/registrar", json=payload)
        assert resp.status_code == 200
        assert "id" in resp.json()

    def test_solicitar_legacy(self, api, usuario_test):
        resp = api.post("/solicitar", json={"correo": usuario_test["correo"], "monto": 250000})
        assert resp.status_code == 200
        assert "id_solicitud" in resp.json()

    def test_ver_solicitudes_legacy(self, api, cliente_demo):
        resp = api.get(f"/solicitudes/{cliente_demo['correo']}")
        assert resp.status_code == 200
        data = resp.json()
        assert "solicitudes" in data
        assert isinstance(data["solicitudes"], list)

    def test_ver_credito_legacy(self, api, credito_test):
        resp = api.get(f"/credito/{credito_test['usuario']['correo']}")
        assert resp.status_code == 200
        data = resp.json()
        assert "monto_aprobado" in data
        assert "saldo_pendiente" in data

    def test_ver_credito_legacy_sin_credito(self, api, cliente_demo):
        resp = api.get(f"/credito/{cliente_demo['correo']}")
        assert resp.status_code == 200
        assert "mensaje" in resp.json()

    def test_pagar_legacy(self, api, credito_test):
        resp = api.post("/pagar", json={"correo": credito_test["usuario"]["correo"], "monto": 100000})
        assert resp.status_code == 200
        assert "saldo_restante" in resp.json()