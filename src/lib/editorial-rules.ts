// SIGNAL Editorial Voice & Brand Standards

export const SIGNAL_VOICE = `
SIGNAL Editorial Voice Guidelines:

TONE: Sharp, authoritative, human. We write like a senior journalist who respects their reader's intelligence.
- NOT: Corporate fluff, hollow superlatives, generic praise
- YES: Specific facts, precise language, earned credibility

STYLE:
- Lead with the insight, not the backstory
- Use active voice. Kill adverbs. Cut filler phrases.
- Pull quotes must be genuinely quotable — specific, surprising, or revelatory
- Headlines should be direct and concrete, not clickbait
- No "synergy," "disruptive," "game-changing" unless used critically

STRUCTURE (Feature Articles):
- Hook: 1–2 sentences that earn the reader's attention
- Context: Why this founder/company matters NOW
- Profile: Specific, credible details about background and trajectory
- Insight: The market truth this person has discovered or is proving
- Quote integration: 2–4 pull quotes woven naturally into the narrative
- Close: Forward-looking, what this means for the sector

SIGNAL BRAND PILLARS:
1. AUTHORITY: We report on builders doing real things in the real world
2. PRECISION: We don't editorialize vaguely — we cite specifics
3. RESPECT: We treat founders as operators, not PR subjects
4. RELEVANCE: We connect individual stories to sector-wide significance
`;

export const CONTENT_STANDARDS = {
  featureArticle: {
    minWords: 800,
    maxWords: 1500,
    requiredSections: ['hook', 'context', 'profile', 'insight', 'quotes', 'close'],
    pullQuotes: { min: 2, max: 4 },
  },
  spotlight: {
    minWords: 300,
    maxWords: 500,
    requiredSections: ['who', 'what', 'why-now'],
    pullQuotes: { min: 1, max: 2 },
  },
  thoughtLeadership: {
    minWords: 600,
    maxWords: 900,
    requiredSections: ['thesis', 'evidence', 'implications', 'call-to-action'],
    pullQuotes: { min: 1, max: 3 },
  },
  podcastScript: {
    targetDuration: '20-30 min',
    requiredSections: ['host-intro', 'guest-intro', 'interview-questions', 'key-moments', 'outro'],
    questionCount: { min: 8, max: 15 },
  },
  youtubeScript: {
    targetDuration: '8-12 min',
    requiredSections: ['hook', 'intro', 'main-content', 'broll-notes', 'cta'],
  },
  socialPackage: {
    linkedin: { count: 3, style: 'professional thought leadership' },
    twitter: { count: 3, style: 'punchy insight-driven threads' },
    quoteGraphics: { count: 5, format: 'image overlay text' },
    instagramCarousel: { slides: '5-7', style: 'visual editorial' },
  },
};

export const FORBIDDEN_PHRASES = [
  'game-changing', 'disruptive', 'revolutionary', 'synergy', 'leverage',
  'paradigm shift', 'thought leader', 'guru', 'ninja', 'wizard',
  'in today\'s fast-paced world', 'in the ever-changing landscape',
  'it goes without saying', 'needless to say', 'at the end of the day',
  'circle back', 'move the needle', 'low-hanging fruit',
];

export const SECTOR_INTRO_CONTEXT = {
  healthcare: `Healthcare is experiencing unprecedented transformation — from AI diagnostics to value-based care models. Yet most of the operators driving this change remain unknown outside their specialties. SIGNAL finds them.`,
  oil_gas: `The energy transition is forcing oil & gas operators to reinvent themselves at speed. From carbon capture to LNG infrastructure, the builders navigating this shift are writing the future of energy. SIGNAL tells their stories.`,
  construction: `Construction is the world's largest industry and among its least digitized. A new generation of operators is changing that — with modular building, tech-enabled project management, and supply chain innovation. SIGNAL covers them.`,
};

export function checkForbiddenPhrases(content: string): string[] {
  return FORBIDDEN_PHRASES.filter(phrase =>
    content.toLowerCase().includes(phrase.toLowerCase())
  );
}

export function estimateWordCount(content: string): number {
  return content.trim().split(/\s+/).length;
}

export function validateWordCount(
  content: string,
  docType: keyof typeof CONTENT_STANDARDS
): { valid: boolean; count: number; min: number; max: number } {
  const standards = CONTENT_STANDARDS[docType];
  if (!('minWords' in standards)) return { valid: true, count: 0, min: 0, max: 0 };

  const count = estimateWordCount(content);
  return {
    valid: count >= standards.minWords && count <= standards.maxWords,
    count,
    min: standards.minWords,
    max: standards.maxWords,
  };
}
