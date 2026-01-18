import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type LookupResponse =
  | {
      status: "found";
      username: string;
      fullName?: string;
      avatarUrl?: string;
      profileUrl: string;
    }
  | {
      status: "not_found" | "blocked" | "invalid" | "error";
      username?: string;
      message: string;
    };

function normalizeUsername(input: unknown): string | null {
  if (typeof input !== "string") return null;
  const trimmed = input.trim().replace(/^@+/, "");
  if (!trimmed) return null;
  if (trimmed.length > 30) return null;
  if (!/^[a-zA-Z0-9._]+$/.test(trimmed)) return null;
  return trimmed;
}

function pickMetaContent(html: string, property: string): string | undefined {
  const re = new RegExp(
    `<meta[^>]+(?:property|name)=["']${property}["'][^>]*content=["']([^"']+)["'][^>]*>`,
    "i"
  );
  const re2 = new RegExp(
    `<meta[^>]+content=["']([^"']+)["'][^>]*(?:property|name)=["']${property}["'][^>]*>`,
    "i"
  );
  const m = html.match(re) ?? html.match(re2);
  return m?.[1];
}

function parseFullName(ogTitle?: string): string | undefined {
  // Typical: "Full Name (@username) • Instagram photos and videos"
  if (!ogTitle) return undefined;
  const idx = ogTitle.indexOf("(@");
  if (idx <= 0) return undefined;
  const name = ogTitle.slice(0, idx).trim();
  return name || undefined;
}

function parseAlternateName(html: string): string | undefined {
  // JSON-LD often includes: "alternateName":"@username"
  const m = html.match(/"alternateName"\s*:\s*"@([^"]+)"/i);
  return m?.[1];
}

function looksBlocked(html: string) {
  const s = html.toLowerCase();
  return (
    s.includes("challenge") ||
    s.includes("/accounts/login") ||
    s.includes("login") && s.includes("instagram") && s.includes("password")
  );
}

async function fetchHtml(url: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });

    const text = await res.text().catch(() => "");
    return { status: res.status, text, finalUrl: res.url };
  } finally {
    clearTimeout(timeout);
  }
}

function isFoundForUsername(html: string, username: string) {
  const u = username.toLowerCase();

  const ogTitle = pickMetaContent(html, "og:title");
  if (ogTitle && ogTitle.toLowerCase().includes(`(@${u})`)) return true;

  const alt = parseAlternateName(html);
  if (alt && alt.toLowerCase() === u) return true;

  const alIos = pickMetaContent(html, "al:ios:url");
  if (alIos && alIos.toLowerCase().includes(`username=${u}`)) return true;

  return false;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const username = normalizeUsername(body?.username);

    if (!username) {
      const res: LookupResponse = { status: "invalid", message: "Invalid username" };
      return new Response(JSON.stringify(res), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const profileUrl = `https://www.instagram.com/${username}/`;

    // 1) Direct fetch
    const direct = await fetchHtml(profileUrl);
    console.log("ig_lookup direct", { username, status: direct.status, finalUrl: direct.finalUrl });

    if (direct.status === 404) {
      const res: LookupResponse = { status: "not_found", username, message: "Profile not found" };
      return new Response(JSON.stringify(res), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // If we got a good page and it matches, return.
    if (direct.status >= 200 && direct.status < 300 && direct.text && isFoundForUsername(direct.text, username)) {
      const ogTitle = pickMetaContent(direct.text, "og:title");
      const ogImage = pickMetaContent(direct.text, "og:image");

      const res: LookupResponse = {
        status: "found",
        username,
        fullName: parseFullName(ogTitle),
        avatarUrl: ogImage,
        profileUrl,
      };
      return new Response(JSON.stringify(res), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // 2) If Instagram served a blocked/login/challenge page, try a public text proxy.
    // This is best-effort and may still fail if Instagram blocks.
    const shouldProxy =
      direct.status === 401 ||
      direct.status === 403 ||
      direct.status === 429 ||
      (direct.status >= 200 && direct.status < 300 && looksBlocked(direct.text));

    if (shouldProxy) {
      const proxyUrl = `https://r.jina.ai/${profileUrl}`;
      const proxied = await fetchHtml(proxyUrl);
      console.log("ig_lookup proxy", { username, status: proxied.status, finalUrl: proxied.finalUrl });

      if (proxied.status >= 200 && proxied.status < 300 && proxied.text && isFoundForUsername(proxied.text, username)) {
        const ogTitle = pickMetaContent(proxied.text, "og:title");
        const ogImage = pickMetaContent(proxied.text, "og:image");

        const res: LookupResponse = {
          status: "found",
          username,
          fullName: parseFullName(ogTitle),
          avatarUrl: ogImage,
          profileUrl,
        };
        return new Response(JSON.stringify(res), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      const res: LookupResponse = {
        status: "blocked",
        username,
        message: "Instagram verification is temporarily blocked. Please try again in a minute.",
      };
      return new Response(JSON.stringify(res), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Otherwise treat as not found.
    const res: LookupResponse = {
      status: "not_found",
      username,
      message: "Profile not found",
    };
    return new Response(JSON.stringify(res), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("lookup-instagram-profile error:", error);
    const res: LookupResponse = { status: "error", message: "Verification failed" };
    return new Response(JSON.stringify(res), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  }
});
