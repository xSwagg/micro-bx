import sys
import os
import subprocess
import uuid
import pytest
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

from database import get_db_connection


@pytest.fixture(scope="session", autouse=True)
def bd_limpia():
    """Restaura la BD a estado limpio al iniciar la sesión de pruebas (determinismo)."""
    sql_path = os.path.abspath(
        os.path.join(os.path.dirname(__file__), "..", "database", "micropsev2.sql")
    )
    subprocess.run(
        ["mysql", "-u", "root", "-e", "DROP DATABASE IF EXISTS micropsev2"],
        check=True,
        capture_output=True,
    )
    with open(sql_path, encoding="utf-8") as f:
        sql = f.read()
    subprocess.run(
        ["mysql", "-u", "root"],
        input=sql.encode("utf-8"),
        capture_output=True,
        check=True,
    )
    yield


from main import app

client = TestClient(app)


@pytest.fixture(scope="session")
def api():
    """Cliente HTTP de prueba contra la app FastAPI."""
    return client


@pytest.fixture(scope="session")
def admin_demo():
    """Usuario demo administrador (cargado en la BD)."""
    return {"id": 1, "correo": "carlos.martinez@email.com", "contrasena": "123456"}


@pytest.fixture(scope="session")
def asesor_demo():
    """Usuario demo asesor."""
    return {"id": 2, "correo": "ana.rodriguez@email.com", "contrasena": "123456"}


@pytest.fixture(scope="session")
def cliente_demo():
    """Usuario demo cliente (sin créditos activos)."""
    return {"id": 4, "correo": "maria.lopez@email.com", "contrasena": "123456"}


@pytest.fixture(scope="session")
def cliente_demo_2():
    """Segundo usuario demo cliente."""
    return {"id": 6, "correo": "diana.perez@email.com", "contrasena": "123456"}


@pytest.fixture
def usuario_test(api):
    """Crea un usuario temporal y lo elimina físicamente al final."""
    email = f"test_{uuid.uuid4().hex[:8]}@test.com"
    cedula = uuid.uuid4().hex[:10]
    payload = {
        "nombre": "Test",
        "apellido": "User",
        "cedula": cedula,
        "correo": email,
        "contrasena": "123456",
        "telefono": "3000000000",
    }
    resp = api.post("/api/registro", json=payload)
    data = resp.json()
    user_id = data.get("id") if resp.status_code == 200 else None
    yield {"id": user_id, "correo": email, "contrasena": "123456", "resp": resp}
    if user_id:
        try:
            conn = get_db_connection()
            cur = conn.cursor()
            cur.execute("DELETE FROM usuario WHERE id_usuario = %s", (user_id,))
            conn.commit()
            cur.close()
            conn.close()
        except Exception:
            pass


@pytest.fixture
def credito_test(api, usuario_test):
    """Usuario temporal con una solicitud aprobada y un crédito activo."""
    r = api.post("/api/solicitudes", json={"correo": usuario_test["correo"], "monto": 500000})
    sol_id = r.json()["id_solicitud"]

    api.put(f"/api/admin/solicitudes/{sol_id}/revision", json={"estado": "en_revision"})
    api.put(
        f"/api/admin/solicitudes/{sol_id}/aprobar",
        json={"monto_aprobado": 500000, "tasa_interes": 2.5, "plazo": 12},
    )

    credito = api.get(f"/api/solicitudes/{sol_id}").json()["credito"][0]

    yield {
        "usuario": usuario_test,
        "id_solicitud": sol_id,
        "id_credito": credito["id_credito"],
        "monto": 500000.0,
        "saldo": float(credito["saldo_pendiente"]),
    }