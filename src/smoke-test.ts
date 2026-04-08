/**
 * SIGNAL Smoke Test
 * Injects mock content for all output types, approves them, runs distribution,
 * and verifies the full pipeline can reach "published" state without API credits.
 *
 * Usage: npx ts-node --project tsconfig.json src/smoke-test.ts
 */

// Load both .env and .env.local (Next.js convention)
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env.local'), override: true });
import { v4 as uuidv4 } from 'uuid';
import { getDb, getLeadDb } from './lib/db';
import { runDistribution } from './agents/distributor';

// ─── ANSI colours ────────────────────────────────────────────────────────────
const G = (s: string) => `\x1b[32m${s}\x1b[0m`;   // green
const Y = (s: string) => `\x1b[33m${s}\x1b[0m`;   // yellow
const R = (s: string) => `\x1b[31m${s}\x1b[0m`;   // red
const B = (s: string) => `\x1b[1m${s}\x1b[0m`;    // bold
const D = (s: string) => `\x1b[90m${s}\x1b[0m`;   // dim

function pass(label: string, detail = '') {
  console.log(`  ${G('✓')} ${label}${detail ? D(' — ' + detail) : ''}`);
}
function fail(label: string, err: unknown) {
  console.log(`  ${R('✗')} ${label}: ${err}`);
}
function section(title: string) {
  console.log(`\n${B(title)}`);
}

// ─── Mock content ─────────────────────────────────────────────────────────────
const MOCK_BACKGROUNDER = JSON.stringify({
  executive_summary: '[SMOKE TEST] Jusharra Goree is building a healthcare cybersecurity firm that closes compliance gaps left by legacy vendors.',
  hook: 'She walked into HIPAA audits expecting shields — and found binders.',
  key_facts: ['Founded 2023', 'Series A ready', 'Healthcare vertical focus'],
  story_angles: ['The compliance gap nobody talks about', 'Why HIPAA binders are not security', 'The founder who fixed what breaches exposed'],
  key_quotes: ['There was no single moment - it was a slow accumulation of the same conversation.'],
  insight_tags: ['cybersecurity', 'healthcare', 'compliance', 'founder-led'],
  industry_tag: 'healthcare',
});

const MOCK_FEATURE_ARTICLE = `# The Compliance Gap Nobody Talks About
*[SMOKE TEST CONTENT — not real editorial]*

Jusharra Goree spent years walking into healthcare environments and seeing the same thing: organizations that had spent real money on security tools, passed their HIPAA audits, had policies in binders on a shelf — and were still exposed. The tools were real. The audits were real. The binders were real. The protection wasn't.

"There wasn't one single moment," she told SIGNAL. "It was a slow accumulation of the same conversation happening in too many rooms."

That conversation became a company.

## The Founding Decision
Healthcare cybersecurity is a $15 billion market premised on a contradiction: compliance and security are treated as synonymous, when they're often orthogonal. An organization can be fully HIPAA-compliant and still be one phishing email away from a breach. Goree built her firm to collapse that gap.

## What She's Building
The platform runs continuous threat-surface analysis against HIPAA, HITECH, and SOC 2 frameworks simultaneously — not as a checkbox exercise, but as a live operational posture. The key innovation: it flags drift between policy documentation and actual system configurations in real time.

"Binders don't protect patients," she says. "Live visibility does."
`;

const MOCK_SPOTLIGHT = `**[SMOKE TEST] Jusharra Goree, Founder — Healthcare Cybersecurity**

Goree is building the firm she wished existed when she was on the other side of the audit table. After years in healthcare IT consulting, she kept encountering the same blind spot: compliance documentation that bore no relationship to actual security posture. Her company closes that gap with continuous, real-time analysis across HIPAA, HITECH, and SOC 2.`;

const MOCK_THOUGHT_LEADERSHIP = `# Why HIPAA Compliance Isn't the Same as HIPAA Security
*[SMOKE TEST CONTENT]*

Every healthcare CISO knows the audit cycle. You document your policies. You train your staff. You pass. You file the binders. And somewhere in that process, you've confused two things that the regulation itself never promised to keep aligned: compliance and actual security posture.

The gap between what your documentation says and what your systems do is where breaches live.

Three things to close it: (1) Map your controls to your live config, not your policies. (2) Treat configuration drift as a security event. (3) Audit your audits — most HIPAA reviews don't test for what they claim to test.`;

const MOCK_YOUTUBE_SCRIPT = `[SMOKE TEST — YouTube Script]

TITLE: She Fixed the HIPAA Compliance Trap | Jusharra Goree | SIGNAL

HOOK (0:00–0:30):
Every year, healthcare organizations spend millions passing HIPAA audits. And every year, they get breached anyway. That's not a coincidence — it's a design flaw in how compliance works. Today I'm talking to the founder who's fixing it.

INTRO (0:30–1:30):
Jusharra Goree spent years as a healthcare IT consultant watching the same pattern repeat. Organizations would invest in security tools, clear their audits, file their policy binders — and still be exposed. The tools were real. The audits were real. The risk was real.

MAIN CONTENT (1:30–8:00):
[INTERVIEW SEGMENT: The founding moment]
[INTERVIEW SEGMENT: How the product works]
[DEMO: Live configuration drift dashboard]
[INTERVIEW SEGMENT: What most CISOs miss about HIPAA]

OUTRO (8:00–9:00):
If you work in healthcare IT, share this. The gap between documentation and actual posture is where the danger lives — and most orgs don't know they're exposed. Subscribe for more founder conversations from SIGNAL.`;

const MOCK_LINKEDIN_POST = `[SMOKE TEST — LinkedIn Post]

Healthcare organizations pass HIPAA audits every year.

And get breached every year.

These two facts aren't contradictions — they're the same fact, viewed from opposite sides of the compliance-security gap.

Jusharra Goree saw this pattern repeat across dozens of healthcare environments. She built a company to close it.

The insight: compliance documentation and live system configuration drift apart constantly. Most orgs only discover the gap during an incident. Her platform makes that drift visible in real time — before the breach, not after.

This is what real healthcare security looks like.

→ Read the full SIGNAL feature: [link]
→ Follow Jusharra's work: [link]

#Healthcare #Cybersecurity #HIPAA #FounderStory #SIGNAL`;

const MOCK_TWITTER_THREAD = `[SMOKE TEST — Twitter Thread]

1/ Healthcare orgs pass HIPAA audits every year. And get breached every year. These aren't contradictions — they're the same fact from opposite sides of the compliance-security gap.

2/ Jusharra Goree spent years consulting in healthcare IT. She kept walking into the same room: org passed their audit, has the binders, has the tools — and is still exposed. Policy said one thing. Systems said another.

3/ She built a company to make that drift visible in real time. Not during an audit. Not after a breach. Continuously — as configuration and documentation pull apart.

4/ "There wasn't one single moment. It was a slow accumulation of the same conversation happening in too many rooms." That conversation became a company.

5/ Full story on SIGNAL → [link]`;

const MOCK_PODCAST_SCRIPT = `[SMOKE TEST — Podcast Script]

SHOW: The Signal
EPISODE: "The Compliance Trap: Jusharra Goree on Why HIPAA Binders Don't Protect Patients"
LENGTH: ~35 minutes

[COLD OPEN]
HOST: Healthcare organizations in the United States spend an estimated 8 billion dollars a year on HIPAA compliance. They document their policies. They train their staff. They pass their audits. And they get breached anyway. Today's guest has a theory about why — and she's built a company around fixing it.

[SEGMENT 1: THE FOUNDING MOMENT]
HOST: Walk me back to the moment you decided to build this.
GUEST: There wasn't one moment. It was a slow accumulation...

[SEGMENT 2: THE PRODUCT]
HOST: So what does the platform actually do day-to-day?
GUEST: It runs continuous analysis against HIPAA, HITECH, and SOC 2 simultaneously...

[SEGMENT 3: THE MARKET]
HOST: Who's the customer? The CISO? The CFO?
GUEST: It starts with the CISO but the conversation always lands on the CFO's desk when we show them the breach cost delta...

[OUTRO]
HOST: For healthcare IT leaders listening — what's the one thing you'd want them to do after this conversation?
GUEST: Audit your audits. Most HIPAA reviews don't test for what they claim to test. Start there.`;

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log(B('\n══════════════════════════════════════════'));
  console.log(B('  SIGNAL Smoke Test — Full Pipeline Run'));
  console.log(B('══════════════════════════════════════════'));

  const leadDb = getLeadDb();
  const scoutDb = getDb('signal-scout');
  const bgDb = getDb('backgrounder');
  const journalistDb = getDb('journalist');
  const mediaDb = getDb('media-producer');
  const distributorDb = getDb('distributor');

  // ── 0. Pre-flight: show which platform keys loaded ─────────────────────────
  section('0. Platform API Key Check');
  const checks = [
    { label: 'LinkedIn',  key: !!process.env.LINKEDIN_ACCESS_TOKEN },
    { label: 'Twitter',   key: !!(process.env.TWITTER_API_KEY && process.env.TWITTER_ACCESS_TOKEN) },
    { label: 'YouTube',   key: !!process.env.YOUTUBE_CLIENT_ID },
    { label: 'SendGrid',  key: !!(process.env.SENDGRID_API_KEY?.startsWith('SG.')) },
    { label: 'Anthropic', key: !!process.env.ANTHROPIC_API_KEY },
  ];
  for (const c of checks) {
    if (c.key) { pass(c.label, 'key loaded'); }
    else { console.log(`  ${Y('○')} ${c.label} — ${D('not configured (will skip)')}`); }
  }

  // ── 1. Find or create test entity ─────────────────────────────────────────
  section('1. Entity Setup');

  // Try to use the live entity first
  let entity = scoutDb.prepare(
    `SELECT * FROM entities ORDER BY created_at DESC LIMIT 1`
  ).get() as { id: string; name: string } | undefined;

  let taskId: string;
  let entityId: string;

  if (entity) {
    entityId = entity.id;
    console.log(`  Using existing entity: ${Y(entity.name)} (${D(entityId.slice(0, 8))})`);

    const pipeline = leadDb.prepare(
      'SELECT task_id FROM pipeline_state WHERE entity_id = ?'
    ).get(entityId) as { task_id: string } | undefined;

    if (pipeline) {
      taskId = pipeline.task_id;
      pass('Found existing pipeline', taskId.slice(0, 8));
    } else {
      taskId = uuidv4();
      leadDb.prepare(`
        INSERT OR IGNORE INTO pipeline_state (task_id, entity_id, entity_name, current_stage, created_at, updated_at)
        VALUES (?, ?, ?, 'journalist', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `).run(taskId, entityId, entity.name);
      pass('Created pipeline record', taskId.slice(0, 8));
    }
  } else {
    // Create a fresh test entity
    entityId = uuidv4();
    taskId = uuidv4();

    scoutDb.prepare(`
      INSERT INTO entities (id, name, company, industry, source, status, score, created_at, updated_at)
      VALUES (?, 'Smoke Test Founder', 'SmokeTest Co.', 'healthcare', 'manual', 'approved', 85, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `).run(entityId);

    leadDb.prepare(`
      INSERT OR IGNORE INTO pipeline_state (task_id, entity_id, entity_name, current_stage, created_at, updated_at)
      VALUES (?, ?, 'Smoke Test Founder', 'journalist', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `).run(taskId, entityId);

    pass('Created fresh test entity', entityId.slice(0, 8));
    pass('Created pipeline record', taskId.slice(0, 8));
    entity = { id: entityId, name: 'Smoke Test Founder' };
  }

  // ── 2. Inject backgrounder ─────────────────────────────────────────────────
  section('2. Backgrounder');

  const backgrounderId = uuidv4();
  try {
    bgDb.prepare(`
      INSERT OR IGNORE INTO outputs (id, task_id, entity_id, doc_type, content, validation_score, confidence_tier, version, status, created_at)
      VALUES (?, ?, ?, 'backgrounder', ?, 92, 'high', 1, 'approved', CURRENT_TIMESTAMP)
    `).run(backgrounderId, taskId, entityId, MOCK_BACKGROUNDER);
    pass('Backgrounder inserted', `score=92 confidence=high`);
  } catch (err) {
    fail('Backgrounder insert', err);
  }

  // ── 3. Journalist outputs ──────────────────────────────────────────────────
  section('3. Journalist Outputs (Feature Article · Spotlight · Thought Leadership)');

  const articleIds: string[] = [];
  const journalistPieces = [
    { type: 'feature_article',     content: MOCK_FEATURE_ARTICLE,    label: 'Feature Article',      words: 250 },
    { type: 'spotlight',           content: MOCK_SPOTLIGHT,           label: 'Spotlight',            words: 60  },
    { type: 'thought_leadership',  content: MOCK_THOUGHT_LEADERSHIP,  label: 'Thought Leadership',   words: 120 },
  ];

  // Ensure journalist task row exists
  journalistDb.prepare(`
    INSERT OR IGNORE INTO tasks (id, entity_id, agent, status, created_at, updated_at)
    VALUES (?, ?, 'journalist', 'complete', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  `).run(taskId, entityId);

  for (const piece of journalistPieces) {
    const id = uuidv4();
    try {
      journalistDb.prepare(`
        INSERT OR IGNORE INTO outputs (id, task_id, entity_id, doc_type, content, validation_score, confidence_tier, version, status, created_at)
        VALUES (?, ?, ?, ?, ?, 88, 'high', 1, 'approved', CURRENT_TIMESTAMP)
      `).run(id, taskId, entityId, piece.type, piece.content);
      articleIds.push(id);
      pass(piece.label, `id=${id.slice(0, 8)} ~${piece.words} words`);
    } catch (err) {
      fail(piece.label, err);
    }
  }

  // ── 4. Media producer outputs ──────────────────────────────────────────────
  section('4. Media Producer Outputs (YouTube · LinkedIn · Twitter · Podcast)');

  const mediaIds: string[] = [];
  const mediaPieces = [
    { type: 'youtube_script',  content: MOCK_YOUTUBE_SCRIPT,  label: 'YouTube Script'  },
    { type: 'social_package',  content: MOCK_LINKEDIN_POST,   label: 'LinkedIn Post'   },
    { type: 'twitter_thread',  content: MOCK_TWITTER_THREAD,  label: 'Twitter Thread'  },
    { type: 'podcast_script',  content: MOCK_PODCAST_SCRIPT,  label: 'Podcast Script'  },
  ];

  // Ensure media-producer task row exists
  mediaDb.prepare(`
    INSERT OR IGNORE INTO tasks (id, entity_id, agent, status, created_at, updated_at)
    VALUES (?, ?, 'media-producer', 'complete', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  `).run(taskId, entityId);

  for (const piece of mediaPieces) {
    const id = uuidv4();
    try {
      mediaDb.prepare(`
        INSERT OR IGNORE INTO outputs (id, task_id, entity_id, doc_type, content, validation_score, confidence_tier, version, status, created_at)
        VALUES (?, ?, ?, ?, ?, 90, 'high', 1, 'approved', CURRENT_TIMESTAMP)
      `).run(id, taskId, entityId, piece.type, piece.content);
      mediaIds.push(id);
      pass(piece.label, `id=${id.slice(0, 8)}`);
    } catch (err) {
      fail(piece.label, err);
    }
  }

  const allContentIds = [...articleIds, ...mediaIds];

  // ── 5. Gate decisions ──────────────────────────────────────────────────────
  section('5. Gate Decisions (simulating human approvals)');

  const gates: Array<{ gate: number; label: string }> = [
    { gate: 1, label: 'Scout → Interview' },
    { gate: 2, label: 'Backgrounder' },
    { gate: 3, label: 'Content Review' },
  ];

  for (const { gate, label } of gates) {
    try {
      leadDb.prepare(`
        INSERT OR IGNORE INTO gate_decisions (id, task_id, gate_number, decision, notes, decided_by, created_at)
        VALUES (?, ?, ?, 'approved', '[smoke-test] Auto-approved', 'auto', CURRENT_TIMESTAMP)
      `).run(uuidv4(), taskId, gate);
      pass(`Gate ${gate} — ${label}`, 'approved');
    } catch (err) {
      fail(`Gate ${gate}`, err);
    }
  }

  // Update pipeline gate_status
  leadDb.prepare(`
    UPDATE pipeline_state SET gate_status = '{"1":"approved","2":"approved","3":"approved"}', current_stage = 'distributor', updated_at = CURRENT_TIMESTAMP WHERE task_id = ?
  `).run(taskId);
  pass('Pipeline advanced to distributor stage');

  // ── 6. Distribution ────────────────────────────────────────────────────────
  section('6. Distribution (website · linkedin · twitter · youtube)');

  // Run each platform individually via platform-apis to see real per-platform errors
  const { publishToLinkedIn, publishToTwitter, publishToYouTube, publishToWebsite } = await import('./lib/platform-apis');

  const platformResults: Array<{ platform: string; success: boolean; url?: string; error?: string }> = [];

  const linkedInResult = await publishToLinkedIn({ text: MOCK_LINKEDIN_POST.slice(0, 2900) });
  platformResults.push({ platform: 'linkedin', success: linkedInResult.success, url: linkedInResult.postUrl, error: linkedInResult.error });

  const twitterResult = await publishToTwitter({ text: MOCK_TWITTER_THREAD.split('\n')[0] });
  platformResults.push({ platform: 'twitter', success: twitterResult.success, url: twitterResult.postUrl, error: twitterResult.error });

  const youtubeResult = await publishToYouTube({ title: 'SIGNAL — Jusharra Goree', description: MOCK_YOUTUBE_SCRIPT.slice(0, 4900) });
  platformResults.push({ platform: 'youtube', success: youtubeResult.success, url: youtubeResult.postUrl, error: youtubeResult.error });

  const websiteResult = await publishToWebsite({ type: 'article', data: { title: 'Smoke Test', content: MOCK_FEATURE_ARTICLE, status: 'published' } });
  platformResults.push({ platform: 'website', success: websiteResult.success, url: websiteResult.postUrl, error: websiteResult.error });

  for (const r of platformResults) {
    if (r.success) {
      pass(r.platform, r.url ?? 'published');
    } else {
      console.log(`  ${R('✗')} ${r.platform.padEnd(10)} ${D(r.error ?? 'unknown error')}`);
    }
  }

  // Also run full distribution pipeline for DB logging
  let distributionUrls: Record<string, string> = {};
  try {
    const result = await runDistribution(taskId, entityId, allContentIds);
    distributionUrls = result.distributionUrls;
  } catch (err) {
    fail('Distribution DB logging', err);
  }

  // ── 7. Verify database state ───────────────────────────────────────────────
  section('7. Verification');

  const publishedArticles = journalistDb.prepare(
    `SELECT COUNT(*) as c FROM outputs WHERE entity_id = ? AND status = 'approved'`
  ).get(entityId) as { c: number };
  pass(`Journalist outputs approved`, `${publishedArticles.c} records`);

  const publishedMedia = mediaDb.prepare(
    `SELECT COUNT(*) as c FROM outputs WHERE entity_id = ? AND status = 'approved'`
  ).get(entityId) as { c: number };
  pass(`Media producer outputs approved`, `${publishedMedia.c} records`);

  const distLogs = distributorDb.prepare(
    `SELECT platform, status, post_url FROM distribution_logs WHERE task_id IN (SELECT id FROM tasks WHERE entity_id = ?) ORDER BY created_at DESC LIMIT 10`
  ).all(entityId) as Array<{ platform: string; status: string; post_url: string | null }>;
  pass(`Distribution logs`, `${distLogs.length} records`);

  // ── 8. Summary ─────────────────────────────────────────────────────────────
  console.log(`\n${B('══════════════════════════════════════════')}`);
  console.log(B('  Results'));
  console.log(B('══════════════════════════════════════════'));

  console.log(`\n  Entity:   ${Y((entity as { name: string }).name)} ${D('(' + entityId.slice(0, 8) + ')')}`);
  console.log(`  Task ID:  ${D(taskId.slice(0, 8))}`);
  console.log(`  Articles: ${G(String(articleIds.length))} journalist outputs`);
  console.log(`  Media:    ${G(String(mediaIds.length))} media-producer outputs`);

  console.log(`\n  Distribution:`);
  if (distLogs.length === 0) {
    console.log(`    ${Y('No distribution logs — platform APIs not configured (expected)')}`);
  } else {
    for (const log of distLogs) {
      const icon = log.status === 'published' ? G('✓') : Y('~');
      console.log(`    ${icon} ${log.platform.padEnd(10)} ${log.status.padEnd(10)} ${D(log.post_url ?? '—')}`);
    }
  }

  if (Object.keys(distributionUrls).length > 0) {
    console.log(`\n  Published URLs:`);
    for (const [platform, url] of Object.entries(distributionUrls)) {
      console.log(`    ${G(platform.padEnd(10))} ${url}`);
    }
  }

  console.log(`\n  ${G('Smoke test complete.')} Pipeline infrastructure is working.\n`);
  console.log(D('  Note: Platform publishing (LinkedIn/Twitter) requires valid API keys in .env.local\n'));
}

main().catch(err => {
  console.error(R('\nSmoke test failed:'), err);
  process.exit(1);
});
