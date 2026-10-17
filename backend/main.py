import os
import re
import html
import httpx
from typing import Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

# Load environment variables explicitly from backend/.env or root .env
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
load_dotenv(os.path.join(BASE_DIR, ".env"))
load_dotenv()

YOUTUBE_API_KEY = os.getenv("YOUTUBE_API_KEY", "")
GEMINI_API_KEY  = os.getenv("GEMINI_API_KEY", "")

app = FastAPI(title="Spatial Intelligence Video Search Service")

# Enable CORS for frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Pydantic Models ────────────────────────────────────────────────────────────

class SearchRequest(BaseModel):
    topic: str
    student_id: str = "default_student"
    page_token: Optional[str] = None   # kept for forward-compat; unused in new logic

class VideoResult(BaseModel):
    video_id: str
    title: str
    channel_title: str
    thumbnail_url: str
    description: str
    embed_url: str
    duration: Optional[str] = None
    view_count: Optional[str] = None
    view_count_raw: int = 0            # used for server-side sort, not shown in UI
    language: str = "English"          # "Tamil" | "English"
    notes: list[str] = []

class SearchResponse(BaseModel):
    tamil_videos: list[VideoResult]
    english_videos: list[VideoResult]
    total_results: Optional[int] = None


# ─── Utility helpers ─────────────────────────────────────────────────────────────

def parse_iso_duration(pt: str) -> Optional[str]:
    """Parse YouTube ISO 8601 duration → human-readable string.
    Also returns None when the video is a Short (< 60 seconds total)."""
    if not pt or not pt.startswith("PT"):
        return None
    match = re.match(r"PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?", pt)
    if not match:
        return None
    h, m, s = match.groups()
    total_seconds = int(h or 0) * 3600 + int(m or 0) * 60 + int(s or 0)
    if total_seconds < 60:
        return None   # Signal: this is a Short — will be filtered out
    parts = []
    if h:
        parts.append(f"{h} hr" if h == "1" else f"{h} hrs")
    if m:
        parts.append(f"{m} min" if m == "1" else f"{m} mins")
    if s and not h:
        parts.append(f"{s} sec" if s == "1" else f"{s} secs")
    return " ".join(parts) if parts else "< 1 min"


def format_view_count(views_str: Optional[str]) -> tuple[str, int]:
    """Returns (display_string, raw_int) for sorting and display."""
    if not views_str:
        return ("", 0)
    try:
        count = int(views_str)
        if count >= 1_000_000:
            return (f"{count / 1_000_000:.1f}M views", count)
        elif count >= 1_000:
            return (f"{count / 1_000:.1f}K views", count)
        return (f"{count:,} views", count)
    except (ValueError, TypeError):
        return ("", 0)


def generate_study_notes(topic: str, title: str) -> list[str]:
    """Educational bullet points for 6th standard students."""
    clean_topic = topic.strip().title()
    clean_title = title.split("|")[0].split("-")[0].strip()
    return [
        f"Core Concept: Visual explanation of {clean_topic} for 6th Standard science.",
        f"Key takeaway from '{clean_title}': understand the structures, processes, and real-world connections.",
        "Exam tip: note definitions, key terms, and labelled diagrams shown in the video.",
        "Study habit: pause, sketch, and write one sentence per main idea after watching."
    ]


# ─── YouTube API helpers ──────────────────────────────────────────────────────────

async def youtube_search(
    client: httpx.AsyncClient,
    query: str,
    max_results: int = 15,
    page_token: Optional[str] = None,
    relevance_language: Optional[str] = None
) -> dict:
    """Call YouTube Data API v3 search.list and return raw JSON."""
    params = {
        "q": query,
        "part": "snippet",
        "type": "video",
        "maxResults": max_results,
        "safeSearch": "strict",
        "videoEmbeddable": "true",   # ensure embeddable
        "videoDuration": "medium",   # exclude Shorts (< 4 min bucket) at API level too
        "key": YOUTUBE_API_KEY,
    }
    if page_token:
        params["pageToken"] = page_token
    if relevance_language:
        params["relevanceLanguage"] = relevance_language

    res = await client.get("https://www.googleapis.com/youtube/v3/search", params=params)

    if res.status_code == 403:
        error_body = res.json() if res.headers.get("content-type", "").startswith("application/json") else {}
        reasons = [e.get("reason", "") for e in error_body.get("error", {}).get("errors", [])]
        if "quotaExceeded" in reasons or "dailyLimitExceeded" in reasons:
            raise HTTPException(
                status_code=429,
                detail="YouTube Data API quota exceeded. Please check your API quota or update YOUTUBE_API_KEY in backend/.env"
            )
        raise HTTPException(
            status_code=403,
            detail=f"YouTube API permission error: {error_body.get('error', {}).get('message', 'Forbidden')}"
        )
    if res.status_code != 200:
        raise HTTPException(status_code=res.status_code, detail=f"YouTube Search API error: {res.text[:200]}")

    return res.json()


async def fetch_video_details(client: httpx.AsyncClient, video_ids: list[str]) -> dict:
    """Batch call videos.list for snippet + contentDetails + statistics."""
    if not video_ids:
        return {}
    params = {
        "id": ",".join(video_ids),
        "part": "snippet,contentDetails,statistics",
        "key": YOUTUBE_API_KEY,
    }
    res = await client.get("https://www.googleapis.com/youtube/v3/videos", params=params)
    if res.status_code != 200:
        return {}
    return {v["id"]: v for v in res.json().get("items", [])}


def build_video_results(
    search_items: list[dict],
    videos_dict: dict,
    raw_topic: str,
    language: str
) -> list[VideoResult]:
    """
    Assemble VideoResult objects from search + detail data.
    Filters out Shorts (duration < 60 s → parse_iso_duration returns None).
    """
    results: list[VideoResult] = []

    for item in search_items:
        v_id = item.get("id", {}).get("videoId")
        if not v_id:
            continue

        snippet        = item.get("snippet", {})
        detail         = videos_dict.get(v_id, {})
        detail_snippet = detail.get("snippet", snippet)
        content_details = detail.get("contentDetails", {})
        statistics      = detail.get("statistics", {})

        raw_duration       = content_details.get("duration")
        formatted_duration = parse_iso_duration(raw_duration) if raw_duration else None

        # Skip Shorts (< 60 s) — parse_iso_duration returns None for those
        if raw_duration and formatted_duration is None:
            continue

        raw_title    = detail_snippet.get("title") or snippet.get("title", f"{raw_topic} Video")
        clean_title  = html.unescape(raw_title)
        raw_desc     = detail_snippet.get("description") or snippet.get("description", "")
        clean_desc   = html.unescape(raw_desc)
        channel_name = html.unescape(
            detail_snippet.get("channelTitle") or snippet.get("channelTitle", "Educational Channel")
        )

        thumbs   = detail_snippet.get("thumbnails", {}) or snippet.get("thumbnails", {})
        thumb_url = (
            thumbs.get("maxres", {}).get("url") or
            thumbs.get("high", {}).get("url") or
            thumbs.get("medium", {}).get("url") or
            thumbs.get("default", {}).get("url") or
            f"https://img.youtube.com/vi/{v_id}/hqdefault.jpg"
        )

        display_views, raw_views = format_view_count(statistics.get("viewCount"))
        notes = generate_study_notes(raw_topic, clean_title)

        results.append(VideoResult(
            video_id      = v_id,
            title         = clean_title,
            channel_title = channel_name,
            thumbnail_url = thumb_url,
            description   = (clean_desc[:250] + "..." if len(clean_desc) > 250 else clean_desc)
                            or f"Educational explanation of {raw_topic} for 6th Standard students.",
            embed_url     = f"https://www.youtube.com/embed/{v_id}",
            duration      = formatted_duration,
            view_count    = display_views or None,
            view_count_raw= raw_views,
            language      = language,
            notes         = notes
        ))

    # Sort by view count descending (highest first)
    results.sort(key=lambda v: v.view_count_raw, reverse=True)
    return results


# ─── Main endpoint ────────────────────────────────────────────────────────────────

@app.post("/api/spatial/search", response_model=SearchResponse)
async def search_spatial_videos(req: SearchRequest):
    """
    POST /api/spatial/search
    Returns top 5 Tamil videos + top 5 English videos for the given topic,
    both sorted by view count (highest → lowest). Shorts excluded.
    """
    if not req.topic or not req.topic.strip():
        raise HTTPException(status_code=400, detail="Search topic cannot be empty.")

    if not YOUTUBE_API_KEY:
        raise HTTPException(
            status_code=500,
            detail="YouTube Data API key is missing. Please configure YOUTUBE_API_KEY in backend/.env"
        )

    raw_topic = req.topic.strip()

    # Build language-specific search queries
    tamil_query   = f"{raw_topic} 6th standard science Tamil educational informative"
    english_query = f"{raw_topic} 6th grade science educational informative explanation"

    print(f"[Search] Topic='{raw_topic}' | Tamil: '{tamil_query}' | English: '{english_query}'")

    try:
        async with httpx.AsyncClient(timeout=12.0) as client:

            # ── Fetch Tamil & English results in parallel ──────────────────────
            tamil_search_task   = youtube_search(client, tamil_query,   max_results=15)
            english_search_task = youtube_search(client, english_query, max_results=15)

            tamil_search   = await tamil_search_task
            english_search = await english_search_task

            tamil_items   = tamil_search.get("items", [])
            english_items = english_search.get("items", [])

            # Collect all video IDs for a single batch detail call
            tamil_ids   = [i["id"]["videoId"] for i in tamil_items   if i.get("id", {}).get("videoId")]
            english_ids = [i["id"]["videoId"] for i in english_items if i.get("id", {}).get("videoId")]
            all_ids     = list(dict.fromkeys(tamil_ids + english_ids))  # deduplicate, preserve order

            videos_dict = await fetch_video_details(client, all_ids)

            # Build sorted + filtered result lists
            tamil_results   = build_video_results(tamil_items,   videos_dict, raw_topic, "Tamil")
            english_results = build_video_results(english_items, videos_dict, raw_topic, "English")

            # Keep top 5 per language (already sorted by views)
            top_tamil   = tamil_results[:5]
            top_english = english_results[:5]

            total = len(top_tamil) + len(top_english)
            print(f"[Result] Tamil={len(top_tamil)} | English={len(top_english)} | Total={total}")

            return SearchResponse(
                tamil_videos   = top_tamil,
                english_videos = top_english,
                total_results  = total
            )

    except httpx.RequestError as exc:
        raise HTTPException(
            status_code=503,
            detail=f"Network error communicating with YouTube: {str(exc)}"
        )


# ─── Health check ─────────────────────────────────────────────────────────────────

@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "service": "Spatial Intelligence Video Search Backend",
        "youtube_api_configured": bool(YOUTUBE_API_KEY)
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
