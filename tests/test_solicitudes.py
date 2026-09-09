class TestSolicitudes:
    def test_listar_solicitudes(self, api):
        resp = api.get("/api/solicitudes")
        assert resp.status_code == 200
        solicitudes = resp.json()
        assert isinstance(solicitudes, list)
        assert len(solicitudes) >= 7
        first = solicitudes[0]
        assert "id_solicitud" in first
        assert "monto" in first
        assert "estado" in first
        assert "correo" in first
        assert "nombre" in first

    def test_listar_solicitudes_por_estado(self, api):
        resp = api.get("/api/solicitudes", params={"estado": "pendiente"})
        assert resp.status_code == 200
        pendientes = resp.json()
        assert isinstance(pendientes, list)
        assert len(pendientes) >= 3
        assert all(s["estado"] == "pendiente" for s in pendientes)

    def test_listar_solicitudes_todas(self, api):
        todas = api.get("/api/solicitudes", params={"estado": "todas"}).json()
        normales = api.get("/api/solicitudes").json()
        assert len(todas) == len(normales)

    def test_crear_solicitud(self, api, usuario_test):
        resp = api.post("/api/solicitudes", json={"correo": usuario_test["correo"], "monto": 1000000})
        assert resp.status_code == 200
        data = resp.json()
        assert "id_solicitud" in data
        assert data["estado"] == "pendiente"

    def test_crear_solicitud_usuario_inexistente(self, api):
        resp = api.post("/api/solicitudes", json={"correo": "noexiste@test.com", "monto": 500000})
        assert resp.status_code == 404

    def test_crear_solicitud_genera_notificacion(self, api, usuario_test):
        api.post("/api/solicitudes", json={"correo": usuario_test["correo"], "monto": 500000})
        notifs = api.get(f"/api/notificaciones/{usuario_test['id']}").json()
        assert any(n["tipo"] == "solicitud_creada" for n in notifs)

    def test_obtener_solicitud(self, api, usuario_test):
        r = api.post("/api/solicitudes", json={"correo": usuario_test["correo"], "monto": 500000})
        sid = r.json()["id_solicitud"]
        resp = api.get(f"/api/solicitudes/{sid}")
        assert resp.status_code == 200
        data = resp.json()
        assert data["id_solicitud"] == sid
        assert data["estado"] == "pendiente"
        assert "credito" in data
        assert "nombre_banco" in data or "id_banco" in data

    def test_solicitud_no_existente(self, api):
        resp = api.get("/api/solicitudes/9999")
        assert resp.status_code == 404

    def test_solicitud_contiene_log(self, api, usuario_test):
        r = api.post("/api/solicitudes", json={"correo": usuario_test["correo"], "monto": 500000})
        sid = r.json()["id_solicitud"]
        resp = api.get(f"/api/solicitudes/{sid}/log")
        assert resp.status_code == 200
        log = resp.json()
        assert isinstance(log, list)
        assert len(log) >= 1
        assert log[0]["estado_nuevo"] == "pendiente"
        assert "estado_anterior" in log[0]

    def test_solicitudes_por_usuario(self, api, usuario_test):
        api.post("/api/solicitudes", json={"correo": usuario_test["correo"], "monto": 200000})
        resp = api.get(f"/api/usuario/{usuario_test['id']}/solicitudes")
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)
        assert len(resp.json()) == 1

    def test_pasar_solicitud_revision(self, api, usuario_test):
        r = api.post("/api/solicitudes", json={"correo": usuario_test["correo"], "monto": 500000})
        sid = r.json()["id_solicitud"]
        resp = api.put(f"/api/admin/solicitudes/{sid}/revision", json={"estado": "en_revision"})
        assert resp.status_code == 200
        assert resp.json()["message"] == "Solicitud en revisión"
        assert api.get(f"/api/solicitudes/{sid}").json()["estado"] == "en_revision"

    def test_revision_solicitud_inexistente(self, api):
        resp = api.put("/api/admin/solicitudes/9999/revision", json={"estado": "en_revision"})
        assert resp.status_code == 404

    def test_aprobar_solicitud(self, api, usuario_test):
        r = api.post("/api/solicitudes", json={"correo": usuario_test["correo"], "monto": 600000})
        sid = r.json()["id_solicitud"]
        resp = api.put(
            f"/api/admin/solicitudes/{sid}/aprobar",
            json={"monto_aprobado": 400000, "tasa_interes": 2.0, "plazo": 6},
        )
        assert resp.status_code == 200
        data = api.get(f"/api/solicitudes/{sid}").json()
        assert data["estado"] == "aprobado"
        assert len(data["credito"]) == 1
        assert float(data["credito"][0]["saldo_pendiente"]) == 400000.0

    def test_aprobar_doble(self, api, usuario_test):
        r = api.post("/api/solicitudes", json={"correo": usuario_test["correo"], "monto": 500000})
        sid = r.json()["id_solicitud"]
        api.put(
            f"/api/admin/solicitudes/{sid}/aprobar",
            json={"monto_aprobado": 500000, "tasa_interes": 2.5, "plazo": 12},
        )
        resp = api.put(
            f"/api/admin/solicitudes/{sid}/aprobar",
            json={"monto_aprobado": 500000, "tasa_interes": 2.5, "plazo": 12},
        )
        assert resp.status_code == 400
        assert "ya está aprobada" in resp.json()["detail"].lower()

    def test_aprobar_solicitud_inexistente(self, api):
        resp = api.put(
            "/api/admin/solicitudes/9999/aprobar",
            json={"monto_aprobado": 500000, "tasa_interes": 2.5, "plazo": 12},
        )
        assert resp.status_code == 404

    def test_aprobar_notifica_usuario(self, api, usuario_test):
        r = api.post("/api/solicitudes", json={"correo": usuario_test["correo"], "monto": 500000})
        sid = r.json()["id_solicitud"]
        api.put(
            f"/api/admin/solicitudes/{sid}/aprobar",
            json={"monto_aprobado": 500000, "tasa_interes": 2.5, "plazo": 12},
        )
        notifs = api.get(f"/api/notificaciones/{usuario_test['id']}").json()
        assert any(n["tipo"] == "aprobacion" for n in notifs)

    def test_rechazar_solicitud(self, api, usuario_test):
        r = api.post("/api/solicitudes", json={"correo": usuario_test["correo"], "monto": 300000})
        sid = r.json()["id_solicitud"]
        resp = api.put(f"/api/admin/solicitudes/{sid}/rechazar")
        assert resp.status_code == 200
        assert resp.json()["message"] == "Solicitud rechazada"
        assert api.get(f"/api/solicitudes/{sid}").json()["estado"] == "rechazado"

    def test_rechazar_doble(self, api, usuario_test):
        r = api.post("/api/solicitudes", json={"correo": usuario_test["correo"], "monto": 300000})
        sid = r.json()["id_solicitud"]
        api.put(f"/api/admin/solicitudes/{sid}/rechazar")
        resp = api.put(f"/api/admin/solicitudes/{sid}/rechazar")
        assert resp.status_code == 400
        assert "ya está rechazada" in resp.json()["detail"].lower()

    def test_revision_solicitud_resuelta(self, api, usuario_test):
        r = api.post("/api/solicitudes", json={"correo": usuario_test["correo"], "monto": 300000})
        sid = r.json()["id_solicitud"]
        api.put(f"/api/admin/solicitudes/{sid}/rechazar")
        resp = api.put(f"/api/admin/solicitudes/{sid}/revision", json={"estado": "en_revision"})
        assert resp.status_code == 400
        assert "resuelta" in resp.json()["detail"].lower()