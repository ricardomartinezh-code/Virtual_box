import express from "express";
import { chromium } from "playwright";
import { google } from "googleapis";

const app = express();
app.use(express.json());

app.get("/", (_, res) => res.send("OK / 🚀"));

const actionHandlers = {
  async click({ page, step }) {
    if (!step.selector) {
      throw new Error("'selector' es requerido para la acción 'click'");
    }
    await page.click(step.selector);
  },
  async type({ page, step }) {
    if (!step.selector) {
      throw new Error("'selector' es requerido para la acción 'type'");
    }
    if (typeof step.value !== "string") {
      throw new Error("'value' debe ser una cadena para la acción 'type'");
    }
    await page.fill(step.selector, step.value);
  },
  async fill({ page, step }) {
    if (!step.selector) {
      throw new Error("'selector' es requerido para la acción 'fill'");
    }
    if (typeof step.value !== "string") {
      throw new Error("'value' debe ser una cadena para la acción 'fill'");
    }
    await page.fill(step.selector, step.value);
  },
  async waitForSelector({ page, step }) {
    if (!step.selector) {
      throw new Error("'selector' es requerido para la acción 'waitForSelector'");
    }
    await page.waitForSelector(step.selector, step.options || {});
  },
  async waitForTimeout({ page, step }) {
    const timeout = Number(step.timeout ?? step.value);
    if (!Number.isFinite(timeout)) {
      throw new Error("'timeout' debe ser un número (ms) para la acción 'waitForTimeout'");
    }
    await page.waitForTimeout(timeout);
  }
};

async function runSteps(page, steps = []) {
  if (steps === undefined || steps === null) {
    return;
  }
  if (!Array.isArray(steps)) {
    throw new Error("'steps' debe ser un arreglo");
  }

  for (let i = 0; i < steps.length; i += 1) {
    const step = steps[i];
    if (typeof step !== "object" || step === null || Array.isArray(step)) {
      throw new Error(`El paso en la posición ${i} debe ser un objeto`);
    }
    if (!step.action || typeof step.action !== "string") {
      throw new Error(`El paso en la posición ${i} debe incluir una propiedad 'action' de tipo cadena`);
    }

    const handler = actionHandlers[step.action];
    if (!handler) {
      throw new Error(`Acción desconocida '${step.action}' en la posición ${i}`);
    }

    try {
      await handler({ page, step, index: i });
    } catch (error) {
      throw new Error(`Fallo el paso ${i} (${step.action}): ${error.message}`);
    }
  }
}

app.post("/run", async (req, res) => {
  const {
    url = "https://example.com",
    spreadsheetId,
    range = "Sheet1!A1",
    steps = []
  } = req.body;
  let browser;
  try {
    browser = await chromium.launch({ headless: true, args: ["--no-sandbox"] });
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto(url, { waitUntil: "networkidle" });
    await runSteps(page, steps);
    const title = await page.title();

    // Google Sheets (Service Account via env var SA_JSON)
    const saJson = process.env.SA_JSON;
    if (!saJson) {
      console.warn("SA_JSON not set; skipping Sheets write");
    } else if (spreadsheetId) {
      const auth = new google.auth.GoogleAuth({
        credentials: JSON.parse(saJson),
        scopes: ["https://www.googleapis.com/auth/spreadsheets"]
      });
      const sheets = google.sheets({ version: "v4", auth });
      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range,
        valueInputOption: "RAW",
        requestBody: { values: [[new Date().toISOString(), url, title]] }
      });
    }

    await browser.close();
    res.json({ ok: true, title });
  } catch (e) {
    if (browser) await browser.close();
    console.error(e);
    res.status(500).json({ ok: false, error: e.message });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log("listening on", port));
