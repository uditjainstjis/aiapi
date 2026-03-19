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
  // Find the first key that isn't 'key' or 'format' to use as a raw query
  const rawQuery = queryKeys.find(k => k !== 'key' && k !== 'format');
  const apiKey = (req.query.key as string) || process.env.GEMINI_API_KEY;
  
  const query = queryParam || rawQuery;
  const userAgent = req.headers["user-agent"] || "";
  const isPython = userAgent.toLowerCase().includes("python") || userAgent.toLowerCase().includes("requests");
  const isTextRequested = req.query.format === "text" || req.headers["accept"] === "text/plain";

  // If it's an API call (has a query and either from Python, text requested, or has an API key in URL)
  if (query && (isPython || isTextRequested || req.query.key)) {
    if (!apiKey) {
      res.setHeader("Content-Type", "text/plain");
      return res.status(400).send("Error: No API key provided. Append &key=YOUR_API_KEY to the URL.");
    }

    try {
      const genAI = new GoogleGenAI({ apiKey });
      const result = await genAI.models.generateContent({
        model: "gemini-2.0-flash",
        contents: query,
      });
      res.setHeader("Content-Type", "text/plain");
      return res.send(result.text);
    } catch (error: any) {
      res.setHeader("Content-Type", "text/plain");
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
