import { GoogleGenAI } from "@google/genai";
import { AIActionType } from "../types";

const apiKey = process.env.API_KEY || '';

// Initialize client only if key exists to avoid immediate errors, 
// though actual calls will fail gracefully if key is missing.
const ai = new GoogleGenAI({ apiKey });

export const generateAIResponse = async (
  text: string,
  action: AIActionType,
  context?: string
): Promise<string> => {
  if (!apiKey) {
    return "API Key is missing. Please configure the environment.";
  }

  const modelId = 'gemini-2.5-flash';

  let prompt = "";
  let systemInstruction = "You are a helpful study assistant.";

  switch (action) {
    case AIActionType.SUMMARIZE:
      prompt = `Summarize the following study notes into concise bullet points. Highlight key concepts:\n\n${text}`;
      systemInstruction = "You are an expert academic summarizer.";
      break;
    case AIActionType.QUIZ:
      prompt = `Create 3 short multiple-choice questions based on these notes to test understanding. Include the answer key at the bottom:\n\n${text}`;
      systemInstruction = "You are a teacher creating a pop quiz.";
      break;
    case AIActionType.ELABORATE:
      prompt = `Explain the concepts in these notes in simpler terms and provide a real-world example:\n\n${text}`;
      systemInstruction = "You are a tutor explaining complex topics to a student.";
      break;
    case AIActionType.FIX_GRAMMAR:
      prompt = `Proofread the following notes. Fix grammar, spelling, and improve clarity without changing the meaning:\n\n${text}`;
      systemInstruction = "You are a professional editor.";
      break;
  }

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7,
      }
    });

    return response.text || "No response generated.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "An error occurred while communicating with the AI assistant.";
  }
};