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
  // Handles: <meta property="og:title" content="..."> and <meta content="..." property="og:title">
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
  // Typical format: "Full Name (@username) • Instagram photos and videos"
  if (!ogTitle) return undefined;
  const idx = ogTitle.indexOf("(@");
  if (idx <= 0) return undefined;
  const name = ogTitle.slice(0, idx).trim();
  return name || undefined;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const username = normalizeUsername(body?.username);

    if (!username) {
      const res: LookupResponse = {
        status: "invalid",
        message: "Invalid username",
      };
      return new Response(JSON.stringify(res), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const profileUrl = `https://www.instagram.com/${username}/`;

    // Best-effort lookup: Instagram may rate-limit or block automated requests.
    const response = await fetch(profileUrl, {
      method: "GET",
      redirect: "follow",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });

    if (response.status === 404) {
      const res: LookupResponse = {
        status: "not_found",
        username,
        message: "Profile not found",
      };
      return new Response(JSON.stringify(res), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    if (response.status === 401 || response.status === 403 || response.status === 429) {
      const res: LookupResponse = {
        status: "blocked",
        username,
        message: "Instagram blocked verification. Try again in a minute.",
      };
      return new Response(JSON.stringify(res), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const html = await response.text();

    const ogTitle = pickMetaContent(html, "og:title");
    const ogImage = pickMetaContent(html, "og:image");

    // Heuristic: if og:title exists and contains (@username) we treat as found.
    const found = !!ogTitle && ogTitle.toLowerCase().includes(`(@${username.toLowerCase()})`);

    if (!found) {
      const res: LookupResponse = {
        status: "not_found",
        username,
        message: "Profile not found",
      };
      return new Response(JSON.stringify(res), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

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
  } catch (error) {
    console.error("lookup-instagram-profile error:", error);
    const res: LookupResponse = {
      status: "error",
      message: "Verification failed",
    };
    return new Response(JSON.stringify(res), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  }
});
