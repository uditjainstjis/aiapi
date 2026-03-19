import express from "express";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

async function startServer() {
  const app = express();
  const PORT = 3000;

  // API route for Python requests
  // This handles both ?query=... and raw query strings like ?what+is+the+color+of+apple
  app.get("/", async (req, res, next) => {
    const queryParam = req.query.query as string;
    const rawQuery = Object.keys(req.query)[0]; // Handles ?whatcolourisofapple
    
    const query = queryParam || rawQuery;

    // If there's a query and the request is likely from a script (or explicitly requested)
    // we return plain text for the Python requests.get()
    if (query && (req.headers["user-agent"]?.includes("python-requests") || req.query.format === "text")) {
      try {
        const result = await genAI.models.generateContent({
          model: "gemini-2.0-flash",
          contents: query,
        });
        const responseText = result.text;
        return res.send(responseText);
      } catch (error: any) {
        return res.status(500).send(`Error: ${error.message}`);
      }
    }
    
    // Otherwise, continue to Vite middleware (the React app)
    next();
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
