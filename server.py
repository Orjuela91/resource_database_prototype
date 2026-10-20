#!/usr/bin/env python3
"""Servidor de Banco de recursos.

Sirve los archivos estáticos del prototipo y expone una API mínima para
guardar los archivos subidos en la carpeta ``uploads/`` del proyecto.

Uso local:
    python3 server.py
    python3 server.py --host 127.0.0.1 --port 8080

Uso en la nube (Render y similares): si existe la variable de entorno PORT,
el servidor escucha en 0.0.0.0 y en ese puerto automáticamente.
"""

from __future__ import annotations

import argparse
import json
import mimetypes
import os
import re
import uuid
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote, urlparse

ROOT = Path(__file__).resolve().parent
# La carpeta de archivos puede cambiarse con la variable UPLOADS_DIR
# (útil si algún día se monta un disco persistente).
UPLOADS_DIR = Path(os.environ.get("UPLOADS_DIR", ROOT / "uploads")).resolve()
MAX_FILE_SIZE = int(os.environ.get("MAX_FILE_SIZE_MB", "25")) * 1024 * 1024  # 25 MB por defecto

ALLOWED_EXTENSIONS = {
    "txt",
    "doc",
    "docx",
    "xls",
    "xlsx",
    "ppt",
    "pptx",
    "pdf",
    "mp4",
    "webm",
    "mov",
    "avi",
    "mkv",
    "mp3",
    "wav",
    "ogg",
    "m4a",
    "aac",
}

STORED_NAME_RE = re.compile(r"^[A-Za-z0-9_-]{1,128}\.[A-Za-z0-9]{1,10}$")

# Tipos MIME habituales para que el navegador abra los archivos correctamente.
for extension, content_type in {
    ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    ".pdf": "application/pdf",
    ".doc": "application/msword",
    ".xls": "application/vnd.ms-excel",
    ".ppt": "application/vnd.ms-powerpoint",
    ".mkv": "video/x-matroska",
    ".m4a": "audio/mp4",
    ".wav": "audio/wav",
    ".txt": "text/plain; charset=utf-8",
}.items():
    mimetypes.add_type(content_type, extension)


class ResourceDatabaseHandler(SimpleHTTPRequestHandler):
    server_version = "BancoDeRecursos/1.0"

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    # ------------------------------------------------------------------ utils
    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Content-Type-Options", "nosniff")
        super().end_headers()

    def list_directory(self, path):
        """Evita exponer listados de directorios."""
        self.send_error(404, "No encontrado")
        return None

    def handle(self):
        """Ignora cortes de conexión (habituales al previsualizar vídeo/audio)."""
        try:
            super().handle()
        except (ConnectionResetError, BrokenPipeError):
            pass

    def send_json(self, status: int, payload: dict) -> None:
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def send_api_error(self, status: int, message: str) -> None:
        self.close_connection = True
        self.send_json(status, {"error": message})

    # ------------------------------------------------------------------- rutas
    def do_GET(self):
        if urlparse(self.path).path == "/api/health":
            self.send_json(200, {"status": "ok"})
            return
        super().do_GET()

    # ----------------------------------------------------------------- uploads
    def do_POST(self):
        parsed = urlparse(self.path)
        if parsed.path != "/api/upload":
            self.send_api_error(404, "Ruta no encontrada.")
            return

        raw_length = self.headers.get("Content-Length")
        if not raw_length:
            self.send_api_error(411, "Falta el tamaño del archivo.")
            return

        try:
            length = int(raw_length)
        except ValueError:
            self.send_api_error(400, "Tamaño de archivo inválido.")
            return

        if length <= 0:
            self.send_api_error(400, "El archivo está vacío.")
            return

        if length > MAX_FILE_SIZE:
            self.send_api_error(
                413,
                f"El archivo supera {MAX_FILE_SIZE // (1024 * 1024)} MB.",
            )
            return

        original_name = unquote(self.headers.get("X-File-Name", "")).strip()
        original_name = os.path.basename(original_name.replace("\\", "/"))[:200]
        if not original_name:
            original_name = "archivo"

        if "." not in original_name:
            self.send_api_error(415, "El archivo debe tener una extensión válida.")
            return

        extension = original_name.rsplit(".", 1)[1].lower()
        if extension not in ALLOWED_EXTENSIONS:
            self.send_api_error(
                415,
                "Formato no permitido. Usa TXT, Word, Excel, PowerPoint, video o audio.",
            )
            return

        data = self.rfile.read(length)
        if len(data) != length:
            self.send_api_error(400, "No se pudo leer el archivo completo.")
            return

        file_id = uuid.uuid4().hex
        stored_name = f"{file_id}.{extension}"
        destination = UPLOADS_DIR / stored_name

        try:
            destination.write_bytes(data)
        except OSError:
            self.send_api_error(500, "No se pudo guardar el archivo en el servidor.")
            return

        content_type = (
            self.headers.get("X-File-Type")
            or mimetypes.guess_type(original_name)[0]
            or "application/octet-stream"
        )

        self.send_json(
            201,
            {
                "id": file_id,
                "storedName": stored_name,
                "name": original_name,
                "type": content_type,
                "size": len(data),
                "url": f"/uploads/{stored_name}",
            },
        )

    def do_DELETE(self):
        parsed = urlparse(self.path)
        prefix = "/api/files/"
        if not parsed.path.startswith(prefix):
            self.send_api_error(404, "Ruta no encontrada.")
            return

        stored_name = unquote(parsed.path[len(prefix):])
        if not STORED_NAME_RE.fullmatch(stored_name):
            self.send_api_error(400, "Identificador de archivo inválido.")
            return

        target = (UPLOADS_DIR / stored_name).resolve()
        if target.parent != UPLOADS_DIR.resolve():
            self.send_api_error(400, "Identificador de archivo inválido.")
            return

        if not target.is_file():
            self.send_api_error(404, "El archivo no existe.")
            return

        try:
            target.unlink()
        except OSError:
            self.send_api_error(500, "No se pudo eliminar el archivo.")
            return

        self.send_json(200, {"deleted": True, "storedName": stored_name})


def main() -> None:
    # En la nube (Render, Railway, Koyeb…) el puerto llega en la variable PORT
    # y hay que escuchar en 0.0.0.0 para ser accesible desde fuera.
    env_port = os.environ.get("PORT", "").strip()
    default_host = "0.0.0.0" if env_port else "127.0.0.1"
    default_port = int(env_port) if env_port.isdigit() else 8080

    parser = argparse.ArgumentParser(description="Servidor de Banco de recursos")
    parser.add_argument("--host", default=default_host, help=f"Interfaz de escucha (por defecto {default_host})")
    parser.add_argument("--port", type=int, default=default_port, help=f"Puerto (por defecto {default_port})")
    args = parser.parse_args()

    UPLOADS_DIR.mkdir(parents=True, exist_ok=True)

    server = ThreadingHTTPServer((args.host, args.port), ResourceDatabaseHandler)
    server.daemon_threads = True
    print(f"Banco de recursos disponible en http://{args.host}:{args.port}")
    print(f"Archivos subidos: {UPLOADS_DIR}")
    print("Pulsa Ctrl+C para detener el servidor.")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nServidor detenido.")
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
