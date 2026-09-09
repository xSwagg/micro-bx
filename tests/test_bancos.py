class TestBancos:
    def test_listar_bancos(self, api):
        resp = api.get("/api/bancos")
        assert resp.status_code == 200
        bancos = resp.json()
        assert isinstance(bancos, list)
        assert len(bancos) >= 7
        assert "id_banco" in bancos[0]
        assert "nombre_banco" in bancos[0]
        assert "respuesta" in bancos[0]

    def test_obtener_banco(self, api):
        resp = api.get("/api/bancos/1")
        assert resp.status_code == 200
        data = resp.json()
        assert "nombre_banco" in data
        assert "respuesta" in data

    def test_banco_no_existente(self, api):
        resp = api.get("/api/bancos/9999")
        assert resp.status_code == 404

    def test_crear_banco(self, api):
        resp = api.post(
            "/api/admin/bancos",
            json={"nombre_banco": "Banco Test", "respuesta": "pendiente", "observaciones": ""},
        )
        assert resp.status_code == 200
        banco_id = resp.json()["id"]
        assert api.get(f"/api/bancos/{banco_id}").json()["nombre_banco"] == "Banco Test"
        api.delete(f"/api/admin/bancos/{banco_id}")

    def test_actualizar_banco(self, api):
        r = api.post("/api/admin/bancos", json={"nombre_banco": "Banco Update"})
        banco_id = r.json()["id"]

        resp = api.put(
            f"/api/admin/bancos/{banco_id}",
            json={"nombre_banco": "Banco Actualizado", "respuesta": "aprobado"},
        )
        assert resp.status_code == 200
        assert "actualizada" in resp.json()["message"].lower()

        data = api.get(f"/api/bancos/{banco_id}").json()
        assert data["nombre_banco"] == "Banco Actualizado"
        assert data["respuesta"] == "aprobado"
        assert data["fecha_respuesta"] is not None

        api.delete(f"/api/admin/bancos/{banco_id}")

    def test_eliminar_banco(self, api):
        r = api.post("/api/admin/bancos", json={"nombre_banco": "Banco Delete"})
        banco_id = r.json()["id"]

        resp = api.delete(f"/api/admin/bancos/{banco_id}")
        assert resp.status_code == 200
        assert "eliminada" in resp.json()["message"].lower()
        assert api.get(f"/api/bancos/{banco_id}").status_code == 404

    def test_actualizar_banco_no_existente(self, api):
        resp = api.put("/api/admin/bancos/9999", json={"nombre_banco": "No existe"})
        assert resp.status_code == 404