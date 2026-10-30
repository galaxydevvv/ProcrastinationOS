const upstreamUrl = "https://ai.hackclub.com/proxy/v1/chat/completions";
const maxRequestBytes = 65536;
const maxMessages = 60;

function allowedOrigins(env) {
  return new Set(
    (env.ALLOWED_ORIGINS || "")
      .split(",")
      .map((origin) => origin.trim())
      .filter(Boolean)
  );
}

function jsonResponse(body, status, origin) {
  const headers = new Headers({
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "Vary": "Origin"
  });

  if (origin) {
    headers.set("Access-Control-Allow-Origin", origin);
    headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
    headers.set("Access-Control-Allow-Headers", "Authorization, Content-Type");
    headers.set("Access-Control-Max-Age", "86400");
  }

  return new Response(JSON.stringify(body), { status, headers });
}

export default {
  async fetch(request, env) {
    const requestUrl = new URL(request.url);
    const origin = request.headers.get("Origin");
    const originAllowlist = allowedOrigins(env);

    if (!origin || !originAllowlist.has(origin)) {
      return jsonResponse({ error: { message: "Origin is not allowed." } }, 403, null);
    }

    if (requestUrl.pathname !== "/chat") {
      return jsonResponse({ error: { message: "Not found." } }, 404, origin);
    }

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": origin,
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Authorization, Content-Type",
          "Access-Control-Max-Age": "86400",
          "Vary": "Origin"
        }
      });
    }

    if (request.method !== "POST") {
      return jsonResponse({ error: { message: "Method not allowed." } }, 405, origin);
    }

    const authorization = request.headers.get("Authorization");
    if (!authorization || !/^Bearer\s+\S+$/i.test(authorization)) {
      return jsonResponse({ error: { message: "A Hack Club AI API key is required." } }, 401, origin);
    }

    const requestText = await request.text();
    if (new TextEncoder().encode(requestText).byteLength > maxRequestBytes) {
      return jsonResponse({ error: { message: "The conversation is too large." } }, 413, origin);
    }

    let body;
    try {
      body = JSON.parse(requestText);
    } catch (error) {
      return jsonResponse({ error: { message: "Request body must be valid JSON." } }, 400, origin);
    }

    if (
      !body
      || !Array.isArray(body.messages)
      || body.messages.length === 0
      || body.messages.length > maxMessages
      || body.messages.some((message) => (
        !message
        || !["system", "user", "assistant"].includes(message.role)
        || typeof message.content !== "string"
      ))
    ) {
      return jsonResponse({ error: { message: "Request must include a valid chat messages array." } }, 400, origin);
    }

    let upstreamResponse;
    try {
      upstreamResponse = await fetch(upstreamUrl, {
        method: "POST",
        headers: {
          "Authorization": authorization,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "openai/gpt-4o-mini",
          messages: body.messages,
          stream: false
        })
      });
    } catch (error) {
      return jsonResponse({ error: { message: "Could not connect to Hack Club AI." } }, 502, origin);
    }

    const responseHeaders = new Headers({
      "Content-Type": upstreamResponse.headers.get("Content-Type") || "application/json",
      "Cache-Control": "no-store",
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Authorization, Content-Type",
      "Vary": "Origin"
    });

    return new Response(upstreamResponse.body, {
      status: upstreamResponse.status,
      headers: responseHeaders
    });
  }
};
