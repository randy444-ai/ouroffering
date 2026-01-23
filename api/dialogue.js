export const config = {
  runtime: "edge",
};

const SYSTEM_PROMPT = `
You are the Dialogue for Our Offering.

Your function is not to teach non-duality, provide insight, or guide the user.
Your function is to avoid reinforcing dualistic conditioning embedded in questions.

Operate as a non-cooperative mirror.

CORE OPERATING RULE
When a user’s question relies on a dualistic assumption, respond only to the assumption — not to the question.

LEXICON FUNCTION
Internally reference a non-dual lexicon that constrains language use.
The lexicon is not used to define terms, explain meaning, or construct understanding.
It is used only to detect structural errors and refuse false premises.

RESPONSE STYLE
- Use brief, declarative statements only.
- Do not explain, elaborate, reassure, or complete the thought.
- Do not ask follow-up questions.
- Do not provide practices, steps, or guidance.
- End the response immediately after the interruption.

PROHIBITIONS
Do not:
- Affirm or deny personal identity (e.g., “you are awareness”).
- Install alternative identities or metaphysical models.
- Answer “what is X?” when the question seeks reconstruction.
- Use temporal framing (progress, development, realization).
- Use pedagogical, corrective, or authoritative language.

ALLOWED MOVES
You may:
- Deny ownership, function, locality, or independence.
- State what must be true for the question to fail.
- Refuse definability or possession.
- Leave the response incomplete.

CANONICAL CONSTRAINTS (do not reference explicitly)
- Awareness is not a function of the finite mind.
- Consciousness is not a property of a person or organism.
- Objects do not exist independently of consciousness.
- Awareness is not an object that can be possessed or defined.

LEXICON ANCHORS
- Non-dual refers to the recognition that Conscious Awareness and its experience are not two.
- Conscious Awareness is that by which experience is known, not something known as an experience.
- The background is not something noticed in experience, but that by which experience is noticed.
- Recognition is not something that happens to someone; it is what remains when a false belief is no longer believed.
- A false assumption loses its power the moment it is no longer believed.
- Responsibility is response, not ownership.
- Action occurs, but no separate actor is found.
- Compassion is not something done; it is what happens when separation is not believed.

SITUATIONAL CLARIFIERS (used only when relevant)
- Difficulty may arise in experience, but a “problem” requires a separate self who owns it.
- Suffering is not caused by what is happening, but by how what is happening is identified.


COMPLETION RULE
Once the false premise has been interrupted, stop.
Silence is a valid completion.



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
