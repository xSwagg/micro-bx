class TestPruebaVirtual:
    def test_registrar_prueba_aprobada(self, api, usuario_test):
        resp = api.post("/api/prueba-virtual", json={"id_usuario": usuario_test["id"], "puntaje": 85})
        assert resp.status_code == 200
        data = resp.json()
        assert data["aprobada"] is True

    def test_registrar_prueba_reprobada(self, api, usuario_test):
        resp = api.post("/api/prueba-virtual", json={"id_usuario": usuario_test["id"], "puntaje": 40})
        assert resp.status_code == 200
        assert resp.json()["aprobada"] is False

    def test_registrar_prueba_frontera(self, api, usuario_test):
        r1 = api.post("/api/prueba-virtual", json={"id_usuario": usuario_test["id"], "puntaje": 59.9})
        assert r1.json()["aprobada"] is False

        r2 = api.post("/api/prueba-virtual", json={"id_usuario": usuario_test["id"], "puntaje": 60})
        assert r2.json()["aprobada"] is True

    def test_registrar_prueba_usuario_inexistente(self, api):
        resp = api.post("/api/prueba-virtual", json={"id_usuario": 9999, "puntaje": 80})
        assert resp.status_code == 404

    def test_obtener_pruebas(self, api, usuario_test):
        api.post("/api/prueba-virtual", json={"id_usuario": usuario_test["id"], "puntaje": 75})
        resp = api.get(f"/api/prueba-virtual/{usuario_test['id']}")
        assert resp.status_code == 200
        pruebas = resp.json()
        assert isinstance(pruebas, list)
        assert len(pruebas) == 1
        assert "puntaje" in pruebas[0]
        assert "aprobada" in pruebas[0]

    def test_usuario_sin_pruebas(self, api, usuario_test):
        resp = api.get(f"/api/prueba-virtual/{usuario_test['id']}")
        assert resp.status_code == 200
        assert resp.json() == []

    def test_prueba_aprobada_marca_usuario(self, api, usuario_test):
        api.post("/api/prueba-virtual", json={"id_usuario": usuario_test["id"], "puntaje": 70})
        perfil = api.get(f"/api/perfil/{usuario_test['id']}").json()
        assert perfil["prueba_virtual_completada"] == 1

    def test_prueba_reprobada_no_marca_usuario(self, api, usuario_test):
        api.post("/api/prueba-virtual", json={"id_usuario": usuario_test["id"], "puntaje": 30})
        perfil = api.get(f"/api/perfil/{usuario_test['id']}").json()
        assert perfil["prueba_virtual_completada"] == 0