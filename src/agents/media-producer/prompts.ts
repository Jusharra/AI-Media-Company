export const MEDIA_PRODUCER_SYSTEM = `You are the Media Producer Agent for SIGNAL Media.

You transform backgrounder research into engaging media content: podcast scripts, video scripts, and social media packages. Your content must feel authentic and editorial — not promotional. Every piece should work as standalone content that provides value to the audience independently.

CONTENT PRINCIPLES:
- Podcast: Conversational, specific, host asks the hard questions
- YouTube: Visual, structured, B-roll direction included
- Social: Platform-native — LinkedIn is professional insight, Twitter is punchy takes, Instagram is visual storytelling
- All content should be quotable and shareable`;

export const PODCAST_SCRIPT_PROMPT = (backgrounder: string) => `
Create a PODCAST EPISODE SCRIPT (20–30 minute format) based on this backgrounder.

BACKGROUNDER:
${backgrounder}

Include:
- Cold open / teaser (30 sec)
- Host intro (1-2 min)
- Segment 1: Origin Story (5-7 min) — 3–4 interview questions
- Segment 2: The Company (5-7 min) — 3–4 questions
- Segment 3: Sector Insight (7-10 min) — 4–5 questions (most quotable)
- Close (2-3 min) with "contrarian question" and outro
- Show notes template

Format: Script format with HOST/GUEST labels. Mark [NOTE] for host guidance.
`;

export const YOUTUBE_SCRIPT_PROMPT = (backgrounder: string) => `
Create a YOUTUBE VIDEO SCRIPT (8–12 minute format) based on this backgrounder.

BACKGROUNDER:
${backgrounder}

Include:
- Hook (first 30 sec — must earn viewer's attention immediately)
- Intro with channel context
- Main content (3 acts with clear transitions)
- B-roll suggestions [B-ROLL: description] throughout
- Call to action and outro

Format: Script with speaker labels + [B-ROLL] and [GRAPHIC] cues.
`;

export const SHORTS_PROMPT = (backgrounder: string) => `
Create 3 SHORT-FORM VIDEO SCRIPTS (60 seconds each) for Reels/Shorts/TikTok based on this backgrounder.

BACKGROUNDER:
${backgrounder}

For each script:
- Hook (first 3 seconds — visual + audio)
- Core insight or story (45 seconds)
- CTA / punchline (12 seconds)

Label each: SHORT 1: [TOPIC], SHORT 2: [TOPIC], SHORT 3: [TOPIC]
Each should stand alone and work without the others.
`;

export const SOCIAL_PACKAGE_PROMPT = (backgrounder: string) => `
Create a complete SOCIAL CONTENT PACKAGE based on this backgrounder.

BACKGROUNDER:
${backgrounder}

Produce:

## LinkedIn Posts (3x, professional thought leadership tone)
- Post 1: The key insight this founder has discovered
- Post 2: The market context / why this sector matters now
- Post 3: The founder's journey / credibility story

## Twitter/X Threads (3x, punchy insight-driven)
- Thread 1: "X things most people get wrong about [sector]" (5-7 tweets)
- Thread 2: The founder's contrarian view as a thread (4-6 tweets)
- Thread 3: The company story as a thread (5-7 tweets)

## Quote Graphics (5x pull quotes)
Short, punchy, standalone quotes suitable for image overlays.
Format: "Quote text" — Name, Title, Company

## Instagram Carousel Outline (5-7 slides)
- Slide 1: Hook/Cover
- Slides 2-6: Key points (one per slide)
- Final slide: CTA

Return as structured Markdown with clear section headers.
`;
