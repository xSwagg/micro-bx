class TestNotificaciones:
    def test_listar_notificaciones(self, api, admin_demo):
        resp = api.get(f"/api/notificaciones/{admin_demo['id']}")
        assert resp.status_code == 200
        notifs = resp.json()
        assert isinstance(notifs, list)
        assert len(notifs) > 0
        assert "id_notificacion" in notifs[0]
        assert "tipo" in notifs[0]
        assert "mensaje" in notifs[0]
        assert "leida" in notifs[0]

    def test_marcar_notificacion_leida(self, api, admin_demo):
        notif_id = api.get(f"/api/notificaciones/{admin_demo['id']}").json()[0]["id_notificacion"]
        resp = api.put(f"/api/notificaciones/{notif_id}/leida", json={"leida": 1})
        assert resp.status_code == 200
        assert "actualizada" in resp.json()["message"].lower()

        leida = api.get(f"/api/notificaciones/{admin_demo['id']}").json()[0]["leida"]
        assert leida == 1

    def test_marcar_notificacion_no_leida(self, api, admin_demo):
        notif_id = api.get(f"/api/notificaciones/{admin_demo['id']}").json()[0]["id_notificacion"]
        resp = api.put(f"/api/notificaciones/{notif_id}/leida", json={"leida": 0})
        assert resp.status_code == 200
        leida = api.get(f"/api/notificaciones/{admin_demo['id']}").json()[0]["leida"]
        assert leida == 0

    def test_notificacion_nueva_cotiene_tipo(self, api, usuario_test):
        api.post("/api/solicitudes", json={"correo": usuario_test["correo"], "monto": 500000})
        notifs = api.get(f"/api/notificaciones/{usuario_test['id']}").json()
        assert any(n["tipo"] == "solicitud_creada" for n in notifs)

    def test_usuario_sin_notificaciones(self, api, usuario_test):
        resp = api.get(f"/api/notificaciones/{usuario_test['id']}")
        assert resp.status_code == 200
        assert resp.json() == []