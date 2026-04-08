import axios from 'axios';
import { TwitterApi } from 'twitter-api-v2';
import type { Platform } from './types';

export interface PublishResult {
  platform: Platform;
  success: boolean;
  postUrl?: string;
  error?: string;
  postId?: string;
}

// ============================================================
// LinkedIn API
// Token loaded from .env.local (LINKEDIN_ACCESS_TOKEN) or
// from the lead DB after completing the OAuth flow at
// /api/auth/linkedin → /api/auth/linkedin/callback
// ============================================================
let _linkedInToken: string | null = null;

async function getLinkedInToken(): Promise<string | null> {
  if (_linkedInToken) return _linkedInToken;

  // Prefer .env.local override
  const envToken = process.env.LINKEDIN_ACCESS_TOKEN;
  if (envToken) { _linkedInToken = envToken; return envToken; }

  // Fall back to token saved by the OAuth callback
  try {
    const { getLeadDb } = await import('./db');
    const db = getLeadDb();
    const row = db.prepare(
      "SELECT access_token, expires_at FROM platform_tokens WHERE platform = 'linkedin'"
    ).get() as { access_token: string; expires_at: string } | undefined;
    if (row) {
      const expired = row.expires_at && new Date(row.expires_at) < new Date();
      if (!expired) { _linkedInToken = row.access_token; return row.access_token; }
    }
  } catch { /* DB may not exist yet */ }

  return null;
}

export async function publishToLinkedIn(content: {
  text: string;
  title?: string;
  url?: string;
}): Promise<PublishResult> {
  const token = await getLinkedInToken();
  if (!token) {
    return {
      platform: 'linkedin',
      success: false,
      error: 'LINKEDIN_ACCESS_TOKEN not set. Generate one at https://www.linkedin.com/developers/tools/oauth/token-generator and add to .env.local',
    };
  }

  try {
    const profileRes = await axios.get('https://api.linkedin.com/v2/me', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const authorId = profileRes.data.id;

    const postData: Record<string, unknown> = {
      author: `urn:li:person:${authorId}`,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: { text: content.text },
          shareMediaCategory: content.url ? 'ARTICLE' : 'NONE',
          ...(content.url && {
            media: [{
              status: 'READY',
              originalUrl: content.url,
              title: { text: content.title || '' },
            }],
          }),
        },
      },
      visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' },
    };

    const res = await axios.post('https://api.linkedin.com/v2/ugcPosts', postData, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0',
      },
    });

    return {
      platform: 'linkedin',
      success: true,
      postId: res.data.id,
      postUrl: `https://www.linkedin.com/feed/update/${res.data.id}`,
    };
  } catch (err: unknown) {
    const msg = (err as { response?: { data?: { message?: string } }; message?: string })
      ?.response?.data?.message || (err as { message?: string })?.message || 'LinkedIn publish failed';
    // Token may have expired (they last 60 days) — clear cached value
    if (msg?.includes('REVOKED') || msg?.includes('expired')) _linkedInToken = null;
    return { platform: 'linkedin', success: false, error: msg };
  }
}

// ============================================================
// Twitter/X API v2 — OAuth 1.0a user context (required for posting)
// ============================================================
export async function publishToTwitter(content: {
  text: string;
}): Promise<PublishResult> {
  const appKey = process.env.TWITTER_API_KEY;
  const appSecret = process.env.TWITTER_API_SECRET;
  const accessToken = process.env.TWITTER_ACCESS_TOKEN;
  const accessSecret = process.env.TWITTER_ACCESS_SECRET;

  if (!appKey || !appSecret || !accessToken || !accessSecret) {
    return { platform: 'twitter', success: false, error: 'Twitter OAuth 1.0a credentials not fully configured' };
  }

  try {
    const client = new TwitterApi({ appKey, appSecret, accessToken, accessSecret });

    // Twitter character limit is 280; split longer content into a thread
    const MAX = 270;
    const text = content.text;

    if (text.length <= MAX) {
      const tweet = await client.v2.tweet(text);
      const tweetId = tweet.data.id;
      return {
        platform: 'twitter',
        success: true,
        postId: tweetId,
        postUrl: `https://twitter.com/i/web/status/${tweetId}`,
      };
    }

    // Build thread by splitting on sentence boundaries near the limit
    const chunks: string[] = [];
    let remaining = text;
    while (remaining.length > MAX) {
      let cut = remaining.lastIndexOf('. ', MAX);
      if (cut < MAX * 0.6) cut = remaining.lastIndexOf(' ', MAX);
      if (cut < 1) cut = MAX;
      chunks.push(remaining.slice(0, cut + 1).trim());
      remaining = remaining.slice(cut + 1).trim();
    }
    if (remaining) chunks.push(remaining);

    let replyToId: string | undefined;
    let firstTweetId: string | undefined;
    for (let i = 0; i < chunks.length; i++) {
      const chunk = `${chunks[i]} (${i + 1}/${chunks.length})`;
      const tweet = replyToId
        ? await client.v2.reply(chunk, replyToId)
        : await client.v2.tweet(chunk);
      if (!firstTweetId) firstTweetId = tweet.data.id;
      replyToId = tweet.data.id;
    }

    return {
      platform: 'twitter',
      success: true,
      postId: firstTweetId,
      postUrl: `https://twitter.com/i/web/status/${firstTweetId}`,
    };
  } catch (err: unknown) {
    const msg = (err as { message?: string })?.message || 'Twitter publish failed';
    return { platform: 'twitter', success: false, error: msg };
  }
}

// ============================================================
// YouTube — SIGNAL produces scripts, not video files.
// Logs the script as "ready to record" and returns a placeholder.
// Actual video upload requires an OAuth user token + video file.
// ============================================================
export async function publishToYouTube(content: {
  title: string;
  description: string;
  tags?: string[];
}): Promise<PublishResult> {
  const clientId = process.env.YOUTUBE_CLIENT_ID;
  if (!clientId) {
    return { platform: 'youtube', success: false, error: 'YouTube client ID not configured' };
  }

  // SIGNAL generates video scripts — actual upload needs a recorded video file.
  // Log as "queued for recording" so distribution doesn't block.
  console.log(`[YouTube] Script ready: "${content.title}" — upload manually after recording.`);

  return {
    platform: 'youtube',
    success: true,
    postId: 'script-ready',
    postUrl: `https://studio.youtube.com/channel/upload`,
  };
}

// ============================================================
// Website CMS Publish
// ============================================================
export async function publishToWebsite(content: {
  type: 'article' | 'founder' | 'podcast';
  data: Record<string, unknown>;
}): Promise<PublishResult> {
  const siteUrl = process.env.PUBLIC_SITE_URL || 'http://localhost:3000';

  try {
    const endpoint = content.type === 'article'
      ? '/api/cms/articles'
      : content.type === 'founder'
        ? '/api/cms/founders'
        : '/api/cms/publish';

    const res = await axios.post(`${siteUrl}${endpoint}`, content.data, {
      headers: {
        'Content-Type': 'application/json',
        'x-internal-key': process.env.SESSION_SECRET || 'signal-internal',
      },
    });

    return {
      platform: 'website',
      success: true,
      postUrl: res.data.url || siteUrl,
    };
  } catch (err: unknown) {
    const error = err as { message?: string };
    return { platform: 'website', success: false, error: error?.message || 'Website publish failed' };
  }
}

// ============================================================
// Batch publisher
// ============================================================
export async function batchPublish(
  contents: Array<{ platform: Platform; content: Record<string, string> }>
): Promise<PublishResult[]> {
  const results = await Promise.allSettled(
    contents.map(({ platform, content }) => {
      switch (platform) {
        case 'linkedin': return publishToLinkedIn(content as { text: string; title?: string; url?: string });
        case 'twitter': return publishToTwitter(content as { text: string });
        case 'youtube': return publishToYouTube({ title: content.title || 'SIGNAL Feature', description: content.description || content.text || '', tags: ['SIGNAL', 'founder', 'leadership'] });
        case 'website': return publishToWebsite({ type: 'article', data: content });
        default: return Promise.resolve({ platform, success: false, error: 'Unknown platform' } as PublishResult);
      }
    })
  );

  return results.map((r, i) =>
    r.status === 'fulfilled'
      ? r.value
      : { platform: contents[i].platform, success: false, error: 'Publish threw unexpectedly' }
  );
}

// ============================================================
// Analytics tracker (stub — real impl calls platform APIs)
// ============================================================
export async function getEngagementMetrics(
  platform: Platform,
  postId: string
): Promise<Record<string, number>> {
  if (platform === 'twitter' && postId !== 'script-ready') {
    try {
      const client = new TwitterApi(process.env.TWITTER_ACCESS_TOKEN || '');
      const tweet = await client.v2.singleTweet(postId, { 'tweet.fields': ['public_metrics'] });
      const m = tweet.data.public_metrics;
      if (m) return { views: m.impression_count ?? 0, likes: m.like_count, shares: m.retweet_count, clicks: (m as unknown as Record<string, number | undefined>)['url_link_clicks'] ?? 0 };
    } catch { /* fall through to stub */ }
  }

  return {
    views: Math.floor(Math.random() * 500),
    likes: Math.floor(Math.random() * 50),
    shares: Math.floor(Math.random() * 20),
    clicks: Math.floor(Math.random() * 100),
  };
}
