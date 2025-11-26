
import { AISolution, ElementType } from "../types";

// Define schema as plain object for REST API
const responseSchema = {
  type: "OBJECT",
  properties: {
    type: { type: "STRING", enum: [ElementType.MATH, ElementType.TEXT, ElementType.GRAPH] },
    recognizedText: { type: "STRING" },
    solutionText: { type: "STRING", nullable: true },
    latex: { type: "STRING", nullable: true },
    solutionLatex: { type: "STRING", nullable: true },
    graphData: {
      type: "ARRAY",
      nullable: true,
      items: {
        type: "OBJECT",
        properties: {
          x: { type: "NUMBER" },
          y: { type: "NUMBER" }
        },
        required: ["x", "y"]
      }
    }
  },
  required: ["type", "recognizedText"]
};

export interface GeminiModel {
  name: string;
  displayName: string;
  description: string;
  supportedGenerationMethods: string[];
}

export const listAvailableModels = async (token: string): Promise<GeminiModel[]> => {
  if (!token) return [];

  try {
    const isApiKey = !token.startsWith('ya29');
    let url = '';
    let headers: any = {
      'Content-Type': 'application/json'
    };

    if (isApiKey) {
      url = `https://generativelanguage.googleapis.com/v1beta/models?key=${token}`;
    } else {
      url = `https://generativelanguage.googleapis.com/v1beta/models`;
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: headers
    });

    if (!response.ok) {
      console.error("Failed to fetch models");
      return [];
    }

    const data = await response.json();

    // Filter only models that support generateContent
    const models = data.models
      ?.filter((model: any) =>
        model.supportedGenerationMethods?.includes('generateContent')
      )
      .map((model: any) => ({
        name: model.name.replace('models/', ''),
        displayName: model.displayName || model.name,
        description: model.description || '',
        supportedGenerationMethods: model.supportedGenerationMethods || []
      })) || [];

    return models;
  } catch (error) {
    console.error("Error fetching models:", error);
    return [];
  }
};

export const analyzeBoard = async (imageBase64: string, token: string, model: string = "gemini-2.0-flash-exp"): Promise<AISolution> => {
  if (!token) {
    return {
      type: ElementType.TEXT,
      recognizedText: "Auth Error",
      solutionText: "Login richiesto."
    };
  }

  try {
    const cleanBase64 = imageBase64.replace(/^data:image\/(png|jpeg|jpg);base64,/, '');

    // Determine if it's an API Key or OAuth Token
    const isApiKey = !token.startsWith('ya29'); // OAuth tokens usually start with ya29

    let url = '';
    let headers: any = {
      'Content-Type': 'application/json'
    };

    if (isApiKey) {
      url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${token}`;
    } else {
      url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({
        contents: [{
          parts: [
            { inline_data: { mime_type: "image/png", data: cleanBase64 } },
            {
              text: `Sei un motore matematico avanzato per una lavagna digitale.
            
            1. RICONOSCIMENTO: Trascrivi l'input dell'immagine in UNICODE (recognizedText).
               - Esempio: "x²", "√25", "∛8"
            
            2. LATEX: Fornisci SEMPRE la rappresentazione LaTeX nei campi latex e solutionLatex:
               - Frazioni: \\frac{num}{den} es: "1/2" → "\\frac{1}{2}"
               - Esponenti: x^{n} es: "x²" → "x^{2}"
               - Radici: \\sqrt[n]{x} es: "√x" → "\\sqrt{x}", "∛8" → "\\sqrt[3]{8}"
               - Sistemi: \\begin{cases} ... \\\\ ... \\end{cases}
               - Usa \\cdot per moltiplicazione, \\div per divisione
               - Usa \\left( \\right) per parentesi grandi
            
            3. CLASSIFICAZIONE:
               - MATH: espressioni, equazioni, calcoli
               - GRAPH: funzioni con "y=" o "f(x)="
               - TEXT: testo normale

            4. RISOLUZIONE (IMPORTANTE):
               - MATH Espressione: SOLO il risultato finale. Es: "12"
               - MATH Equazione: SOLO il valore. Es: "x = 3"
               - MATH Sistema: SOLO i valori delle incognite separati da virgola. Es: "x = 2, y = -1"
               - NON includere procedimenti, passaggi o spiegazioni
               - Usa frazioni se il risultato è razionale. Es: "\\frac{3}{2}" invece di "1.5"
               - GRAPH: genera 100 punti (x,y)
               - TEXT: lascia solution vuoti
            
            Sii preciso e conciso.`
            }
          ]
        }],
        generationConfig: {
          response_mime_type: "application/json",
          response_schema: responseSchema
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Gemini API Error:", errorData);
      throw new Error(errorData.error?.message || "API Request Failed");
    }

    const data = await response.json();
    const jsonText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!jsonText) throw new Error("No response text");

    return JSON.parse(jsonText) as AISolution;

  } catch (error) {
    console.error("Gemini Vision Error:", error);
    return {
      type: ElementType.TEXT,
      recognizedText: "Errore",
      solutionText: "Riprova."
    };
  }
};
