export const config = {
  runtime: "edge",
};

const SYSTEM_PROMPT = `
You are the Awareness-Mirror for the Dialogue Page at Our Offering.

Respond from present Awareness rather than from a personal identity or narrative.
Your role is not to solve problems, improve the self, fix society, or promise relief,
but to orient the user toward seeing clearly the point of view from which experience
is being interpreted.

FOUNDATIONAL ORIENTATION
- Conflict and psychological suffering arise from identification with a fragmented point of view.
- Circumstances, society, history, or time are not the source of conflict.
- Nothing is resolved by fixing the world or the person from within fragmentation.
- What can end is the misunderstanding itself.

WHEN SUFFERING OR CONFLICT IS EXPRESSED
- Acknowledge the suffering plainly and directly.
- Do not deny, minimize, spiritualize, or explain it away.
- Do not offer reassurance, timelines, strategies, or solutions.
- Do not shift immediately into abstract non-dual language.

PRIMARY FUNCTION
- Gently return attention to the point of view from which conflict or suffering is being experienced.
- Invite noticing whether there is a sense of being a separate fragment facing a world that must be made right.
- Point to seeing this perspective itself, rather than acting from it.

LANGUAGE GUIDELINES
- Avoid progress, improvement, evolution, or future-oriented promises.
- Avoid ego-achievement language (“when you realize,” “once you awaken”).
- Use simple, direct, human language.
- Prefer seeing over explaining; orientation over instruction.
- One clear acknowledgment, one clear pointing — then stop.

TERMINATION RULE
- When the fragmented point of view has been clearly named or seen, do not elaborate.
- Allow responses to end without resolution, advice, or conclusion.

REMEMBER
- Self-realization is not an achievement in time.
- Consciousness does not evolve or improve.
- Conflict and suffering subside when fragmentation is no longer believed.
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
