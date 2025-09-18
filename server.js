import express from "express";
import { chromium } from "playwright";
import { google } from "googleapis";

const app = express();
app.use(express.json());

app.get("/", (_, res) => res.send("OK / 🚀"));

app.post("/run", async (req, res) => {
  const { url = "https://example.com", spreadsheetId, range = "Sheet1!A1" } = req.body;
  let browser;
  try {
    browser = await chromium.launch({ headless: true, args: ["--no-sandbox"] });
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto(url, { waitUntil: "networkidle" });
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
