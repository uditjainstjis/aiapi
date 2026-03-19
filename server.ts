import express from "express";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

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
      console.log(`API Request: "${query}"`);
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

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production: Serve static files from 'dist'
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // Export for Vercel
  if (process.env.VERCEL) {
    return app;
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

// For local dev
if (!process.env.VERCEL) {
  startServer();
}

// Export for Vercel serverless
export default async (req: any, res: any) => {
  const app = await startServer();
  return app!(req, res);
};
