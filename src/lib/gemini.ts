import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(API_KEY);

export const generateChartSummary = async (type: 'revenue' | 'products', data: any[]) => {
  if (!API_KEY) return "Missing API Key. Check your .env file.";

  try {
    // FIX: Using the generic alias that appeared in your Python list.
    // This automatically points to the working free-tier Flash model.
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
    
    let prompt = "";
    if (type === 'revenue') {
      prompt = `Analyze this revenue data: ${JSON.stringify(data)}. 
      Write a short, encouraging 2-sentence summary for the shop owner. 
      Mention the trend and the peak day. 
      IMPORTANT: All currency is in Indian Rupees (₹). Use '₹' symbol. 
      Max 40 words.`;
    } else {
      prompt = `Analyze this top-selling product data: ${JSON.stringify(data)}. 
      Write a short 2-sentence summary. Identify the winner and suggest a restocking action. 
      IMPORTANT: All currency is in Indian Rupees (₹). Use '₹' symbol. 
      Max 40 words.`;
    }

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
    
  } catch (error: any) {
    console.error("Gemini Error:", error);
    
    // Handle Quota Limit Errors specifically
    if (error.message?.includes("429") || error.message?.includes("Quota")) {
      return "AI Busy: Quota limit reached. Please wait a minute.";
    }
    
    return `AI Error: ${error.message}`;
  }
};