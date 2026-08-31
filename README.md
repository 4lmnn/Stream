# Aula Video

Aplicación mínima para transmitir video desde OBS hacia navegadores conectados a la misma red. Utiliza MediaMTX para recibir y distribuir la transmisión, Nginx para servir la página y Docker Compose para ejecutar ambos servicios.

## Requisitos

En el equipo servidor instala únicamente:

- Docker Desktop con contenedores Linux.
- OBS Studio con soporte para WHIP.
- Un navegador moderno, como Edge, Chrome o Firefox.

Node.js y npm no necesitan instalarse en el sistema. Docker contiene las herramientas necesarias para compilar el frontend.

Los dispositivos que solo reproducen la transmisión necesitan un navegador y acceso a la red del servidor.

## Instalación en un equipo nuevo

### 1. Copiar el proyecto

Copia la carpeta completa y abre una terminal dentro de ella. Comprueba Docker:

```bash
docker version
docker compose version
```

Docker Desktop debe estar abierto y su motor debe haber terminado de iniciar.

### 2. Crear la configuración privada

Copia `.env.example` como `.env`.

macOS o Linux:

```bash
cp .env.example .env
```

Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

No reemplaces un `.env` existente. El archivo contiene datos privados y está excluido de Git.

### 3. Elegir el tipo de acceso

#### Solo en el equipo servidor

Usa estos valores en `.env`:

```dotenv
AULA_BIND_IP=127.0.0.1
AULA_PORT=8090
LAN_IP=127.0.0.1
WEBRTC_PORT=8190
MEDIA_PUBLISH_PASSWORD=UNA_CONTRASEÑA_LARGA_Y_ALEATORIA
```

La página estará disponible en:

```text
http://localhost:8090
```

#### Desde la red local

Primero averigua la IPv4 del equipo servidor.

macOS:

```bash
ipconfig getifaddr en0
```

Si `en0` no corresponde a la conexión activa, consulta la dirección desde Configuración del Sistema → Red.

Windows:

```powershell
ipconfig
```

Busca la IPv4 del adaptador conectado a la red correcta. Después configura `.env`:

```dotenv
AULA_BIND_IP=0.0.0.0
AULA_PORT=8090
LAN_IP=192.168.1.27
WEBRTC_PORT=8190
MEDIA_PUBLISH_PASSWORD=UNA_CONTRASEÑA_LARGA_Y_ALEATORIA
```

Sustituye `192.168.1.27` por la dirección real. Los dispositivos de la red abrirán:

```text
http://IP_DEL_SERVIDOR:8090
```

La IP puede cambiar al cambiar de red o reiniciar el router. Si cambia, actualiza `LAN_IP` y vuelve a crear los contenedores.

### 4. Compilar sin instalar Node.js

Construye una vez la imagen con las herramientas de desarrollo:

```bash
docker build --target tooling -t aula-video-pip-tools:1.0.0 .
```

Compila en macOS o Linux:

```bash
docker run --rm --network none --user "$(id -u):$(id -g)" --mount "type=bind,source=$PWD,target=/app/project" aula-video-pip-tools:1.0.0 npm run build
```

Compila en Windows PowerShell:

```powershell
docker run --rm --network none --mount "type=bind,source=${PWD},target=/app/project" aula-video-pip-tools:1.0.0 npm run build
```

El resultado se guarda en `dist/`. No edites esa carpeta manualmente.

### 5. Construir e iniciar los servicios

```bash
docker compose config --quiet
docker compose up --build -d
docker compose ps
```

Los servicios deben aparecer como activos. Nginx debe mostrar un estado saludable.

Comprueba el servidor:

```text
http://localhost:8090/healthz
```

Debe responder `ok`.

## Configuración de OBS

### Fuente de video

1. Crea una escena.
2. Añade una captura de pantalla, ventana o cámara.
3. Comprueba que la vista previa muestre la imagen correcta.
4. Añade y verifica las fuentes de audio necesarias.

Evita capturar la ventana que reproduce el directo para no crear un efecto de imagen repetida. En macOS puede ser necesario autorizar a OBS para grabar la pantalla, el micrófono o la cámara.

### Emisión WHIP

Abre Ajustes → Emisión y utiliza:

| Campo | Valor |
| --- | --- |
| Servicio | `WHIP` |
| Servidor | `http://localhost:8090/media/classroom/whip` |
| Bearer Token | `USUARIO_DE_PUBLICACIÓN:CONTRASEÑA` |

El usuario de publicación está definido en `mediamtx/mediamtx.yml`. La contraseña es el valor de `MEDIA_PUBLISH_PASSWORD` en `.env`.

Escribe el token como `usuario:contraseña`, sin agregar la palabra `Bearer` y sin convertirlo a Base64.

Si OBS se ejecuta en otro equipo, sustituye `localhost` por la IP del servidor. Si cambia `AULA_PORT`, actualiza también la dirección de OBS.

### Ajustes recomendados

Utiliza estos valores como punto de partida:

| Ajuste | Recomendación |
| --- | --- |
| Resolución | 1280 × 720 |
| Imágenes por segundo | 30 FPS |
| Bitrate de video | 2500–4000 kbps |
| Códec de video | H.264 sin B-frames |
| Códec de audio | Opus |

Reduce bitrate o FPS si aparecen cortes. Para contenido con texto, comprueba que siga siendo legible antes de reducir la resolución.

Pulsa **Iniciar transmisión** y abre la página. El video comienza silenciado por las reglas de reproducción automática del navegador; el sonido se activa desde sus controles.

## Uso diario

Iniciar:

```bash
docker compose up -d
```

Consultar estado:

```bash
docker compose ps
```

Activar el modo de diagnóstico y ver registros:

```bash
docker compose -f compose.yml -f compose.dev.yml up -d
docker compose -f compose.yml -f compose.dev.yml logs --tail=100 nginx mediamtx
```

El primer comando recrea los servicios con registros limitados y monta `dist/` directamente. Para volver al modo normal, ejecuta `docker compose up -d`.

Detener temporalmente:

```bash
docker compose stop
```

Eliminar los contenedores y la red interna, sin borrar el proyecto:

```bash
docker compose down
```

Después de modificar HTML, CSS o TypeScript, vuelve a ejecutar la compilación del apartado 4 y después:

```bash
docker compose up --build -d
```

## Acceso local, por red y por Internet

### Mismo equipo

Configura `AULA_BIND_IP=127.0.0.1` y abre `http://localhost:8090`. Ningún otro dispositivo podrá entrar directamente.

### Red local

Configura `AULA_BIND_IP=0.0.0.0`, asigna la IP correcta a `LAN_IP` y abre `http://IP_DEL_SERVIDOR:8090` desde cada dispositivo.

La red debe permitir comunicación directa entre dispositivos. Algunas redes inalámbricas utilizan aislamiento de clientes y bloquean este tráfico.

### Internet

La configuración actual no está preparada para exposición directa a Internet:

- La página utiliza HTTP, no HTTPS.
- La lectura de la transmisión no solicita credenciales.
- No hay control de usuarios ni límites de acceso.
- WebRTC puede necesitar TURN o una red privada virtual.

No abras los puertos del router directamente. Para acceso externo utiliza una VPN administrada o añade HTTPS, autenticación, reglas de firewall y una configuración WebRTC adecuada.

## Cómo funciona Docker Compose

`compose.yml` define los servicios usados durante la ejecución:

| Servicio | Función |
| --- | --- |
| `nginx` | Sirve la página y envía las rutas `/media/` hacia MediaMTX. |
| `mediamtx` | Recibe la emisión WHIP y entrega el video mediante WHEP/WebRTC. |

Puertos principales:

| Puerto | Protocolo | Función |
| --- | --- | --- |
| `8090` | TCP/HTTP | Página y señalización WHIP/WHEP. |
| `8190` | UDP | Transporte WebRTC de video y audio. |

`compose.dev.yml` complementa la configuración principal:

- Monta `dist/` directamente dentro de Nginx.
- Habilita registros limitados para diagnóstico.
- No reemplaza `compose.yml`; se utiliza junto con él.

`.env` proporciona la IP, los puertos y la contraseña sin escribirlos directamente en Compose.

Flujo general:

```text
OBS ── WHIP ──> Nginx ──> MediaMTX
                                │
Navegador <── WHEP/WebRTC ──────┘
```

## Problemas frecuentes

| Problema | Comprobación y solución |
| --- | --- |
| Docker no responde | Abre Docker Desktop y espera a que su motor inicie. |
| Compose no encuentra archivos | Abre la terminal dentro de la carpeta del proyecto. |
| Falta `MEDIA_PUBLISH_PASSWORD` | Crea `.env` y completa una contraseña no vacía. |
| El puerto ya está ocupado | Detén el proceso que lo utiliza o cambia el puerto en `.env`. |
| `localhost` no abre | Comprueba `docker compose ps` y `http://localhost:8090/healthz`. |
| Funciona localmente, pero no desde otro dispositivo | Revisa `AULA_BIND_IP`, `LAN_IP`, firewall y aislamiento de la red. |
| La página abre, pero no hay video | Inicia la emisión y comprueba la dirección WHIP, `LAN_IP` y el puerto UDP. |
| OBS muestra 401 | Revisa el usuario y la contraseña del Bearer Token. Recrea MediaMTX si cambió `.env`. |
| Aparece `stream not found` | No existe una emisión activa en la ruta `classroom`. |
| Imagen negra | Comprueba primero la vista previa, permisos de captura y fuente seleccionada en OBS. |
| No hay sonido | Activa el volumen del navegador y revisa el mezclador de OBS. |
| Pixelación o congelamientos | Reduce bitrate o FPS, acerca el equipo al punto de acceso o utiliza Ethernet. |
| Los cambios no aparecen | Compila de nuevo, reconstruye Nginx y fuerza la recarga del navegador. |
| La conexión se corta al cerrar la tapa | Desactiva el reposo mientras el servidor esté activo. |

Diagnóstico básico:

```bash
docker compose -f compose.yml -f compose.dev.yml up -d
docker compose -f compose.yml -f compose.dev.yml ps
docker compose -f compose.yml -f compose.dev.yml logs --tail=100 nginx mediamtx
```

En macOS o Linux:

```bash
curl -i --max-time 5 http://localhost:8090/healthz
```

En Windows PowerShell:

```powershell
curl.exe -i --max-time 5 http://localhost:8090/healthz
```

No compartas `.env`, contraseñas ni tokens al solicitar ayuda.

## Seguridad y recomendaciones finales

- Conserva `.env` fuera de Git y de cualquier paquete público.
- Cambia la contraseña al instalar el proyecto en otro entorno.
- Mantén Docker Desktop y OBS actualizados.
- Evita que el equipo servidor entre en reposo.
- Usa Ethernet cuando haya varios dispositivos conectados.
- Haz una prueba completa después de cambiar de red.

Lista de comprobación:

1. Docker está activo.
2. La IP de `.env` sigue siendo correcta.
3. Los dos servicios aparecen en `docker compose ps`.
4. `/healthz` responde `ok`.
5. OBS muestra la fuente correcta y está transmitiendo.
6. La página funciona desde otro dispositivo de la red.
7. El audio, el video y la reconexión fueron comprobados.
