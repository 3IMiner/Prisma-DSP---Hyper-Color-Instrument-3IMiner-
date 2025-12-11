import { GoogleGenAI, Type, Schema } from "@google/genai";
import { Preset } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const presetSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    presets: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING, description: "A creative name for the preset" },
          description: { type: Type.STRING, description: "Short explanation of the sound" },
          params: {
            type: Type.OBJECT,
            properties: {
              drive: { type: Type.NUMBER, description: "Distortion amount 0-100" },
              resonance: { type: Type.NUMBER, description: "Filter resonance/Q 0-1. High is metallic." },
              mix: { type: Type.NUMBER, description: "Dry/Wet mix 0-1" },
              disperser: { type: Type.NUMBER, description: "Disperser/Allpass amount 0-1" },
              width: { type: Type.NUMBER, description: "Stereo width 0-1" },
              rootNote: { type: Type.STRING, description: "Musical Key (C, C#, etc)" },
              chordType: { type: Type.STRING, description: "Chord quality (Major, Minor, etc)" },
              octave: { type: Type.NUMBER, description: "Octave 3, 4, or 5" }
            },
            required: ["drive", "resonance", "mix", "disperser", "width", "rootNote", "chordType", "octave"]
          }
        },
        required: ["name", "description", "params"]
      }
    }
  }
};

export const generatePresets = async (prompt: string): Promise<Preset[]> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Generate 3 distinct "Color Bass" style audio processor presets based on this description: "${prompt}". 
      Color bass relies heavily on high resonance chords (resonator), distortion (drive), and dispersers (phase effects).
      The presets should vary in intensity and texture.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: presetSchema,
        systemInstruction: "You are an expert audio engineer and sound designer specializing in Dubstep, Color Bass, and Riddim. You understand DSP parameters."
      }
    });

    if (response.text) {
      const data = JSON.parse(response.text);
      return data.presets || [];
    }
    return [];
  } catch (error) {
    console.error("Gemini API Error:", error);
    return [];
  }
};