import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-initialized Gemini client
let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is missing. Please add it to your Secrets or .env file.");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// Video analysis API route
app.post("/api/ai/analyze-video", async (req: any, res: any) => {
  try {
    const { title, description, category, channelName } = req.body;
    if (!title) {
      return res.status(400).json({ error: "Title is required for analysis." });
    }

    const ai = getGeminiClient();

    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        summary: {
          type: Type.STRING,
          description: "A professional and high-quality summary of the video content, in the same language as the title/description.",
        },
        keyTakeaways: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              concept: { type: Type.STRING, description: "Key concept name." },
              details: { type: Type.STRING, description: "Detailed explanation of the concept." },
            },
            required: ["concept", "details"],
          },
          description: "List of 3-5 key educational or technical concepts or takeaways from the video.",
        },
        targetAudience: {
          type: Type.STRING,
          description: "Who should watch this video and what benefits they will get.",
        },
        quiz: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              question: { type: Type.STRING, description: "Multiple choice question." },
              options: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Exactly 4 options.",
              },
              answerIndex: { type: Type.INTEGER, description: "0-based index of the correct option (0, 1, 2, or 3)." },
              explanation: { type: Type.STRING, description: "Brief explanation of why the answer is correct." },
            },
            required: ["question", "options", "answerIndex", "explanation"],
          },
          description: "3 highly relevant multiple choice quiz questions to test the user's comprehension of the video.",
        },
      },
      required: ["summary", "keyTakeaways", "targetAudience", "quiz"],
    };

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Analyze the following video details and generate a comprehensive educational profile including summary, key takeaways, target audience, and a 3-question multiple choice quiz:
Title: ${title}
Description: ${description || "No description provided."}
Category: ${category || "General"}
Channel: ${channelName || "Unknown Channel"}

IMPORTANT: If the title or description is mostly in Arabic, generate all response texts (summary, takeaways, audience, questions, options, explanation) in classical beautiful Arabic. Otherwise, generate in clear professional English.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error("Empty response received from Gemini.");
    }

    const parsedData = JSON.parse(text);
    return res.json(parsedData);
  } catch (error: any) {
    console.error("AI Analysis Error:", error);
    return res.status(500).json({
      error: error.message || "An error occurred during video analysis.",
    });
  }
});

// Video interactive Q&A chatbot API route
app.post("/api/ai/chat-video", async (req: any, res: any) => {
  try {
    const { title, description, category, channelName, message, chatHistory } = req.body;
    if (!title || !message) {
      return res.status(400).json({ error: "Title and message are required." });
    }

    const ai = getGeminiClient();

    // Construct chat prompt including video context and chat history
    const contextPrompt = `You are a helpful educational AI Video Assistant for MYtube.
You are helping the user understand and explore this video:
Title: ${title}
Description: ${description || "No description provided."}
Category: ${category || "General"}
Channel: ${channelName || "Unknown Channel"}

Answer the user's question accurately based on this context. Be concise, friendly, and structured. Use bullet points if necessary.
If the question is in Arabic or the video is mostly in Arabic, reply in beautiful classical Arabic. Otherwise, reply in English.`;

    const contents: any[] = [];
    
    // Add system-like behavior as first user content
    contents.push({
      role: "user",
      parts: [{ text: contextPrompt }]
    });
    contents.push({
      role: "model",
      parts: [{ text: "Understood! I will act as a helpful AI assistant for this video and answer all questions in the requested language." }]
    });

    // Add chat history
    if (chatHistory && Array.isArray(chatHistory)) {
      chatHistory.forEach((msg: any) => {
        contents.push({
          role: msg.role === "user" ? "user" : "model",
          parts: [{ text: msg.text }]
        });
      });
    }

    // Add current user message
    contents.push({
      role: "user",
      parts: [{ text: message }]
    });

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: contents,
    });

    const text = response.text;
    if (!text) {
      throw new Error("No response text received from Gemini.");
    }

    return res.json({ response: text });
  } catch (error: any) {
    console.error("AI Chat Error:", error);
    return res.status(500).json({
      error: error.message || "An error occurred during interactive video chat.",
    });
  }
});

// AI Insights and personalized learning persona API route
app.post("/api/ai/viewer-insights", async (req: any, res: any) => {
  try {
    const { watchedVideos, language } = req.body;
    if (!watchedVideos || !Array.isArray(watchedVideos) || watchedVideos.length === 0) {
      return res.status(400).json({ error: "At least one watched video is required to generate insights." });
    }

    const ai = getGeminiClient();

    const videoListText = watchedVideos.map((v: any, i: number) => `${i + 1}. Title: "${v.title}" (Category: ${v.category})`).join("\n");

    const prompt = `Analyze this user's video watch history and generate a beautifully customized, personalized learning/interest profile:
${videoListText}

Generate the response in strict JSON format matching this schema:
{
  "persona": "A creative, evocative 2-4 word title for their learning persona (e.g. 'Cosmic Explorer', 'Pragmatic Developer', 'المهندس الفضولي')",
  "description": "A warm, inspiring, highly customized paragraph analyzing what topics they are deeply drawn to, their learning curiosity, and habits.",
  "strengths": ["Interest strength 1", "Interest strength 2", "Interest strength 3"],
  "recommendations": [
    { "topic": "Suggested Study Topic 1", "reason": "Why they would find this fascinating based on their watch pattern." },
    { "topic": "Suggested Study Topic 2", "reason": "Why they would find this fascinating based on their watch pattern." }
  ]
}

IMPORTANT: If the requested language is 'ar' (Arabic), generate all JSON string values in elegant, classical, beautifully styled Arabic. Otherwise, generate in clear, professional English. Do not include markdown codeblocks (like \`\`\`json) in the raw content, return only raw valid JSON.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error("Empty response received from Gemini.");
    }

    const parsedData = JSON.parse(text);
    return res.json(parsedData);
  } catch (error: any) {
    console.error("AI Insights Generation Error:", error);
    return res.status(500).json({
      error: error.message || "An error occurred during viewer insights generation.",
    });
  }
});

// AI Channel Analysis API route
app.post("/api/ai/channel-insights", async (req: any, res: any) => {
  try {
    const { channelName, videoTitles, language } = req.body;
    if (!channelName) {
      return res.status(400).json({ error: "Channel name is required to generate insights." });
    }

    const ai = getGeminiClient();

    const videoListText = (videoTitles || []).map((t: string, i: number) => `- ${t}`).join("\n");

    const prompt = `Analyze this video creator's channel and generate an elegant, creative summary analysis of their channel identity, content style, and learning impact:
Channel Name: "${channelName}"
Published Videos:
${videoListText}

Generate the response in strict JSON format matching this schema:
{
  "focus": "A creative 2-4 word description of their content core focus (e.g. 'Advanced Frontend Architectures', 'علم الفلك والكون')",
  "about": "A paragraph explaining who this channel is for, what kind of values they deliver, and what makes their videos stand out.",
  "achievements": ["Key focus area or learning outcome 1", "Key focus area or learning outcome 2", "Key focus area or learning outcome 3"],
  "aiVerdict": "An inspiring sentence summarizing the AI's verdict on why this channel is highly recommended for knowledge seekers."
}

IMPORTANT: If the requested language is 'ar' (Arabic), generate all JSON string values in elegant, classical, beautifully styled Arabic. Otherwise, generate in clear, professional English. Do not include markdown codeblocks (like \`\`\`json) in the raw content, return only raw valid JSON.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error("Empty response received from Gemini.");
    }

    const parsedData = JSON.parse(text);
    return res.json(parsedData);
  } catch (error: any) {
    console.error("AI Channel Insights Error:", error);
    return res.status(500).json({
      error: error.message || "An error occurred during channel insights generation.",
    });
  }
});

// Vite middleware integration
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
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
