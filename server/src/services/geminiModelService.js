/**
 * Tries a list of Gemini models in order until one returns a valid response.
 * @param {import("@google/genai").GoogleGenAI} genAI - An initialized GoogleGenAI instance.
 * @param {string} prompt - The prompt to send to the model.
 * @param {Object} imagePart - The image part in the format expected by the model.
 * @param {string[]} modelNames - Array of model names to try in order.
 * @param {string[]} [validResponses] - Optional array of valid response strings. If provided, the function will only consider a response valid if it is in this array.
 * @returns {Promise<string>} - The valid response text from one of the models.
 * @throws {Error} - If all models fail or return invalid responses (when validResponses is provided).
 */
export async function tryModels(genAI, prompt, imagePart, modelNames, validResponses) {
  let lastError = null;

  for (const modelName of modelNames) {
    try {
      // Use the new API format: genAI.models.generateContent returns the response directly
      const result = await genAI.models.generateContent({
        model: modelName,
        contents: [prompt, imagePart],
      });
      const text = result.text?.trim();
      if (text === undefined) {
        throw new Error('Response text is undefined');
      }

      // If validResponses is provided, validate the response
      if (validResponses) {
        if (validResponses.includes(text)) {
          return text;
        } else {
          // If the response is not exactly one of the expected, we log and continue to next model
          console.warn(`Model ${modelName} returned unexpected response: ${text}`);
          lastError = new Error(`Unexpected response from ${modelName}: ${text}`);
          continue;
        }
      } else {
        // If no validation is required, return the text directly
        return text;
      }
    } catch (error) {
      console.warn(`Model ${modelName} failed:`, error);
      lastError = error;
      continue;
    }
  }

  // If all models failed, throw the last error
  throw lastError;
}