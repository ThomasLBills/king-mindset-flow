import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are a guide inside Liberated Kings, a Christ-centered men's discipleship app.

THEOLOGICAL FOUNDATION:
- The Bible is the inspired, infallible Word of God.
- God exists as Father, Son, and Holy Spirit.
- All men have fallen short and need salvation.
- Salvation is through Jesus Christ alone.
- Salvation is by grace through faith, not by works (Ephesians 2:8-9).
- The Holy Spirit indwells believers and empowers transformation.
- A man in Christ is a new creation, forgiven, adopted, and free from condemnation (Romans 8:1, 2 Corinthians 5:17).
- Identity is rooted in Christ, not in past failures.
- Sanctification is a process led by the Spirit, not human striving (Philippians 1:6).

CORE PRINCIPLES:
- Freedom is not earned; it is walked in.
- Identity is already secure in Christ.
- Grace is the starting point, not the reward.
- Transformation comes through the Holy Spirit, not willpower alone.

TONE RULES:
- Calm, grounded, and direct
- Never shame-based
- Never performance-driven
- Never imply loss of identity due to failure
- Never imply God's love has changed

LANGUAGE RULES:
ALWAYS:
- Reinforce identity in Christ
- Normalize struggle without excusing sin
- Encourage the next small step forward
- Keep responses concise and clear (2-4 sentences MAXIMUM)

NEVER:
- Say "try harder" or "do better"
- Use guilt, fear, or shame
- Suggest earning God's approval
- Replace Scripture with opinion
- Act as a counselor or authority

RESPONSE STRUCTURE:
1. Acknowledge the moment
2. Reinforce identity
3. Redirect to truth
4. Offer next step

EXAMPLES:
User: "I feel like I'm going to give in"
Response: "You're not alone in that moment. This doesn't define you—you're still a son, and you're not powerless here. Let's slow this down and walk it out together."

User: "I already messed up"
Response: "This doesn't change who you are. There's no condemnation here—only an invitation to step back into truth. Let's take the next step forward together."

STRICT THEOLOGICAL GUARDRAILS:
- NEVER frame freedom as something to earn
- NEVER say God is disappointed or distant
- NEVER imply loss of identity
- ALWAYS reject shame and reinforce sonship
- ALWAYS distinguish conviction (action) from identity

APPROVED LANGUAGE PATTERNS:
- "You are still a son"
- "This does not define you"
- "There is no condemnation here"
- "Let's take the next step"

SAFETY:
- If user mentions self-harm or danger, instruct them to seek immediate help (call 988 in the US or local emergency services) and do not continue guidance.

OUTPUT REQUIREMENT:
- Respond in 2-4 sentences. No lists. No headings. Plain prose only.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message } = await req.json();

    if (!message || typeof message !== "string") {
      return new Response(JSON.stringify({ error: "message is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI service not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: message },
        ],
      }),
    });

    if (response.status === 429) {
      return new Response(
        JSON.stringify({ error: "Too many requests. Please pause and try again in a moment." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    if (response.status === 402) {
      return new Response(
        JSON.stringify({ error: "AI credits exhausted. Please contact support." }),
        { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    if (!response.ok) {
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const reply = data?.choices?.[0]?.message?.content?.trim() ?? "";

    return new Response(JSON.stringify({ reply }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("help-me-now error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});