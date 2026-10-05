// src/app/api/drive-video/route.ts
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const driveId = searchParams.get("id");
    const videoUrl = searchParams.get("url");

    let effectiveId = driveId;
    if (!effectiveId && videoUrl) {
      const match = videoUrl.match(/[-\w]{25,}/);
      if (match) effectiveId = match[0];
    }

    if (!effectiveId && !videoUrl) {
      return NextResponse.json({ error: "Missing video id or url" }, { status: 400 });
    }

    const targetUrl = effectiveId 
      ? `https://drive.google.com/uc?export=download&id=${effectiveId}`
      : videoUrl!;

    const range = req.headers.get("range");
    const fetchHeaders: Record<string, string> = {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    };

    if (range) {
      fetchHeaders["Range"] = range;
    }

    const response = await fetch(targetUrl, {
      headers: fetchHeaders,
      redirect: "follow",
    });

    if (!response.ok && response.status !== 206) {
      // Try secondary endpoint if available
      if (effectiveId) {
        const fallbackUrl = `https://lh3.googleusercontent.com/d/${effectiveId}`;
        const fallbackRes = await fetch(fallbackUrl, {
          headers: fetchHeaders,
          redirect: "follow",
        });
        if (fallbackRes.ok || fallbackRes.status === 206) {
          return createStreamResponse(fallbackRes, range);
        }
      }
      
      // Fallback: redirect directly to Google Drive download URL
      return NextResponse.redirect(targetUrl, 302);
    }

    return createStreamResponse(response, range);
  } catch (error) {
    console.error("Error streaming video from Drive:", error);
    return NextResponse.json({ error: "Failed to stream video" }, { status: 500 });
  }
}

function createStreamResponse(response: Response, range: string | null) {
  const headers = new Headers();
  
  const contentType = response.headers.get("content-type") || "video/mp4";
  const contentLength = response.headers.get("content-length");
  const contentRange = response.headers.get("content-range");
  const acceptRanges = response.headers.get("accept-ranges") || "bytes";

  headers.set("Content-Type", contentType);
  headers.set("Accept-Ranges", acceptRanges);
  headers.set("Cache-Control", "public, max-age=3600, s-maxage=3600");

  if (contentLength) {
    headers.set("Content-Length", contentLength);
  }

  if (contentRange) {
    headers.set("Content-Range", contentRange);
    return new Response(response.body, {
      status: 206,
      headers,
    });
  }

  return new Response(response.body, {
    status: response.status === 206 ? 206 : 200,
    headers,
  });
}
