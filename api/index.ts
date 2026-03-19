import express from "express";
import { GoogleGenAI } from "@google/genai";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

const app = express();

// API logic
app.get("/", async (req, res, next) => {
  const queryParam = req.query.query as string;
  const queryKeys = Object.keys(req.query);
  const rawQuery = queryKeys.length > 0 ? queryKeys[0] : null;
  
  const query = queryParam || rawQuery;
  const userAgent = req.headers["user-agent"] || "";
  const isPython = userAgent.toLowerCase().includes("python") || userAgent.toLowerCase().includes("requests");
  const isTextRequested = req.query.format === "text" || req.headers["accept"] === "text/plain";

  // If it's an API call (from Python or explicitly text)
  if (query && (isPython || isTextRequested)) {
    try {
      const result = await genAI.models.generateContent({
        model: "gemini-2.0-flash",
        contents: query,
      });
      res.setHeader("Content-Type", "text/plain");
      return res.send(result.text);
    } catch (error: any) {
      return res.status(500).send(`Gemini Error: ${error.message}`);
    }
  }
  
  // If not an API call, continue to serve the frontend
  next();
});

// Serve static files from 'dist' (Vercel build output)
const distPath = path.join(process.cwd(), "dist");
app.use(express.static(distPath));

app.get("*", (req, res) => {
  res.sendFile(path.join(distPath, "index.html"));
});

export default app;
