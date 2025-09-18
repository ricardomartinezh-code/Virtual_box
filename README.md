# tipificacion-bot (Playwright + Google Sheets + Docker)

Servicio web mínimo para automatizar un navegador con Playwright y opcionalmente escribir resultados en Google Sheets.
Preparado para desplegarse desde **GitHub → Render** con autodeploy.

## Endpoints
- `GET /` → health check.
- `POST /run` → ejecuta una navegación y opcionalmente escribe en Google Sheets.
  ```json
  {
    "url": "https://example.com",
    "spreadsheetId": "TU_SHEET_ID",
    "range": "Sheet1!A1"
  }
  ```

## Requisitos
- Node 20+ (solo para correr local) o Docker.
- Cuenta de servicio de Google (Service Account) con acceso a Sheets.
  - Habilita la **Google Sheets API**.
  - Comparte el Sheet con el email de la Service Account.
  - En Render, guarda el JSON completo en la variable de entorno **SA_JSON**.

## Desarrollo local con Docker
```bash
docker build -t tipificacion-bot .
docker run -p 3000:3000 -e SA_JSON="$(cat secrets/sa-key.json)" tipificacion-bot
curl http://localhost:3000/
```

## Despliegue en Render (dos caminos)

**A) Usando `render.yaml` (Infra as Code)**
1. Sube este repo a GitHub.
2. En Render: *New+ → Blueprint → Connect repo*.
3. Configura variable de entorno `SA_JSON` con el contenido del JSON de la Service Account.
4. Deploy.

**B) Como Web Service Docker**
1. *New+ → Web Service → Connect repo*.
2. Elige **Docker** (Render detecta el Dockerfile).
3. Variables de entorno:
   - `PORT=3000`
   - `SA_JSON=<pega aquí el JSON completo>`
4. Activa **Auto Deploys** en tu branch principal.

## Probar
```bash
curl -X POST https://<tu-servicio>.onrender.com/run       -H "content-type: application/json"       -d '{"url":"https://example.com","spreadsheetId":"<ID>","range":"Hoja1!A1"}'
```

## Notas
- Si no defines `SA_JSON` o no pasas `spreadsheetId`, el servicio **no** escribirá en Sheets (solo navegará).
- Para ver la GUI real del navegador necesitarás un contenedor con noVNC/Guacamole en un VPS. Render funciona perfecto en **headless**.
- Seguridad: no subas credenciales al repo. Usa variables de entorno / Secret Files.
