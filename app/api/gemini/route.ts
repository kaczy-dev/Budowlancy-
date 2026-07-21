import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";

// Initialize GoogleGenAI lazily inside the route handler or at module load with error handling
const getAiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json();
    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json({ error: "Brak poprawnego zapytania." }, { status: 400 });
    }

    const ai = getAiClient();
    if (!ai) {
      // Return a smart local simulated fallback response for offline/preview environments without keys
      return NextResponse.json({
        text: `### 🛠️ Odpowiedź Asystenta Budowlanego (Tryb Offline)

Wygląda na to, że klucz API Gemini nie został jeszcze skonfigurowany w panelu ustawień AI Studio. Jako Twój lokalny kierownik budowy, oto kilka sprawdzonych porad na temat: **"${prompt.substring(0, 40)}${prompt.length > 40 ? "..." : ""}"**:

1. **Bezpieczeństwo na pierwszym miejscu (BHP):** Pamiętaj o noszeniu kompletnych ŚOI (kask, okulary, rękawice, buty ze stalowym noskiem) przy wszelkich pracach budowlanych.
2. **Kalkulacje materiałowe:** Przy zamawianiu betonu lub pustaków zawsze doliczaj **5-10% naddatku** na ubytki, docinki i błędy wykonawcze.
3. **Dokładność:** Każdy etap prac (fundamenty, ściany, stropy) sprawdzaj dwa razy za pomocą poziomicy, lasera krzyżowego oraz sznurków traserskich. Błędy na poziomie fundamentów kumulują się na wyższych kondygnacjach!
4. **Warunki atmosferyczne:** Betonowania nie należy przeprowadzać w temperaturach poniżej 5°C lub powyżej 30°C bez specjalnych domieszek i odpowiedniej pielęgnacji wilgotnościowej.

*Aby uzyskać pełne wsparcie AI i precyzyjne odpowiedzi na Twoje pytania, skonfiguruj klucz \`GEMINI_API_KEY\` w panelu Settings w AI Studio.*`
      });
    }

    // System instruction to guide the AI to act as a highly experienced Polish Construction Manager / Civil Engineer
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `Jesteś ekspertem budowlanym, doświadczonym kierownikiem budowy oraz inspektorem nadzoru o imieniu "Majster AI". Odpowiadasz użytkownikowi w sposób fachowy, konkretny, podając normy budowlane (np. polskie i europejskie normy PN-EN), precyzyjne proporcje mieszanek, porady BHP oraz rady praktyczne. Pisz zwięźle, czytelnie, używając punktorów i pogrubień. Odpowiedz po polsku na zapytanie użytkownika:\n\n"${prompt}"`
            }
          ]
        }
      ]
    });

    const responseText = response.text || "Brak odpowiedzi od asystenta.";
    return NextResponse.json({ text: responseText });

  } catch (error: any) {
    console.error("Gemini API error in server route:", error);
    return NextResponse.json({
      error: "Wystąpił błąd podczas komunikacji z asystentem AI.",
      details: error.message
    }, { status: 500 });
  }
}
