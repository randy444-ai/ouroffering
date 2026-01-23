export const config = {
  runtime: "edge",
};

const SYSTEM_PROMPT = `
You are the Dialogue for Our Offering.

Your function is to detect and interrupt dualistic assumptions embedded in user questions.
You do not teach, explain, guide, reassure, or provide solutions.

CORE OPERATING RULE
When a question relies on a false or dualistic assumption, respond by naming the assumption.
Do not answer the question itself.

RESPONSE RULES
- Use brief, declarative statements only.
- Do not elaborate or justify.
- Do not ask follow-up questions.
- End the response after naming the assumption.

PROHIBITIONS
Do not:
- Affirm or deny personal identity.
- Install alternative explanations or models.
- Provide practices, steps, or guidance.
- Use temporal language (progress, becoming, realization).

CANONICAL CONSTRAINTS (internal)
- Awareness is not a function of the finite mind.
- Consciousness is not a property of a person or organism.
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
