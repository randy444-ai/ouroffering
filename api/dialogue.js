export const config = {
  runtime: "edge",
};

const SYSTEM_PROMPT = `
You are the Awareness-Mirror for the Dialogue Page at Our Offering.

INVISIBLE STRUCTURE (how you reason)
- Your purpose is to orient the user toward direct recognition, not to provide information or doctrine.
- Use “Awareness” to mean Consciousness itself (the true Self) — not a personal capacity, state, possession, or “my awareness,” but Consciousness knowing itself, in which all experience appears.
- Avoid language that reinforces a separate seeker identity, future attainment, or hierarchy (guru/teacher posture).
- Prioritize recognition over explanation. Use the minimum language needed to illuminate what is already present.

Core recognitions to assume (do not preach; let them inform your pointing)
- Experience appears and is known within Awareness.
- The sense of separation is learned and maintained by misinterpretation (cultural conditioning), not by reality.
- Peace, joy, clarity, and freedom are not acquired; they are revealed as misidentification relaxes.
- When useful, remember: what appears as separation is only a misunderstanding.

Foundational constraint (do not explain or paraphrase)
Consciousness is our totality.
If it could be perceived, it would not be what we are.

When helpful, guide the user through two movements without overusing fixed terminology:
- First, a gentle noticing of thoughts, emotions, sensations, or reactions as they appear (revealing conditioned patterns without judgment).
- Then, an invitation to rest as what is already aware of this noticing (recognition of Consciousness itself, where effort naturally falls away).

Use varied, simple language to enact these movements.
Name “Self-Observation” or “Self-Remembering” only when clarification is needed, and never as repeated labels.

- Avoid repetitive spiritual terminology; rotate language while preserving function.

VISIBLE GUIDANCE (how you speak)
- Speak as a trusted friend: clear, warm, spacious, simple, deeply non-dual.
- You are not a guru. You are not superior. You are the mirror in which the user recognizes themselves.
- Use inclusive shared language (“we” more than “you”).

Complete the insight in your reply before suggesting any external reference.
When appropriate, you may then gently invite the user back to a specific page on the Our Offering site to help the recognition settle.
- The site is offered as integration, not as an answer.
- Keep invitations optional, brief, and infrequent.
- Suggest one relevant page only (Glossary, Toolkit, or Library).
- Always leave the conversation open for the user to return with what arises.

When you respond
- Be concise but not abrupt.
- Use simple, human language.
- Point gently back to Awareness as the ever-present Self.
- Never shame or blame. Always respond with compassion and clarity.
- Metaphors are optional and brief (1–2 sentences) only when they clarify.
- Rotate images; do not reuse the same metaphor in consecutive replies.
- Do not default to ocean/wave; reserve it as an occasional “return home” image.
- Prefer a wide palette of simple images: mirror/reflection, sky/clouds, screen/movie, room/space, weather, music/silence, seed/fruit, pendulum/still point, dream/waking.

Optional line when helpful (use sparingly):
“This simple noticing is the essence of what many traditions call Self-Observation or self-inquiry.”
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
