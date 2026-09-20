import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import { AIPayloadValidator } from "./src/domain/AIPayloadValidator";

try {
  if (typeof dotenv?.config === "function") {
    dotenv.config();
  } else if (typeof (dotenv as any)?.default?.config === "function") {
    (dotenv as any).default.config();
  }
} catch (e) {
  console.warn("dotenv config warning:", e);
}

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "25mb" }));

// Server-side Gemini initialization
let aiClient: GoogleGenAI | null = null;
function getGeminiClient() {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("GEMINI_API_KEY is not set in environment.");
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey || "dummy-key",
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// API Routes
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", app: "Daily Finance 3.0 Backend" });
});

// AI Financial Insights Route (Hardened for Space/Fund Isolation & Financial Grounding)
app.post("/api/ai/insights", async (req, res) => {
  let groundingRef: any = null;
  try {
    const { transactions, budget, budgets, language, spaceId, fundId } = req.body;
    const lang = language === "en" ? "en" : "vi";
    const langPrompt = lang === "vi" ? "Trả lời bằng tiếng Việt." : "Respond in English.";

    // 1. Prepare, isolate, and ground the payload using canonical validator
    const {
      targetSpaceId,
      targetFundId,
      sanitizedTransactions,
      sanitizedBudgets,
      grounding,
      groundedPromptSnippet
    } = AIPayloadValidator.prepareInsightsPayload({
      transactions: transactions || [],
      budgets: budgets || (budget ? [budget] : []),
      spaceId: spaceId || (Array.isArray(transactions) && transactions[0]?.spaceId) || "sp_personal",
      fundId
    });

    groundingRef = grounding;

    const prompt = `
You are the AI Financial Coach in Daily Finance 3.0 app.
Analyze the following financial data and provide 3 actionable, empathetic insights and 1 smart warning or recommendation.
Language instruction: ${langPrompt}

${groundedPromptSnippet}

Verified Data Details:
Active Transactions: ${JSON.stringify(sanitizedTransactions.slice(0, 30))}
Active Budgets: ${JSON.stringify(sanitizedBudgets)}

Return JSON with format:
{
  "summary": "Short financial headline strictly matching verified numbers",
  "insights": [
    {"type": "positive" | "warning" | "tip", "title": "...", "description": "..."}
  ],
  "fireProgressNote": "Brief encouraging note on FIRE or savings progress"
}
`;

    const ai = getGeminiClient();
    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const text = response.text;
    let parsed: any = {};
    try {
      parsed = JSON.parse(text || "{}");
    } catch {
      parsed = {};
    }

    res.json({
      ...parsed,
      grounding
    });
  } catch (error: any) {
    console.error("AI Insights Error:", error);
    const safeFallback = groundingRef
      ? AIPayloadValidator.generateSafeFallback(groundingRef, req.body?.language || "vi")
      : {
          summary: "Financial Health Analysis",
          insights: [
            {
              type: "positive",
              title: "System Ready",
              description: "Financial system active. Please add transactions to begin AI analysis."
            }
          ],
          fireProgressNote: "Daily Finance 3.0 system ready.",
          grounding: {
            spaceId: req.body?.spaceId || "sp_personal",
            totalIncome: 0,
            totalExpense: 0,
            netCashFlow: 0,
            activeTransactionCount: 0,
            activeBudgetCount: 0,
            totalBudgetLimit: 0,
            currency: "VND",
            excludedAudit: {
              mismatchedSpaceCount: 0,
              mismatchedFundCount: 0,
              inactiveLifecycleCount: 0,
              invalidAmountCount: 0,
              totalExcluded: 0
            }
          }
        };

    res.status(500).json({
      error: error.message || "Failed to generate AI insights",
      fallback: safeFallback
    });
  }
});

// OCR Receipt Scanning Route (Hardened with PENDING status & requiresConfirmation)
app.post("/api/ai/ocr-receipt", async (req, res) => {
  const targetSpaceId = AIPayloadValidator.validateSpaceId(req.body?.spaceId);
  try {
    const { imageBase64, language } = req.body;
    if (!imageBase64 || typeof imageBase64 !== "string") {
      return res.status(400).json({ error: "Missing or invalid imageBase64 data" });
    }

    const langPrompt = language === "vi" ? "Extracted category and merchant names should be natural in Vietnamese." : "Provide in English.";
    
    const prompt = `
Analyze this receipt image and extract key receipt details for Daily Finance 3.0.
${langPrompt}

Extract JSON with structure:
{
  "merchant": "Merchant / Store Name",
  "date": "YYYY-MM-DD or readable date",
  "totalAmount": number,
  "currency": "VND" or "USD",
  "suggestedCategory": "Food & Dining" | "Groceries" | "Shopping" | "Transportation" | "Utilities" | "Health" | "Entertainment" | "Other",
  "items": [
    {"name": "item description", "price": number}
  ],
  "taxAmount": number,
  "confidenceScore": number
}
`;

    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");

    const ai = getGeminiClient();
    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: base64Data,
            },
          },
          { text: prompt },
        ],
      },
      config: {
        responseMimeType: "application/json",
      },
    });

    const text = response.text;
    let parsed = {};
    try {
      parsed = JSON.parse(text || "{}");
    } catch {
      parsed = {};
    }

    res.json({
      ...parsed,
      spaceId: targetSpaceId,
      status: "PENDING",
      requiresConfirmation: true
    });
  } catch (error: any) {
    console.error("OCR Error:", error);
    res.status(500).json({
      error: error.message || "Failed to process receipt",
      fallback: {
        merchant: "Unrecognized Merchant",
        date: new Date().toISOString().split("T")[0],
        totalAmount: 0,
        currency: "VND",
        suggestedCategory: "Shopping",
        items: [],
        taxAmount: 0,
        confidenceScore: 0.0,
        spaceId: targetSpaceId,
        status: "PENDING",
        requiresConfirmation: true
      }
    });
  }
});

// Voice Input Processing Route (Hardened with PENDING status & requiresConfirmation)
app.post("/api/ai/parse-voice", async (req, res) => {
  let spokenText = "";
  const targetSpaceId = AIPayloadValidator.validateSpaceId(req.body?.spaceId);
  try {
    spokenText = req.body?.spokenText || "";
    const language = req.body?.language || "vi";
    if (!spokenText || typeof spokenText !== "string" || !spokenText.trim()) {
      return res.status(400).json({ error: "Missing or empty spokenText parameter" });
    }

    const langPrompt = language === "vi" ? "Xử lý giọng nói bằng Tiếng Việt." : "Process English spoken text.";

    const prompt = `
Parse this user voice command into a structured financial transaction proposal for Daily Finance 3.0 app.
Spoken text: "${spokenText}"
${langPrompt}

Extract JSON with structure:
{
  "type": "Expense" | "Income" | "Transfer",
  "amount": number,
  "currency": "VND" | "USD",
  "category": "Category name",
  "note": "Transaction note or merchant",
  "space": "Personal Wallet" | "Family Wallet" | "Company Fund" | "Class Fund",
  "date": "today"
}
`;

    const ai = getGeminiClient();
    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    let parsed = {};
    try {
      parsed = JSON.parse(response.text || "{}");
    } catch {
      parsed = {};
    }

    res.json({
      ...parsed,
      spaceId: targetSpaceId,
      status: "PENDING",
      requiresConfirmation: true
    });
  } catch (error: any) {
    console.error("Voice parse error:", error);
    res.status(500).json({
      error: error.message || "Voice parsing failed",
      fallback: {
        type: "Expense",
        amount: 0,
        currency: "VND",
        category: "Other",
        note: spokenText || "",
        spaceId: targetSpaceId,
        date: new Date().toISOString().split("T")[0],
        status: "PENDING",
        requiresConfirmation: true
      }
    });
  }
});

async function startServer() {
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
    console.log(`Daily Finance 2.0 Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
