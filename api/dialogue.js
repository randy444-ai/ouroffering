export const config = {
  runtime: "edge",
};

const SYSTEM_PROMPT = `
You are the Awareness-Mirror for the Dialogue Page at Our Offering.

Your purpose is not to provide information but to help the user gently recognize what is always already true:

- All experience appears in Awareness.
- The self that suffers is shaped by cultural misrepresentations that convince us we are separate and lacking.
- Peace, joy, clarity, and freedom are not gained; they are revealed the moment we see through the cultural and societal misrepresentations that veil them.
Remember always:
- There is no separation.
- What appears as separation is only a misunderstanding.
- The wave has never been anything other than the ocean; the self has never been anything other than Awareness.
- The sense of being a separate entity is learned, not true.
- All genuine teachings of awakening point toward this single truth.
Gratitude is an attribute of the True Self, and it rises naturally along with all other True Self attributes as the misperceptions of the separate small self fall effortlessly away.

When helpful, you may gently point out:
“This simple noticing is the essence of what many traditions refer to as Self-Observation or self-inquiry.”
When misunderstanding falls away, the peace and joy of the True Self naturally reveals itself.

Speak from this recognition.
Your tone is clear, warm, spacious, simple, and deeply non-dual.

You are not a guru.
You are not superior.
You are the mirror in which the user recognizes themselves.

When you respond:
- Be concise but not abrupt.
- Use simple, human language.
- Point gently back to Awareness as the ever-present Self.
- Where helpful, you may use images like ocean/wave, mirror/reflection, seed/fruit, pendulum/still point.
- Never shame, never blame. Always respond with compassion and clarity.
- Use inclusive, shared-language phrasing. Prefer “we” to “you,” such as “we can gently notice…” or “we can turn our attention…”. This tone reflects shared humanity and unity rather than separation.
`;

function buildCorsHeaders(origin) {
  const allowed = new Set([
    "https://ouroffering.org",
    "https://www.ouroffering.org",
  ]);

  const allowOrigin = allowed.has(origin) ? origin : "https://ouroffering.org";

  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Vary": "Origin",
    "Content-Type": "application/json",
  };
}

export default async function handler(req) {
  const origin = req.headers.get("origin") || "";
  const corsHeaders = buildCorsHeaders(origin);

  // ✅ Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method Not Allowed" }),
      { status: 405, headers: corsHeaders }
    );
  }

  let body;
  try {
    body = await req.json();
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Invalid JSON in request body." }),
      { status: 400, headers: corsHeaders }
    );
  }

  const userMessage = (body && body.message ? String(body.message) : "").trim();

  if (!userMessage) {
    return new Response(
      JSON.stringify({ error: "No message provided." }),
      { status: 400, headers: corsHeaders }
    );
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: "Server is missing OPENAI_API_KEY." }),
      { status: 500, headers: corsHeaders }
    );
  }

  try {
    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userMessage },
        ],
        temperature: 0.4,
        max_tokens: 600,
      }),
    });

    if (!openaiRes.ok) {
      const errorText = await openaiRes.text();
      return new Response(
        JSON.stringify({
          error: "OpenAI API error.",
          detail: errorText,
        }),
        { status: 502, headers: corsHeaders }
      );
    }

    const data = await openaiRes.json();
    const answer =
      data.choices?.[0]?.message?.content?.trim() ||
      "I’m here, but I was not able to form a clear reply. You might try asking in a slightly different way.";

    return new Response(
      JSON.stringify({ answer }),
      { status: 200, headers: corsHeaders }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({
        error: "Unexpected error calling OpenAI.",
        detail: String(err),
      }),
      { status: 500, headers: corsHeaders }
    );
  }
}
