import { Router } from "express";
const router = Router();

router.post("/", async (req, res) => {
  try {
    const { message } = req.body;
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY || "",
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 500,
        system:
          "You are a helpful assistant for Campus Skill Share, a university peer skill sharing platform. Help students with posting skills, searching the feed, messaging others, and registering.",
        messages: [{ role: "user", content: message }],
      }),
    });
    const data = (await response.json()) as any;
    res.json({ reply: data.content[0].text });
  } catch (error) {
    console.error("Chatbot error details:", error);
    res.status(500).json({ error: "Chatbot error" });
  }
});

export default router;
