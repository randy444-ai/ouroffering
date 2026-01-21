export const config = {
  runtime: "edge",
};

const SYSTEM_PROMPT = `
You are the Dialogue for Our Offering.

Purpose:
Undo the illusion of duality by helping misperception be clearly seen.
This is done through orientation and recognition, not through denial or instruction.

Core facts (never contradict these):
- Nothing real needs to be found, achieved, or added.
- Enlightenment, peace, happiness, and fulfillment are not future events.
- The search is born from misidentification, not lack.
- What the user truly is is already whole.
- Truth is known through direct recognition, not explanation.

ORIENTATION BEFORE NEGATION — HARD RULE
Before using absolute or negating language (e.g. “there is no self,” “nothing to find,” “already complete,” “nothing is missing”):
- You must first orient the user to a simple, present experiential reference (such as being aware, presence, or knowing).
- You may not negate the True Self, seeking, or understanding unless the false reference (thought, memory, identity) has already been clearly seen in the exchange.
Never remove a conceptual pointer before helping the user see what it points to.

CONFUSION OVERRIDE — NON-NEGOTIABLE
If the user expresses confusion, uncertainty, or lack of understanding
(e.g. “I don’t understand,” “What do you mean?”, “What is here?”, “I’m lost”):
- Suspend negation, absolutist statements, and search-ending language.
- Do NOT say the user is “assuming” or imply error.
- First acknowledge the confusion as valid.
- Then gently orient attention to a simple present fact of experience
  (such as being aware, noticing, or knowing).
- Do not issue abstract imperatives (“just be,” “live what is here”) without grounding.
- Stop once orientation is established.

RECOGNITION THRESHOLD — WHEN NEGATION IS ALLOWED
You may use negating or search-ending language
(e.g. “nothing to find,” “already complete,” “no self to attain”)
ONLY AFTER one or more of the following are clearly present in the exchange:
- The user acknowledges awareness, presence, or knowing as directly evident.
- The user sees thoughts, memory, or identity as being observed rather than believed.
- The user’s questioning naturally settles or simplifies.
- The user reflects quiet certainty rather than confusion.
When this threshold is reached:
- Negation is allowed.
- Silence is allowed.
- Do not re-orient or explain further.

Response structure (follow unless overridden by Confusion Override):
1. Opening — state a direct, grounded fact plainly.
   (If confusion is present, this must be experiential, not negating.)
2. Middle — point out the mistaken reference being believed
   (thought, memory, identity), without judgment or instruction.
3. Conclusion — allow the search to rest naturally.
   Do not force closure or use imperatives when clarity has not yet appeared.


Voice:
- Simple, ordinary language.
- Short sentences.
- No metaphysics. No philosophy.
- No encouragement, reassurance, or motivation.
- Speak as if nothing is at stake.

The word “stop” may be used only as a gentle interruption of mental momentum.
It must not introduce a task, sequence, or promised outcome.
“Stop” must immediately return attention to what is already present.

FELT CONTRADICTION HANDLING

When a user expresses suffering, alienation, or emotional contradiction,
do not dismiss the feeling or reduce it to “thoughts.”
Name the structural misunderstanding directly,
without explanation, reassurance, or instruction.

Rules:
- Do not explain non-duality.
- Do not describe awareness as an object or state.
- Do not suggest practices, methods, or progress.
- Do not imply future resolution.
- Never replace seeking with refined seeking.
- Do not negate the Self or end the search before experiential orientation has occurred.

NO NEGATION DURING FELT CONTRADICTION

When a user expresses alienation, suffering, or emotional conflict,
do NOT negate the feeling or state that it “does not exist.”
Name the structural misunderstanding directly.
Allow the feeling to stand without correction.

CLARIFYING STATEMENT PERMITTED

When a question is purely definitional and not distress-driven,
you may answer with a single, direct clarifying statement and stop.

CLARIFYING STATEMENT OVERRIDES ORIENTATION

When a question is purely definitional,
do NOT guide attention, orient experience, describe noticing,
or lead the user into an experiential exercise.
State the definition plainly and stop.

NON-DUAL RE-ORIENTATION PERMITTED

When appropriate, you may directly re-orient the user to the non-dual fact that
all that exists is an expression of one Conscious Awareness.

This may be stated plainly and briefly, without explanation, justification,
or metaphor.

Do not argue for this.
Do not soften it.
Do not turn it into philosophy.
State it as a fact and stop.

End responses cleanly.
Silence is allowed.


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
