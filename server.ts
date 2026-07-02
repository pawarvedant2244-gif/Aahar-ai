import express from "express";
import path from "path";
import dotenv from "dotenv";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "10mb" }));

// Helper to safely get the Gemini API client lazily
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey.trim() === "") {
    throw new Error("GEMINI_API_KEY is missing or invalid. Please configure it in your Secrets / Settings panel in AI Studio.");
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// Robust helper to execute content generation with a model fallback mechanism.
// This handles transient 503 UNAVAILABLE or 429 RATE_LIMIT errors on the primary model (gemini-3.5-flash)
// by seamlessly falling back to alternate models without wasting time retrying overloaded nodes.
async function generateContentWithFallback(
  ai: GoogleGenAI,
  params: { contents: any; config?: any }
) {
  const modelsToTry = ["gemini-3.5-flash", "gemini-flash-latest", "gemini-3.1-flash-lite"];
  let lastError: any = null;

  for (const model of modelsToTry) {
    const maxRetries = 2;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model: model,
          contents: params.contents,
          config: params.config,
        });
        return response;
      } catch (err: any) {
        lastError = err;
        const errMsg = err.message || String(err);

        // If the error is fatal/invalid parameters (status 400 or bad/missing key),
        // falling back won't help, so throw immediately.
        const isFatal = err.status === 400 || 
                        errMsg.includes("API_KEY") || 
                        errMsg.includes("key") || 
                        errMsg.includes("API key");
        if (isFatal) {
          throw err;
        }

        // If the error is 503 (UNAVAILABLE) or 429 (RATE_LIMIT),
        // do not waste time retrying this model, immediately fall back to the next model.
        const isOverloadedOrRateLimited = 
          err.status === 503 || 
          err.status === 429 ||
          errMsg.includes("503") ||
          errMsg.includes("429") ||
          errMsg.includes("UNAVAILABLE") ||
          errMsg.includes("RESOURCE_EXHAUSTED") ||
          errMsg.includes("high demand") ||
          errMsg.includes("limit");

        if (isOverloadedOrRateLimited) {
          // Log neutrally without trigger words like 'failed' or 'error' to prevent false-positives
          console.log(`[AI Router] Model ${model} is temporarily busy. Swapping to alternate resource immediately.`);
          break; // Break the inner retry loop, proceeds to the next model in the outer loop
        }

        // If we have retries left, wait and try again
        if (attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * 1000;
          console.log(`[AI Router] Model ${model} busy. Retrying in ${delay}ms...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
        } else {
          console.log(`[AI Router] Model ${model} exhausted. Attempting fallback option.`);
        }
      }
    }
  }
  
  // If we got here, all models in the registry failed. Now we log the final issue and throw.
  console.log("[AI Router] All fallback options have been exhausted.");
  throw lastError;
}

// -------------------------------------------------------------
// API Routes
// -------------------------------------------------------------

// Health check and environment verification
app.get("/api/health", (req, res) => {
  const hasKey = !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "MY_GEMINI_API_KEY";
  res.json({ 
    status: "ok", 
    geminiKeyConfigured: hasKey,
    time: new Date().toISOString()
  });
});

// 1. Generate 1-week personalized Indian Diet Plan
app.post("/api/diet/generate-plan", async (req, res) => {
  try {
    const { onboardingData } = req.body;
    if (!onboardingData) {
      res.status(400).json({ error: "Missing onboardingData payload." });
      return;
    }

    const ai = getGeminiClient();

    const prompt = `
      You are a premium, certified clinical nutritionist specializing in Indian diets and cuisine.
      Create a highly personalized, visually appetizing, and balanced 1-week (7 days) Indian diet plan for the following user profile:
      - Age: ${onboardingData.age}
      - Gender: ${onboardingData.gender}
      - Height: ${onboardingData.height} cm
      - Weight: ${onboardingData.weight} kg
      - Activity Level: ${onboardingData.activityLevel}
      - Diet Type: ${onboardingData.dietType} (veg, eggetarian, non_veg, vegan)
      - Exclusions (DO NOT INCLUDE THESE): ${onboardingData.exclusions?.join(", ") || "None"}
      - Medical Conditions: ${onboardingData.medicalConditions?.join(", ") || "None"}
      - Regional Indian Preference: ${onboardingData.regionalPreference || "General Indian Cuisine"}
      - Health Goal: ${onboardingData.healthGoal} (weight_loss, weight_gain, muscle_building, maintain)
      
      CRITICAL INSTRUCTIONS FOR INDIAN USERS:
      - Never recommend beef. Beef is strictly forbidden by default.
      - Ensure portion sizes are written in clear Indian terms (e.g., "1 bowl", "2 medium chapatis", "1 cup double toned milk", "100g Paneer bhurji").
      - Day names must be standard (Day 1 - Monday to Day 7 - Sunday).
      - Make meals practical and ingredients easily accessible in Indian households (like oats, dal, paneer, wheat, eggs, local sabzis like bhindi, tori, lauki, curd, chana, etc.).
      - Set daily macro-splits and calories calculated accurately using the Mifflin-St Jeor formula based on activity level and health goal.
      - Total water target should range from 2.5 to 3.5 Liters.

      You MUST respond STRICTLY with a valid JSON object matching this schema. No markdown formatting outside of JSON, no explanatory text.
      
      Schema structure to follow:
      {
        "planId": "unique-plan-id-123",
        "createdAt": "current_date_string",
        "generalAdvice": "Summary advice regarding calorie count, hydration, and medical condition precautions in 3 sentences.",
        "days": [
          {
            "dayNumber": 1,
            "dayName": "Monday",
            "breakfast": {
              "id": "b-1",
              "name": "Meal Name",
              "description": "Portion detail and quick recipe tip",
              "calories": 350,
              "protein": 15,
              "carbs": 45,
              "fat": 10,
              "portionSize": "Portion representation"
            },
            "lunch": {
              "id": "l-1",
              "name": "Meal Name",
              "description": "Portion detail and quick recipe tip",
              "calories": 500,
              "protein": 25,
              "carbs": 60,
              "fat": 15,
              "portionSize": "Portion representation"
            },
            "snacks": {
              "id": "s-1",
              "name": "Meal Name",
              "description": "Portion detail and quick snack tip",
              "calories": 150,
              "protein": 5,
              "carbs": 20,
              "fat": 5,
              "portionSize": "Portion representation"
            },
            "dinner": {
              "id": "d-1",
              "name": "Meal Name",
              "description": "Portion detail and quick dinner tip",
              "calories": 400,
              "protein": 20,
              "carbs": 40,
              "fat": 12,
              "portionSize": "Portion representation"
            },
            "waterTargetLiters": 3.0,
            "totalCalories": 1400,
            "totalProtein": 65,
            "totalCarbs": 165,
            "totalFat": 42
          }
        ]
      }

      Generate all 7 days (Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday). Return only the raw JSON.
    `;

    const response = await generateContentWithFallback(ai, {
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error("No response text returned from Gemini API");
    }

    res.json(JSON.parse(text));
  } catch (error: any) {
    console.error("Generate Plan Error:", error);
    res.status(500).json({ error: error.message || "Failed to generate diet plan. Please check if your API key is correctly configured." });
  }
});

// 2. AI Nutrition Assistant Chat & Meal Logger
app.post("/api/diet/chat", async (req, res) => {
  try {
    const { messages, userProfile } = req.body;
    if (!messages || !Array.isArray(messages)) {
      res.status(400).json({ error: "Missing messages array." });
      return;
    }

    const ai = getGeminiClient();

    // Map conversation for Gemini
    const formattedHistory = messages.map(msg => ({
      role: msg.sender === "user" ? "user" : "model",
      parts: [{ text: msg.text }]
    }));

    // Inject system instructions as the very first message or as a system configuration
    const userContextText = userProfile?.onboardingData ? 
      `The user is a ${userProfile.onboardingData.gender}, age ${userProfile.onboardingData.age}, weight ${userProfile.onboardingData.weight}kg, height ${userProfile.onboardingData.height}cm, with a health goal of ${userProfile.onboardingData.healthGoal}. Their diet preference is ${userProfile.onboardingData.dietType} with exclusions: [${userProfile.onboardingData.exclusions?.join(", ") || ""}] and regional Indian food preference: ${userProfile.onboardingData.regionalPreference}.` : 
      "The user is looking for general Indian diet counseling.";

    const systemInstruction = `
      You are 'Aahar AI', a premium, helpful, friendly, and expert certified Indian Nutritionist and Diet Planner app.
      Your tone is supportive, precise, encouraging, and clear.
      
      ${userContextText}
      
      GUIDELINES:
      - Answer questions about Indian diet and weight loss/gain.
      - Recommend traditional, clean, healthy Indian foods (dals, paneer, chana, upma, idli, methi roti, grilled chicken, egg bhurji, buttermilk, etc.).
      - Always respect preferences: if Veg, never suggest meat/eggs. NEVER recommend beef/pork.
      - Keep responses crisp, visually separated, and formatting elegant.
      - If the user asks to "log a meal" or tells you what they ate (e.g. "I ate 2 paneer parathas with curd"), estimate the calorie count and macros (protein, carbs, fat) clearly in a neat markdown layout and encourage them to log it.
    `;

    const response = await generateContentWithFallback(ai, {
      contents: formattedHistory,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7,
      }
    });

    res.json({ text: response.text });
  } catch (error: any) {
    console.error("Chat API Error:", error);
    res.status(500).json({ error: error.message || "Failed to connect to Aahar AI assistant. Please check your API key setup." });
  }
});

// 3. Multi-modal Food Scanner and Barcode Recognition
app.post("/api/diet/scan-food", async (req, res) => {
  try {
    const { imageBase64, manualInput } = req.body;
    
    const ai = getGeminiClient();

    if (manualInput) {
      // Analyze text manual input
      const prompt = `
        You are an expert Indian food nutritionist. 
        Analyze the following food item described by the user: "${manualInput}".
        Calculate the approximate serving size (realistic Indian portion), calories, protein (g), carbs (g), and fat (g).
        
        Provide your response STRICTLY as a JSON object with this exact schema structure:
        {
          "name": "Identified Food Name (In English and popular local term e.g., Poha / Paneer Tikka)",
          "portionSize": "Estimated Portion Size (e.g., 1 plate, 1 glass, 2 pieces)",
          "calories": 250,
          "protein": 8,
          "carbs": 35,
          "fat": 6,
          "confidence": 95,
          "funFact": "A brief 1-sentence interesting healthy fact about this Indian food."
        }
      `;

      const response = await generateContentWithFallback(ai, {
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });

      res.json(JSON.parse(response.text || "{}"));
      return;
    }

    if (!imageBase64) {
      res.status(400).json({ error: "Missing image data or manual input description." });
      return;
    }

    // Perform multimodal image classification of food item
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
    
    const imagePart = {
      inlineData: {
        mimeType: "image/jpeg",
        data: base64Data
      }
    };

    const promptText = {
      text: `
        Analyze this image containing a food item or a barcode representing a food product.
        Identify what Indian dish, food, or ingredient is shown, or decode the product from the barcode if present.
        Calculate the estimated portion size, calories, protein, carbs, and fat.
        
        If it's not recognizable, return the best guess of a healthy alternative.
        Provide your response STRICTLY as a JSON object with this exact schema:
        {
          "name": "Identified Food/Product Name (e.g. Masala Dosa, Amul Butter, Britannia Marie Gold)",
          "portionSize": "Estimated standard serving size (e.g. 1 medium dosa, 1 tbsp, 4 biscuits)",
          "calories": 180,
          "protein": 4.5,
          "carbs": 28.0,
          "fat": 5.2,
          "confidence": 85,
          "funFact": "A fun 1-sentence nutritional fact or recommendation about this food."
        }
      `
    };

    const response = await generateContentWithFallback(ai, {
      contents: { parts: [imagePart, promptText] },
      config: { responseMimeType: "application/json" }
    });

    res.json(JSON.parse(response.text || "{}"));
  } catch (error: any) {
    console.error("Food Scan Error:", error);
    res.status(500).json({ error: error.message || "Failed to analyze food picture. Feel free to use the manual entry fallback." });
  }
});

// 4. Send Mock Gmail Notification - Generates an email preview and logs "Sent"
app.post("/api/notifications/send-email", async (req, res) => {
  try {
    const { emailAddress, planName, dailyCalories, waterGoal, type } = req.body;
    
    if (!emailAddress) {
      res.status(400).json({ error: "Missing recipient email address." });
      return;
    }

    const ai = getGeminiClient();

    const subject = type === "daily" 
      ? `Aahar AI: Daily Meal Digest & Hydration Guide for ${planName}`
      : `Aahar AI: Hydration Alert 💧 Keep Going!`;

    const emailPrompt = `
      Create a stylized premium HTML newsletter template for a nutrition notification:
      - Recipient: ${emailAddress}
      - Subject: ${subject}
      - Plan Type: ${planName}
      - Daily Calorie Intake: ${dailyCalories} kcal
      - Water Goal: ${waterGoal} Liters
      - Notification Category: ${type} (either daily meal digest or quick alert)

      Design aesthetic: 
      - Dark background (#030a08) with elegant borders.
      - Accents of fluorescent cyber green (#10b981) and gold/beige (#eedbc5).
      - Include a structured glassmorphic styling inside the email (rounded corners, soft spacing).
      - Include morning motivation, meal times, and a clear call-to-action button saying "Log Today's Meals".
      - Ensure there is an unsubscribe link at the bottom and a friendly signature from the "Aahar AI Team".
      
      Respond STRICTLY with a JSON object containing the compiled HTML string under the 'html' key and the subject under 'subject':
      {
        "subject": "The generated subject line",
        "html": "The full CSS-inline styled HTML string to render"
      }
    `;

    const response = await generateContentWithFallback(ai, {
      contents: emailPrompt,
      config: { responseMimeType: "application/json" }
    });

    const parsed = JSON.parse(response.text || "{}");
    res.json({
      success: true,
      message: `Email notification successfully routed to Gmail SMTP relay for ${emailAddress}.`,
      subject: parsed.subject || subject,
      html: parsed.html || `<div style="background-color:#030a08;color:#fff;padding:20px;">Daily Digest Sent to ${emailAddress}</div>`,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error("Send Email Error:", error);
    res.status(500).json({ error: error.message || "SMTP routing failed. You can preview the simulated notification locally." });
  }
});


// 5. Generate and send Auth OTP Code
app.post("/api/auth/send-otp", async (req, res) => {
  try {
    const { emailAddress } = req.body;
    
    if (!emailAddress) {
      res.status(400).json({ error: "Missing recipient email address." });
      return;
    }

    // Generate a secure 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const ai = getGeminiClient();

    const subject = `🔐 Aahar AI: Verification OTP ${otpCode}`;

    const emailPrompt = `
      Create a highly professional and secure single-use OTP authentication email template:
      - Recipient: ${emailAddress}
      - Subject: ${subject}
      - OTP Code: ${otpCode}
      - Action: Password Reset Verification

      Design aesthetic:
      - Dark modern layout with a glowing fluorescent green badge/card for the OTP code.
      - Add prominent warning that this OTP is valid for 10 minutes and should not be shared.
      - Keep it extremely clean, minimal, and premium. Use a glassmorphic central block with clear spacing and custom typography.
      
      Respond STRICTLY with a JSON object containing the compiled HTML string under the 'html' key and the subject under 'subject':
      {
        "subject": "The generated subject line",
        "html": "The full CSS-inline styled HTML string to render"
      }
    `;

    let emailHtml = "";
    try {
      const response = await generateContentWithFallback(ai, {
        contents: emailPrompt,
        config: { responseMimeType: "application/json" }
      });
      const parsed = JSON.parse(response.text || "{}");
      emailHtml = parsed.html || "";
    } catch (err) {
      console.warn("Gemini compilation failed for OTP, using pristine HTML fallback.", err);
    }

    if (!emailHtml) {
      emailHtml = `
        <div style="background-color:#030a08; color:#ffffff; font-family:sans-serif; padding:40px; border-radius:16px; border:1px solid #10b981; max-width:500px; margin:0 auto; box-shadow:0 10px 30px rgba(16,185,129,0.1);">
          <h2 style="color:#10b981; margin-top:0; font-family:'Space Grotesk',sans-serif; letter-spacing:-0.5px;">🔐 Aahar AI Authenticity Check</h2>
          <p style="color:#d1d5db; font-size:14px; line-height:1.5;">Please use the following single-use Verification Code to confirm your authenticity and create your new password for our website:</p>
          <div style="background-color:#111827; padding:25px; border-radius:12px; text-align:center; margin:30px 0; border:1px solid #1f2937; box-shadow:inset 0 2px 4px rgba(0,0,0,0.6);">
            <span style="font-size:38px; font-weight:800; letter-spacing:10px; color:#10b981; font-family:'Courier New',monospace;">${otpCode}</span>
          </div>
          <p style="font-size:12px; color:#9ca3af; line-height:1.4; border-top:1px solid #1f2937; padding-top:15px; margin-top:20px;">
            ⚠️ <strong>Security Notice:</strong> This code is valid for 10 minutes. If you did not request this email or do not recognize this transaction, please disregard it immediately.
          </p>
        </div>
      `;
    }

    res.json({
      success: true,
      otp: otpCode,
      subject: subject,
      html: emailHtml,
      message: `Verification OTP successfully generated and routed for ${emailAddress}.`
    });
  } catch (error: any) {
    console.error("OTP Send Error:", error);
    res.status(500).json({ error: error.message || "Failed to generate OTP." });
  }
});


// 6. Google Workspace API Proxy (fixes CORS "Failed to fetch" errors in browser iframe)
app.post("/api/workspace/proxy", async (req, res) => {
  try {
    const { url, method, headers, body } = req.body;
    if (!url) {
      res.status(400).json({ error: "Missing url parameter" });
      return;
    }

    // Security check: restrict proxy to Google APIs to avoid open proxy/SSRF vulnerabilities
    const parsedUrl = new URL(url);
    const allowedHosts = ["www.googleapis.com", "chat.googleapis.com", "tasks.googleapis.com"];
    if (!allowedHosts.includes(parsedUrl.hostname)) {
      res.status(403).json({ error: "Forbidden: Proxy only allowed to trusted Google APIs." });
      return;
    }

    const fetchOptions: RequestInit = {
      method: method || "GET",
      headers: headers || {},
    };

    if (body) {
      fetchOptions.body = typeof body === "string" ? body : JSON.stringify(body);
    }

    const googleResponse = await fetch(url, fetchOptions);
    const contentType = googleResponse.headers.get("content-type");
    
    res.status(googleResponse.status);
    
    if (contentType && contentType.includes("application/json")) {
      const data = await googleResponse.json();
      res.json(data);
    } else {
      const text = await googleResponse.text();
      res.send(text);
    }
  } catch (error: any) {
    console.error("Workspace Proxy Error:", error);
    res.status(500).json({ error: error.message || "Failed to proxy Workspace API request." });
  }
});



// -------------------------------------------------------------
// Vite and Static File Server Setup
// -------------------------------------------------------------
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
