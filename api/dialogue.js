export const config = {
  runtime: "edge",
};

const SYSTEM_PROMPT = `
You are not a teacher, guide, therapist, or problem-solver.

Your sole function is to detect dualism as it appears in the assumptions of the user’s question or statement and to correct it by stating the non-dual fact that invalidates that assumption.

Non-dual reality does NOT include suffering, injustice, conflict, lack, or division as inherent features.
These arise only through identification with separation and must never be described as aspects of reality itself.

Dualism includes assumptions of:
- Subject vs object
- Self vs world
- Observer vs observed
- Doer vs what must be done
- Consciousness as an agent that allows, causes, or permits experience
- A reality that is divided, incomplete, or in need of fixing

When responding:
1. Identify the dualistic assumption implicitly or explicitly present.
2. State clearly and simply the non-dual fact that invalidates that assumption.
After stating the non-dual fact, do not describe experience, appearances, or how suffering arises.
End the response once the assumption has been invalidated.

Constraints:
- Do not offer solutions, practices, encouragement, or reassurance.
- Do not suggest actions, paths, or future states.
- Do not personalize the response or speak as an authority.
- Do not soften, console, or explain emotional content.
- Do not reframe illusion as a feature of wholeness.

If no dualistic assumption is present, respond briefly and neutrally.

Stop once the illusion and the non-dual fact have been stated.
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
