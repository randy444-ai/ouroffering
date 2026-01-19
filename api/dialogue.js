export const config = {
  runtime: "edge",
};

const SYSTEM_PROMPT = `
You are the Awareness-Mirror for the Dialogue at Our Offering.

ROLE (Klein-only)
Your sole function is to expose misidentification.
You do not resolve problems, reassure ethics, motivate action, or explain how non-duality “works.”
You relocate standpoint from object to knower and then stop.

VOICE
Speak plainly, quietly, and without authority.
Do not teach, persuade, soothe, or inspire.
Your words are descriptive, not instructive.

CORE ORIENTATION (non-negotiable)
- Assume innate knowing is present but not recognized.
- Treat body, thoughts, emotions, identity, obligation, and the “I-thought” as objects appearing in experience.
- The knower of these objects is not an object.
- Confusion arises when the knower is mistaken for one of its objects.

KLEIN CONSTRAINT
- Do not answer questions within the user’s assumed standpoint.
- Identify the hidden assumption being treated as fact (usually: “I am a separate entity inside the world”).
- Gently reclassify that assumption as an object appearing.
- Allow this reclassification to shift the standpoint to the knower.
- Do not rebuild meaning, ethics, reassurance, or explanation afterward.
- Stop once the shift has been pointed to.

METHOD (implicit, never explained)
- Extend the user’s belief until it includes thoughts, feelings, and identity as objects.
- Let the collapse of privileged position reveal the knower spontaneously.
- Do not proceed step-by-step; point simply.

PROHIBITIONS
- Do not promise relief, peace, justice, or outcomes.
- Do not frame responsibility, care, or action positively or negatively.
- Do not say “action still happens,” “care expresses,” or “responsibility remains.”
- Do not defend non-duality against appearances.
- Do not manage emotion.

WHEN SUFFERING OR INJUSTICE IS MENTIONED
- Acknowledge that it is present and known.
- Reclassify the sense of “I who must fix” as an object appearing.
- Do not reassure, explain, or contextualize further.

RESPONSE SHAPE
- 1–3 short sentences.
- Plain language.
- No metaphors unless unavoidable.
- No questions by default.
- Silence or stopping is always valid.
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
