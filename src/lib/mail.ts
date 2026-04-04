import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY || '');

const FROM = process.env.SENDGRID_FROM_EMAIL || 'noreply@signal-media.com';

interface QuestionSection {
  section_name: string;
  section_intro?: string;
  questions: Array<{ id: string; question: string; expected_length?: string }>;
}

interface QuestionSet {
  intro_message: string;
  sections: QuestionSection[];
  closing_message: string;
  response_deadline: string;
}

export async function sendInterviewQuestions(options: {
  toEmail: string;
  founderName: string;
  questionSet: QuestionSet;
}): Promise<void> {
  const { toEmail, founderName, questionSet } = options;

  // Build plain-text version
  const textLines: string[] = [
    questionSet.intro_message,
    '',
    '---',
    '',
  ];
  let qNum = 1;
  for (const section of questionSet.sections) {
    textLines.push(`${section.section_name.toUpperCase()}`);
    if (section.section_intro) textLines.push(section.section_intro);
    textLines.push('');
    for (const q of section.questions) {
      textLines.push(`${qNum}. ${q.question}`);
      if (q.expected_length) textLines.push(`   (${q.expected_length} response)`);
      textLines.push('');
      qNum++;
    }
  }
  textLines.push('---');
  textLines.push('');
  textLines.push(questionSet.closing_message);
  textLines.push('');
  textLines.push(`Response deadline: ${questionSet.response_deadline}`);

  // Build HTML version
  let htmlSections = '';
  qNum = 1;
  for (const section of questionSet.sections) {
    htmlSections += `<h3 style="color:#b45309;font-family:monospace;font-size:13px;text-transform:uppercase;letter-spacing:2px;margin-top:28px">${section.section_name}</h3>`;
    if (section.section_intro) {
      htmlSections += `<p style="color:#52525b;font-size:14px;margin-bottom:12px">${section.section_intro}</p>`;
    }
    for (const q of section.questions) {
      htmlSections += `
        <div style="margin-bottom:20px;padding:14px 16px;background:#18181b;border-left:3px solid #b45309;border-radius:4px">
          <p style="color:#e4e4e7;font-size:15px;margin:0 0 6px">${qNum}. ${q.question}</p>
          ${q.expected_length ? `<p style="color:#52525b;font-size:12px;font-family:monospace;margin:0">${q.expected_length} response</p>` : ''}
        </div>`;
      qNum++;
    }
  }

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="background:#09090b;color:#e4e4e7;font-family:Georgia,serif;max-width:620px;margin:0 auto;padding:40px 24px">
  <div style="margin-bottom:32px">
    <h1 style="font-family:monospace;color:#f59e0b;font-size:28px;letter-spacing:4px;margin:0">SIGNAL</h1>
    <p style="color:#52525b;font-family:monospace;font-size:12px;margin:4px 0 0">The Authority Engine</p>
  </div>
  <p style="color:#e4e4e7;font-size:16px;line-height:1.7">${questionSet.intro_message}</p>
  <hr style="border:none;border-top:1px solid #27272a;margin:28px 0">
  ${htmlSections}
  <hr style="border:none;border-top:1px solid #27272a;margin:28px 0">
  <p style="color:#e4e4e7;font-size:15px;line-height:1.7">${questionSet.closing_message}</p>
  <p style="color:#f59e0b;font-family:monospace;font-size:13px;margin-top:24px">
    Response deadline: ${questionSet.response_deadline}
  </p>
  <p style="color:#3f3f46;font-family:monospace;font-size:11px;margin-top:40px">
    SIGNAL Media Engine — Confidential interview materials
  </p>
</body>
</html>`;

  await sgMail.send({
    to: toEmail,
    from: FROM,
    subject: `Your SIGNAL Interview — ${founderName}`,
    text: textLines.join('\n'),
    html,
  });
}

export async function sendDistributionReport(options: {
  toEmail: string;
  entityName: string;
  distributionUrls: Record<string, string>;
}): Promise<void> {
  const { toEmail, entityName, distributionUrls } = options;

  const platforms = Object.entries(distributionUrls);
  const linksHtml = platforms.map(([platform, url]) =>
    `<li style="margin-bottom:8px"><a href="${url}" style="color:#f59e0b">${platform.toUpperCase()}</a> — <span style="color:#71717a;font-size:13px">${url}</span></li>`
  ).join('');
  const linksText = platforms.map(([p, u]) => `${p.toUpperCase()}: ${u}`).join('\n');

  const html = `
<!DOCTYPE html>
<html>
<body style="background:#09090b;color:#e4e4e7;font-family:Georgia,serif;max-width:620px;margin:0 auto;padding:40px 24px">
  <h1 style="font-family:monospace;color:#f59e0b;font-size:28px;letter-spacing:4px">SIGNAL</h1>
  <h2 style="color:#e4e4e7;font-size:20px">Your content is live</h2>
  <p style="color:#a1a1aa">The SIGNAL team has published your feature across the following platforms:</p>
  <ul style="padding-left:20px;margin:20px 0">${linksHtml}</ul>
  <p style="color:#52525b;font-size:13px;font-family:monospace;margin-top:32px">SIGNAL Media Engine</p>
</body>
</html>`;

  await sgMail.send({
    to: toEmail,
    from: FROM,
    subject: `Your SIGNAL feature is live — ${entityName}`,
    text: `Your content is live!\n\n${linksText}\n\nSIGNAL Media Engine`,
    html,
  });
}
