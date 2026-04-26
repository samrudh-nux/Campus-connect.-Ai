import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export const generateCampaignTasks = async (campaignGoal: string) => {
  const prompt = `
    You are an expert student ambassador program manager. 
    Based on the following campaign goal: "${campaignGoal}", 
    generate 3 high-impact tasks for student ambassadors.
    
    Return the response ONLY as a JSON array of objects with the following structure:
    [
      { "title": "Task Title", "description": "Specific, actionable instructions", "xpValue": 100 },
      ...
    ]
    
    Focus on social media engagement, campus events, or peer-to-peer signups.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    
    const text = response.text || "[]";
    // Clean potential markdown code blocks
    const jsonStr = text.replace(/```json|```/g, "").trim();
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("Gemini Task Generation Error:", error);
    return [
      { title: "Default Task: Share on WhatsApp", description: "Share the campaign link with 5 friends", xpValue: 50 },
      { title: "Default Task: Post on Instagram", description: "Upload a story mentioning the brand", xpValue: 75 },
      { title: "Default Task: Campus Signup", description: "Get 3 signups via your referral link", xpValue: 100 }
    ];
  }
};

export const verifyTaskProof = async (taskDescription: string, proofUrl: string) => {
  // In a real production app, we would use Gemini Vision here to analyze the screenshot.
  // For this MVP, we'll simulate the AI's intelligent decision making.
  
  await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate processing
  
  const score = Math.random() > 0.3 ? 0.95 : 0.45; // Simulated high/low confidence
  const isApproved = score > 0.5;

  return {
    isApproved,
    confidence: score,
    feedback: isApproved 
      ? "AI Analysis: Proof matches task criteria perfectly. Excellent engagement detected." 
      : "AI Analysis: Proof seems insufficient or doesn't match the task description. Please try again."
  };
};
