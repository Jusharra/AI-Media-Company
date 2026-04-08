export const metadata = { title: 'Privacy Policy — SIGNAL' };

export default function PrivacyPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-16">
      <div className="mb-10 border-b border-stone-200 pb-8">
        <p className="text-amber-600 font-mono text-xs uppercase tracking-wider mb-2">Legal</p>
        <h1 className="font-display text-5xl text-stone-900">Privacy Policy</h1>
        <p className="text-stone-500 text-sm mt-3">Last updated: April 2025</p>
      </div>

      <div className="prose font-serif text-stone-700 leading-relaxed space-y-8">
        <section>
          <h2 className="font-display text-2xl text-stone-900 mb-3">1. Information We Collect</h2>
          <p>We collect information you provide directly to us, including:</p>
          <ul className="list-disc pl-6 space-y-2 mt-3">
            <li>Name, company, title, and contact information submitted via intake forms</li>
            <li>Interview responses and supporting materials you provide</li>
            <li>Communications you send to us via email or contact forms</li>
            <li>Usage data such as pages visited and features used on this site</li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-2xl text-stone-900 mb-3">2. How We Use Your Information</h2>
          <p>We use the information we collect to:</p>
          <ul className="list-disc pl-6 space-y-2 mt-3">
            <li>Produce and publish editorial features about your company and story</li>
            <li>Communicate with you regarding your feature application and publication</li>
            <li>Distribute your story across digital platforms (LinkedIn, Twitter/X, YouTube, and our website)</li>
            <li>Improve the quality and relevance of our editorial coverage</li>
            <li>Send you a copy of your published feature and engagement metrics</li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-2xl text-stone-900 mb-3">3. Information Sharing</h2>
          <p>
            We do not sell your personal information. We may share your information with:
          </p>
          <ul className="list-disc pl-6 space-y-2 mt-3">
            <li>
              <strong>Third-party platforms</strong> — When we publish your feature, content is distributed
              to LinkedIn, Twitter/X, YouTube, and this website per their respective privacy policies.
            </li>
            <li>
              <strong>Service providers</strong> — We use tools such as SendGrid for email delivery and
              AI writing assistants to help draft editorial content. These providers access only what is
              necessary to deliver their services.
            </li>
            <li>
              <strong>Legal requirements</strong> — We may disclose information if required by law or
              in response to valid legal process.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-2xl text-stone-900 mb-3">4. Data Retention</h2>
          <p>
            We retain your information for as long as necessary to provide the Service and maintain
            our editorial archive. Published articles are maintained indefinitely unless you request
            removal. Contact information and intake data is retained for up to 24 months.
          </p>
        </section>

        <section>
          <h2 className="font-display text-2xl text-stone-900 mb-3">5. Your Rights</h2>
          <p>
            You may request access to, correction of, or deletion of your personal information at any
            time by contacting us. For published editorial content, removal requests will be reviewed
            on a case-by-case basis consistent with our editorial standards.
          </p>
        </section>

        <section>
          <h2 className="font-display text-2xl text-stone-900 mb-3">6. Cookies and Analytics</h2>
          <p>
            This site may use cookies and standard web analytics tools to understand how visitors use
            the site. No cross-site tracking or advertising cookies are used. You may disable cookies
            in your browser settings at any time.
          </p>
        </section>

        <section>
          <h2 className="font-display text-2xl text-stone-900 mb-3">7. Security</h2>
          <p>
            We implement industry-standard security measures to protect your information, including
            encrypted connections (HTTPS), hashed passwords, and access controls on all data stores.
            No transmission over the internet is 100% secure, and we cannot guarantee absolute security.
          </p>
        </section>

        <section>
          <h2 className="font-display text-2xl text-stone-900 mb-3">8. Children</h2>
          <p>
            SIGNAL is not directed to individuals under the age of 18. We do not knowingly collect
            personal information from children. If we learn we have collected information from a child,
            we will delete it promptly.
          </p>
        </section>

        <section>
          <h2 className="font-display text-2xl text-stone-900 mb-3">9. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We will post the updated effective
            date on this page. Continued use of the Service after changes constitutes acceptance.
          </p>
        </section>

        <section>
          <h2 className="font-display text-2xl text-stone-900 mb-3">10. Contact Us</h2>
          <p>
            For privacy questions or requests, contact us at{' '}
            <a href="mailto:privacy@signalmedia.co" className="text-amber-600 hover:text-amber-700">
              privacy@signalmedia.co
            </a>.
          </p>
        </section>
      </div>
    </main>
  );
}
