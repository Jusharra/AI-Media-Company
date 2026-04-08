export const metadata = { title: 'Terms of Service — SIGNAL' };

export default function TermsPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-16">
      <div className="mb-10 border-b border-stone-200 pb-8">
        <p className="text-amber-600 font-mono text-xs uppercase tracking-wider mb-2">Legal</p>
        <h1 className="font-display text-5xl text-stone-900">Terms of Service</h1>
        <p className="text-stone-500 text-sm mt-3">Last updated: April 2025</p>
      </div>

      <div className="prose font-serif text-stone-700 leading-relaxed space-y-8">
        <section>
          <h2 className="font-display text-2xl text-stone-900 mb-3">1. Acceptance of Terms</h2>
          <p>
            By accessing or using the SIGNAL platform ("Service"), operated by The Signal Media ("Company",
            "we", "us", or "our"), you agree to be bound by these Terms of Service. If you do not agree
            to these terms, do not use the Service.
          </p>
        </section>

        <section>
          <h2 className="font-display text-2xl text-stone-900 mb-3">2. Description of Service</h2>
          <p>
            SIGNAL is an AI-powered editorial platform that produces in-depth coverage of operators in
            healthcare, energy, and construction. The Service includes editorial features, operator spotlights,
            podcast content, and related media distributed across digital channels.
          </p>
        </section>

        <section>
          <h2 className="font-display text-2xl text-stone-900 mb-3">3. User Submissions</h2>
          <p>
            When you submit information through our "Get Featured" application or any intake form, you
            grant the Company a non-exclusive license to use, reproduce, and publish that information
            for editorial and promotional purposes. You represent that you have the right to submit all
            information provided.
          </p>
        </section>

        <section>
          <h2 className="font-display text-2xl text-stone-900 mb-3">4. Content Accuracy</h2>
          <p>
            SIGNAL strives to publish accurate editorial content. All featured subjects undergo a
            verification process. However, the Company makes no warranty that all published content
            is error-free and reserves the right to correct or retract content at any time.
          </p>
        </section>

        <section>
          <h2 className="font-display text-2xl text-stone-900 mb-3">5. Intellectual Property</h2>
          <p>
            All editorial content, design, and software comprising the SIGNAL platform is owned by or
            licensed to the Company. You may not reproduce, republish, or redistribute SIGNAL content
            without prior written permission, except for brief quotations with attribution.
          </p>
        </section>

        <section>
          <h2 className="font-display text-2xl text-stone-900 mb-3">6. Third-Party Platforms</h2>
          <p>
            SIGNAL distributes content to third-party platforms including LinkedIn, Twitter/X, YouTube,
            and others. Use of content on those platforms is subject to their respective terms of service.
            The Company is not responsible for the policies or actions of third-party platforms.
          </p>
        </section>

        <section>
          <h2 className="font-display text-2xl text-stone-900 mb-3">7. Limitation of Liability</h2>
          <p>
            To the maximum extent permitted by law, the Company shall not be liable for any indirect,
            incidental, consequential, or punitive damages arising from your use of the Service. Our
            total liability for any claim shall not exceed fifty dollars ($50).
          </p>
        </section>

        <section>
          <h2 className="font-display text-2xl text-stone-900 mb-3">8. Governing Law</h2>
          <p>
            These Terms shall be governed by the laws of the State of Texas, without regard to conflict
            of law principles. Any dispute shall be resolved in the state or federal courts located in
            Texas.
          </p>
        </section>

        <section>
          <h2 className="font-display text-2xl text-stone-900 mb-3">9. Changes to Terms</h2>
          <p>
            We reserve the right to modify these Terms at any time. Continued use of the Service after
            changes constitutes acceptance of the updated Terms. We will post the effective date of any
            changes on this page.
          </p>
        </section>

        <section>
          <h2 className="font-display text-2xl text-stone-900 mb-3">10. Contact</h2>
          <p>
            Questions about these Terms should be directed to{' '}
            <a href="mailto:legal@signalmedia.co" className="text-amber-600 hover:text-amber-700">
              legal@signalmedia.co
            </a>.
          </p>
        </section>
      </div>
    </main>
  );
}
