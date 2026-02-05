import { GoogleGenAI } from "@google/genai";

// Initialize the client with the API key from environment variables
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Edits an image using the Gemini 2.5 Flash Image model based on a text prompt.
 * @param base64Data The raw base64 string of the image (without data prefix).
 * @param mimeType The mime type of the image (e.g., 'image/png').
 * @param prompt The text description of the edit.
 * @returns A promise resolving to the base64 data URI of the generated image.
 */
export const editImage = async (base64Data: string, mimeType: string, prompt: string): Promise<string | null> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Data,
              mimeType: mimeType,
            },
          },
          {
            text: prompt,
          },
        ],
      },
    });

    // Iterate through parts to find the image part
    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          const resultMime = part.inlineData.mimeType || 'image/png';
          return `data:${resultMime};base64,${part.inlineData.data}`;
        }
      }
    }
    
    return null;
  } catch (error) {
    console.error("AI Generation Error:", error);
    throw error;
  }
};
