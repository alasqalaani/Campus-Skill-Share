import { Router } from "express";
const router = Router();

router.post("/", async (req, res) => {
  try {
    const { message } = req.body;
    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + process.env.GROQ_API_KEY,
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            {
              role: "system",
              content:
                "You are a helpful assistant for Campus Skill Share, a university peer skill sharing platform. Help students with posting skills, searching the feed, messaging others, and registering.",
            },
            { role: "user", content: message },
          ],
        }),
      },
    );
    const data = (await response.json()) as any;
    console.log("Groq response:", JSON.stringify(data));
    if (!response.ok) {
      return res.status(500).json({ error: "Chatbot error", details: data });
    }
    const reply =
      data.choices?.[0]?.message?.content ||
      "Sorry, I couldn't generate a response.";
    res.json({ reply });
  } catch (error) {
    console.error("Chatbot error details:", error);
    res.status(500).json({ error: "Chatbot error" });
  }
});

export default router;
