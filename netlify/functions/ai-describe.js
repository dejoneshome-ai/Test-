/*
  ============================================================
  NETLIFY SERVERLESS FUNCTION — ai-describe.js
  ============================================================
  What is this file?
  ------------------
  This is a tiny program that runs on Netlify's servers
  (NOT in the user's browser). When the "Generate" button
  is clicked on the web page, the browser sends a message
  to THIS file, which then:

    1. Reads your Claude API key from Netlify's environment
       variables (so the key is never visible to anyone
       visiting your website)
    2. Sends the user's plain-English note to Claude AI
    3. Gets back a professional description
    4. Sends it to the browser

  How to set up the API key in Netlify:
  --------------------------------------
  1. Go to your Netlify site dashboard
  2. Site configuration → Environment variables
  3. Add a variable named:   ANTHROPIC_API_KEY
     with the value of your key from console.anthropic.com
  4. Redeploy the site (Netlify does this automatically
     if you've connected your GitHub repo)

  Netlify automatically makes this file available at the URL:
  /.netlify/functions/ai-describe
  ============================================================
*/

exports.handler = async function (event) {

  // Only allow POST requests — the browser always sends POST here
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  // --- Parse the incoming request ---
  let prompt;
  try {
    const body = JSON.parse(event.body || "{}");
    prompt = (body.prompt || "").trim();
  } catch (_) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Could not read the request." }),
    };
  }

  if (!prompt) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "No description was provided." }),
    };
  }

  // --- Check the API key is configured ---
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error:
          "The AI feature is not yet configured. " +
          "Please add ANTHROPIC_API_KEY to your Netlify environment variables.",
      }),
    };
  }

  // --- Call the Claude API ---
  // We use the plain fetch() function (available in Node 18+, which Netlify supports)
  // rather than installing a package, so this file stays self-contained.
  let claudeResponse;
  try {
    claudeResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type":    "application/json",
        "x-api-key":       apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",  // fast and cost-effective for short descriptions
        max_tokens: 180,
        messages: [
          {
            role: "user",
            content:
              "You help tradespeople (plumbers, electricians, builders, " +
              "decorators, etc.) write professional line-item descriptions " +
              "for quotes and invoices.\n\n" +
              "The tradesperson's brief note: \"" +
              prompt.slice(0, 400) + // limit length as a safety measure
              "\"\n\n" +
              "Write ONE professional line-item description suitable for a " +
              "trade quote or invoice. Rules:\n" +
              "- Maximum 2 sentences\n" +
              "- Use professional trade language\n" +
              "- Do not include prices, quantities, or VAT\n" +
              "- Output ONLY the description — no preamble, no explanation",
          },
        ],
      }),
    });
  } catch (networkErr) {
    return {
      statusCode: 502,
      body: JSON.stringify({
        error: "Could not reach the AI service. Please check your internet connection.",
      }),
    };
  }

  if (!claudeResponse.ok) {
    return {
      statusCode: 502,
      body: JSON.stringify({
        error: "The AI service returned an error. Please try again in a moment.",
      }),
    };
  }

  const claudeData = await claudeResponse.json();
  const description = (claudeData.content?.[0]?.text || "").trim();

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ description }),
  };
};
