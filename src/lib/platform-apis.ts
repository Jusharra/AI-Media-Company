import axios from 'axios';
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
// ============================================================
export async function publishToLinkedIn(content: {
  text: string;
  title?: string;
  url?: string;
}): Promise<PublishResult> {
  const token = process.env.LINKEDIN_ACCESS_TOKEN;
  if (!token) {
    return { platform: 'linkedin', success: false, error: 'LinkedIn access token not configured' };
  }

  try {
    // Get the user's LinkedIn ID first
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
    const error = err as { message?: string };
    return { platform: 'linkedin', success: false, error: error?.message || 'LinkedIn publish failed' };
  }
}

// ============================================================
// Twitter/X API v2
// ============================================================
export async function publishToTwitter(content: {
  text: string;
  replyToId?: string;
}): Promise<PublishResult> {
  const token = process.env.TWITTER_ACCESS_TOKEN;
  const secret = process.env.TWITTER_ACCESS_SECRET;
  const apiKey = process.env.TWITTER_API_KEY;
  const apiSecret = process.env.TWITTER_API_SECRET;

  if (!token || !apiKey) {
    return { platform: 'twitter', success: false, error: 'Twitter credentials not configured' };
  }

  try {
    // Using OAuth 1.0a for v2 API
    const res = await axios.post(
      'https://api.twitter.com/2/tweets',
      {
        text: content.text,
        ...(content.replyToId && { reply: { in_reply_to_tweet_id: content.replyToId } }),
      },
      {
        headers: {
          'Content-Type': 'application/json',
          // Note: Real implementation needs OAuth 1.0a signing
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const tweetId = res.data.data.id;
    return {
      platform: 'twitter',
      success: true,
      postId: tweetId,
      postUrl: `https://twitter.com/i/web/status/${tweetId}`,
    };
  } catch (err: unknown) {
    const error = err as { message?: string };
    return { platform: 'twitter', success: false, error: error?.message || 'Twitter publish failed' };
  }
}

// ============================================================
// YouTube Data API v3
// ============================================================
export async function publishToYouTube(content: {
  title: string;
  description: string;
  tags?: string[];
}): Promise<PublishResult> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    return { platform: 'youtube', success: false, error: 'YouTube API key not configured' };
  }

  // YouTube video upload requires OAuth2 and multipart upload
  // This creates the video metadata — actual video file upload handled separately
  try {
    const res = await axios.post(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet,status&key=${apiKey}`,
      {
        snippet: {
          title: content.title,
          description: content.description,
          tags: content.tags || [],
          categoryId: '22', // People & Blogs
        },
        status: {
          privacyStatus: 'public',
          publishAt: new Date().toISOString(),
        },
      },
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );

    const videoId = res.data.id;
    return {
      platform: 'youtube',
      success: true,
      postId: videoId,
      postUrl: `https://www.youtube.com/watch?v=${videoId}`,
    };
  } catch (err: unknown) {
    const error = err as { message?: string };
    return { platform: 'youtube', success: false, error: error?.message || 'YouTube publish failed' };
  }
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
// Batch publisher — publishes to multiple platforms
// ============================================================
export async function batchPublish(
  contents: Array<{ platform: Platform; content: Record<string, string> }>
): Promise<PublishResult[]> {
  const results = await Promise.allSettled(
    contents.map(({ platform, content }) => {
      switch (platform) {
        case 'linkedin': return publishToLinkedIn(content);
        case 'twitter': return publishToTwitter(content);
        case 'youtube': return publishToYouTube(content);
        case 'website': return publishToWebsite({ type: 'article', data: content });
        default: return Promise.resolve({ platform, success: false, error: 'Unknown platform' });
      }
    })
  );

  return results.map(r =>
    r.status === 'fulfilled' ? r.value : { platform: 'website' as Platform, success: false, error: 'Publish failed' }
  );
}

// ============================================================
// Analytics tracker
// ============================================================
export async function getEngagementMetrics(
  platform: Platform,
  postId: string
): Promise<Record<string, number>> {
  // Stub — real implementation would call each platform's analytics API
  return {
    views: Math.floor(Math.random() * 500),
    likes: Math.floor(Math.random() * 50),
    shares: Math.floor(Math.random() * 20),
    clicks: Math.floor(Math.random() * 100),
  };
}
