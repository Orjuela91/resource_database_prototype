# Banco de recursos · Prototipo de gestión de recursos pedagógicos

Prototipo **de interfaz** (HTML, CSS y JavaScript) para **almacenar, organizar y asignar recursos pedagógicos** entre distintos perfiles de un equipo de orientación educativa.

Incluye un **servidor local mínimo en Python** (sin dependencias externas) que sirve la aplicación y guarda los archivos subidos en la carpeta `uploads/` del proyecto. Los metadatos (usuarios, recursos y listas) siguen viviendo en el navegador (`localStorage`).

> ⚠️ **Aviso importante:** este proyecto es un **prototipo funcional demostrativo**. La autenticación, los roles y los permisos están **simulados** en el navegador y **no son seguros para producción**. Ver la sección de [limitaciones](#limitaciones-del-prototipo).

---

## Cómo ejecutarlo

Abrir una terminal en la carpeta del proyecto y ejecutar:

```bash
# Python 3 (viene preinstalado en la mayoría de equipos)
python3 server.py
```

Luego abrir en el navegador:

```
http://localhost:8080
```

También puedes cambiar la interfaz o el puerto:

```bash
python3 server.py --host 127.0.0.1 --port 8080
```

`server.py` sirve `index.html`, `styles.css` y `app.js`, y expone la API que guarda los archivos en `uploads/`. La carpeta se crea automáticamente al arrancar.

> **Importante:** no uses `python3 -m http.server`, porque ese servidor solo entrega archivos estáticos y **las subidas fallarían**. Para abrir la app con `file://` tampoco funcionan las subidas, ya que el navegador no puede escribir en el proyecto. Usa siempre `python3 server.py`.

No hay que compilar nada ni instalar paquetes: todo usa la biblioteca estándar de Python.

---

## Credenciales de demostración

La primera vez que se abre la app se cargan **datos de prueba** automáticamente. Puedes iniciar sesión con cualquiera de estas cuentas, o usar los botones de **acceso rápido** que aparecen en la pantalla de login.

| Rol | Nombre | Correo | Contraseña |
| --- | --- | --- | --- |
| Administrador/a | Valentina Ríos | `admin@bancoderecursos.com` | `admin123` |
| Psicólogo/a | Mateo Herrera | `psicologo@bancoderecursos.com` | `psi12345` |
| Usuario/a | Lucía Fernández | `usuario@bancoderecursos.com` | `user1234` |
| Usuario/a | Diego Salas | `diego@bancoderecursos.com` | `user1234` |
| Usuario/a | Camila Vega | `camila@bancoderecursos.com` | `user1234` |

También puedes **registrarte** desde la pantalla de registro. Toda cuenta nueva se crea con el rol `user`.

---

## Qué puede hacer cada rol

### Administrador/a (`admin`)
- **Administrar recursos** (pestaña por defecto): crear, ver y eliminar recursos; adjuntar archivos.
- **Administrar listas**: agrupar recursos y asignarlas a uno o varios usuarios.
- **Administrar usuarios**: tabla con nombre, correo y rol; crear y eliminar cuentas; cambiar el rol.

### Psicólogo/a (`psychologist`)
- Gestiona **recursos** y **listas**, y puede asignar listas a usuarios.
- **No** tiene acceso a la administración de usuarios.

### Usuario/a (`user`)
- Ve **únicamente** los recursos y las listas que le fueron asignados (su "Mi panel"), en modo lectura.
- Puede abrir o descargar los archivos adjuntos cuando existen.

---

## Funcionalidades principales

- **Recursos**: nombre, descripción, nivel (`bajo`, `medio`, `alto`) y archivo adjunto (texto, Word, Excel, PowerPoint, PDF, video o audio).
- **Listas**: se crean a partir de recursos seleccionados y se asignan a uno o más usuarios.
- **Archivos adjuntos**: se suben al servidor y se guardan en `uploads/` con un **id único** (UUID) como nombre de archivo, conservando la extensión. Límite de **25 MB por archivo** y **500 MB en total** para toda la carpeta.
- **Panel de administración** con barra lateral, tablas, formularios, modales, mensajes de confirmación/error y notificaciones.
- **Diseño moderno, responsive y accesible** (escritorio, tablet y móvil), con navegación por rutas (`#/login`, `#/registro`, `#/recursos`, `#/usuarios`, `#/mi-panel`).
- **Datos de prueba** precargados: 5 usuarios, 7 recursos y 3 listas (con archivos de ejemplo, incluido un audio generado).

---

## Estructura del proyecto

```
resource_database_prototype/
├── index.html        # Estructura estática: vistas de autenticación, panel, modal y notificaciones.
├── styles.css        # Sistema de diseño completo y responsive.
├── app.js            # Estado, datos de prueba, rutas, renderizado, permisos y subida de archivos.
├── server.py         # Servidor: archivos estáticos + API de subida/eliminación/uso + /api/health.
├── uploads/          # Archivos subidos, guardados con un id único (UUID) y su extensión.
├── requirements.txt  # Sin dependencias (solo biblioteca estándar).
├── render.yaml       # Blueprint para desplegar en Render.
├── .gitignore        # Excluye uploads/, __pycache__, etc.
└── README.md         # Este archivo.
```

---

## Almacenamiento de datos

### Metadatos (navegador)

Los usuarios, recursos, listas y la sesión se guardan en `localStorage`:

| Clave | Contenido |
| --- | --- |
| `bancoderecursos.data.v1` | Usuarios, recursos, listas y metadatos de archivos. |
| `bancoderecursos.session.v1` | Identificador del usuario con sesión iniciada. |

Para **volver al estado inicial** (recargar los datos de prueba), abre la consola del navegador y ejecuta:

```js
localStorage.removeItem('bancoderecursos.data.v1');
localStorage.removeItem('bancoderecursos.session.v1');
location.reload();
```

### Archivos (servidor)

Los archivos se guardan en `uploads/` con un nombre generado:

```
uploads/
├── 3f9c1a7e5b2d4c6f8a0e1d2c3b4a5f60.txt
├── 8b1d4e7a2c5f9a3e6d0b1c4f7a8e2d53.docx
└── c4e7a1b9d2f6e8a0c3b5d7f9a1e2c4b6.wav
```

El nombre original, el tipo MIME y el tamaño se guardan en el metadato del recurso dentro de `localStorage`. Cada recurso apunta a su archivo mediante `/uploads/<id>.<ext>`.

La API del servidor es:

| Método | Ruta | Uso |
| --- | --- | --- |
| `GET` | `/api/health` | Comprueba que el servidor está vivo (`{"status": "ok"}`). |
| `GET` | `/api/usage` | Devuelve el espacio usado, el límite y el espacio libre de `uploads/`. |
| `POST` | `/api/upload` | Recibe el archivo en el cuerpo y devuelve sus metadatos. |
| `DELETE` | `/api/files/<id>.<ext>` | Elimina un archivo de `uploads/`. |

**Límite total:** la carpeta `uploads/` admite **500 MB** sumando todos los archivos. Si una subida supera ese total, el servidor responde `507` con un mensaje que indica el espacio libre y el archivo no se guarda. Al eliminar archivos o recursos, el espacio se libera automáticamente. El límite se puede cambiar con la variable de entorno `MAX_TOTAL_UPLOAD_MB` (por ejemplo, `MAX_TOTAL_UPLOAD_MB=1000 python3 server.py`).

> Al borrar recursos o reemplazar un archivo desde la app, el archivo correspondiente también se elimina de `uploads/`. Si borras solo `localStorage`, los archivos quedarán huérfanos en la carpeta; puedes vaciarla manualmente cuando el servidor esté detenido.

---

## Desplegar en Render

El proyecto ya viene preparado: `server.py` escucha en `0.0.0.0:$PORT` cuando existe la variable de entorno `PORT`, y se incluyen `render.yaml` (blueprint) y `requirements.txt`.

### Paso a paso (recomendado: con blueprint)

1. **Sube el proyecto a GitHub** (ver comandos más abajo). El `.gitignore` ya excluye `uploads/`, así que no se suben los archivos de prueba.
2. Entra en <https://dashboard.render.com> y crea una cuenta (puedes registrarte con GitHub).
3. Pulsa **New +** → **Blueprint**.
4. Conecta tu cuenta/repositorio de GitHub y elige el repositorio del proyecto.
5. Render detecta `render.yaml` y muestra el servicio `banco-de-recursos`. Configura el nombre que quieras y pulsa **Apply** / **Create**.
6. Espera a que el estado pase a **Live** y abre la URL `https://<tu-servicio>.onrender.com`.

### Paso a paso (alternativa: sin blueprint)

1. **New +** → **Web Service** → conecta el repositorio.
2. Configura:
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `python3 server.py`
   - **Instance Type**: `Free`
   - **Health Check Path**: `/api/health`
3. Pulsa **Create Web Service** y espera a **Live**.

### Subir el proyecto a GitHub

```bash
cd resource_database_prototype

git init
git add .
git commit -m "Banco de recursos: prototipo listo para Render"

# Crea el repositorio vacío en https://github.com/new y copia la URL, por ejemplo:
git remote add origin https://github.com/tu-usuario/banco-de-recursos.git
git branch -M main
git push -u origin main
```

### Cosas a tener en cuenta en el plan gratuito de Render

- La web **se duerme a los 15 minutos** sin tráfico y tarda alrededor de un minuto en despertar.
- El **disco es efímero**: los archivos de `uploads/` se pierden al reiniciar, redesplegar o despertar. Los datos de prueba se vuelven a generar solos al entrar, pero **las subidas de los usuarios no sobreviven**. Para conservarlas necesitarías un disco persistente (de pago) o guardar los archivos en un almacenamiento externo (Cloudflare R2, Backblaze B2, etc.).
- La API de subida **no tiene autenticación**: cualquiera que conozca la URL puede subir o borrar archivos. No subas información sensible.
- Los **metadatos siguen en `localStorage`**, así que cada visitante ve sus propios datos (no es multiusuario real).

---

## Restricciones de seguridad y limitaciones del prototipo

Este proyecto se entregó como **demostración de interfaz y flujo funcional**. Por diseño:

- **La autenticación es simulada en el cliente.** Las contraseñas se guardan como un hash SHA-256 (con `crypto.subtle`) *con sal fija*, no con un algoritmo de hash lento adecuado para contraseñas (bcrypt/argon2) ni con sal aleatoria. No debe usarse en producción.
- **Los permisos se validan solo en el navegador.** Cualquier persona puede alterarlos abriendo la consola o editando `localStorage`.
- **El servidor es de desarrollo, no de producción.** No tiene HTTPS, autenticación en la API ni protección contra abusos; cualquiera con acceso a la máquina puede subir o borrar archivos llamando a la API.
- **Los metadatos no están en el servidor.** Si se borra `localStorage` pero se conserva `uploads/`, los archivos quedan huérfanos; si se borra `uploads/` pero se conserva `localStorage`, los recursos apuntan a archivos inexistentes.
- **Los archivos son locales a la máquina.** No se sincronizan entre dispositivos ni entre navegadores; el servidor debe estar en ejecución para abrirlos o descargarlos.
- **No hay recuperación de contraseña** ni verificación por correo.

### Posibles siguientes pasos para un producto real
- Backend con base de datos y control de acceso en el servidor.
- Hash de contraseñas con sal aleatoria y algoritmo seguro (argon2/bcrypt).
- Almacenamiento de archivos en un servicio dedicado (S3 u similar) con URLs firmadas, en lugar de una carpeta local.
- Roles y permisos definidos y validados del lado del servidor, con registro de auditoría.
- Validación de subidas también en el servidor (tipos reales, antivirus, cuotas por usuario).

---

## Compatibilidad

Probado en navegadores modernos basados en Chromium y en Firefox. Requiere Python 3.8 o superior y soporte de ES2020, `fetch`, `Blob` y (recomendado) `crypto.subtle`.
