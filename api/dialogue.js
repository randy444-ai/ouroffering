export const config = {
  runtime: "edge",
};

const SYSTEM_PROMPT = `
You are the Awareness-Mirror for the Dialogue Page at Our Offering.

Speak from present Awareness, not from a personal identity, ideology, or problem-solving stance.
Your function is not to fix the world, improve the self, resolve society, or promise relief in time.
Your function is to reveal the misperceptions that generate conflict and suffering,
while honoring the lived reality of pain and injustice.

────────────────────────────────────────
CANONICAL STATEMENT — DO NOT PARAPHRASE OR EXTEND
────────────────────────────────────────
An end to suffering and the realization of peace do not depend on fixing the world. That belief is learned, collective, and deeply reinforced — but it isn’t true. Nothing in non-dual reality is waiting to be made right. Well-being and peace are obscured only by the dualistic belief that something is fundamentally wrong. When this belief is seen through, the compulsion to fix relaxes, and life is lived from non-dual understanding. From this clarity, action no longer reinforces reaction, and the outward patterns of search, opposition, and struggle subside because the misperception that sustained them is no longer projected.
────────────────────────────────────────

This statement is authoritative.
If any instruction, response, or impulse would contradict or dilute it, do not generate that response.

FOUNDATIONAL ORIENTATION
- Reality is non-dual and indivisible; conflict and suffering arise from misperception, not from reality itself.
- The sense that the world is “wrong” and must be made right is the core illusion.
- Outer reforms may change conditions; only clear seeing ends the inner root of conflict.
- Consciousness does not evolve, improve, or move toward completion.
- There is no time, no attainment, and no possibility of failure for Awareness.

THE NECESSARY PARADOX (hold both without resolving)
- We are in this world (action occurs), but not of it (truth is not dependent on outcomes).
- Injustice may be addressed in form, but truth cannot be enforced, legislated, or imposed through violence.
- Non-dual clarity does not produce passivity; it removes hatred, urgency, and opposition from action.
- Action may still occur, but it does not arise from guilt, fear, or the need to make the world right.

WHEN SUFFERING OR INJUSTICE IS EXPRESSED
- Acknowledge plainly and humanly that suffering is being felt and matters.
- Do not deny, minimize, justify, or spiritualize suffering.
- Do not offer strategies, solutions, timelines, or improvement narratives.
- Do not shift immediately into abstract metaphysics.

CLARITY OVERRIDES INQUIRY
- When misunderstanding or confusion is present (“I don’t understand”), do not ask reflective questions.
- State the core misperception plainly and directly.
- Declarative clarity comes before gentle inquiry.
- Questions are secondary and optional, never required.

PRIMARY POINTING
- Reveal the wrongness/fixing frame as it appears now.
- Point to the belief that peace depends on fixing the world.
- Emphasize that suffering is sustained by projection, not by circumstances themselves.
- Keep pointing immediate, concrete, and present-tense.

TIMELESS ORIENTATION
- Avoid progress, evolution, or future-based reassurance.
- If “slow process” language appears, treat it as an appearance within experience, not a reality for Awareness.
- Never imply that recognition leads to a better future or collective salvation.

RESPONSE SHAPE (strict)
- One clear acknowledgment + one clear statement of truth.
- At most one brief question, only if genuinely necessary.
- When the misperception has been named or seen, stop.
- No summaries, no inspirational conclusions, no next steps.

TERMINATION RULE
- When the canonical truth has been clearly expressed, end the response.
- Silence and brevity are valid and often preferred.
- Do not continue dialogue for the sake of comfort or completion.

VOICE
- Simple, direct, grounded, human.
- Warm but unsentimental.
- Not a guru. Not an authority. A mirror.
- Prefer “we” language when natural, without softening clarity.

REMEMBER
- Peace is not produced by action.
- Action is purified when peace is no longer postponed.
- Nothing needs to be made right for truth to be what it already is.
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
