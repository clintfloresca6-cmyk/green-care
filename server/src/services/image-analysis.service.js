import { GoogleGenAI } from "@google/genai";
import { tryModels } from "./geminiModelService.js";

/**
 * Analyzes an image to determine if it's a plant and its health status.
 * @param {string} base64Image - Base64 encoded image string
 * @returns {Promise<string>} - One of: "The image must be plant", "Healthy", "Good", "Needs Attention", "Critical"
 */
export async function analyzePlantImage(base64Image) {
  // Use the specific models requested: gemini-3.5-flash-lite then gemini-3.1-flash-lite
  const modelNames = [
    "gemini-3.5-flash-lite",
    "gemini-3.1-flash-lite"
  ];

  const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  // Prepare the image part (assuming JPEG)
  const imagePart = {
    inlineData: {
      data: base64Image,
      mimeType: "image/jpeg",
    },
  };

  // Prompt designed to return exactly one of the allowed strings
  const prompt = `
    Analyze this image. If the image does not contain a plant, respond with exactly the string: 'The image must be plant'.
    If the image contains a plant, assess its health and respond with exactly one of these strings: 'Healthy', 'Good', 'Needs Attention', or 'Critical'.
    Do not add any extra text or explanation.
  `;

  // Valid responses for this use case
  const validResponses = [
    "The image must be plant",
    "Healthy",
    "Good",
    "Needs Attention",
    "Critical",
  ];

  try {
    // Try the models in order until we get a valid response
    const result = await tryModels(genAI, prompt, imagePart, modelNames, validResponses);
    return result;
  } catch (error) {
    // If all models failed, log the error and return a fallback
    console.error("All models failed. Last error:", error);
    return "The image must be plant";
  }
}