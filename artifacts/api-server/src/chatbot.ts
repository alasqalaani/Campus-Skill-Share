import { Router } from "express";
const router = Router();

router.post("/", async (req, res) => {
  try {
    const { message } = req.body;
    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" +
        process.env.GEMINI_API_KEY,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          system_instruction: {
            parts: [
              {
                text: "You are a helpful assistant for Campus Skill Share, a university peer skill sharing platform. Help students with posting skills, searching the feed, messaging others, and registering.",
              },
            ],
          },
          contents: [
            {
              role: "user",
              parts: [{ text: message }],
            },
          ],
        }),
      },
    );
    const data = (await response.json()) as any;
    console.log("Gemini response:", JSON.stringify(data));
    if (!response.ok) {
      return res.status(500).json({ error: "Chatbot error", details: data });
    }
    const reply =
      data.candidates?.[0]?.content?.parts?.[0]?.text ||
      "Sorry, I couldn't generate a response.";
    res.json({ reply });
  } catch (error) {
    console.error("Chatbot error details:", error);
    res.status(500).json({ error: "Chatbot error" });
  }
});

export default router;
