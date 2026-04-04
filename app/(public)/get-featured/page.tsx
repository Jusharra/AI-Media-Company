'use client';

import { useState } from 'react';

const INDUSTRIES = [
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'oil_gas', label: 'Oil & Gas / Energy' },
  { value: 'construction', label: 'Construction' },
  { value: 'other', label: 'Other' },
];

const TIERS = [
  {
    name: 'Starter',
    price: '$300–500',
    description: 'Founder spotlight + social distribution',
    features: [
      'Written founder spotlight article',
      'LinkedIn post package (3 posts)',
      'Twitter/X thread',
      'SIGNAL editorial newsletter mention',
    ],
  },
  {
    name: 'Growth',
    price: '$800–1,500',
    description: 'Feature article + podcast episode + multi-platform',
    features: [
      'Long-form feature article (1,500+ words)',
      'Podcast episode on The SIGNAL Sessions',
      'Full social package (LinkedIn, Twitter, YouTube short)',
      'Thought leadership placement',
      'Google indexing & SEO optimization',
    ],
    highlight: true,
  },
  {
    name: 'Authority',
    price: '$2,000+',
    description: 'Full authority infrastructure build-out',
    features: [
      'Everything in Growth',
      'Video interview + YouTube episode',
      'Ongoing monthly coverage',
      'Competitor gap analysis',
      'Speaking & media referrals',
      'Dedicated account manager',
    ],
  },
];

export default function GetFeaturedPage() {
  const [formState, setFormState] = useState({
    name: '',
    email: '',
    company: '',
    title: '',
    industry: '',
    website: '',
    linkedin_url: '',
    hook: '',
    story: '',
    tier_interest: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setFormState(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_ADMIN_URL || 'http://localhost:3000'}/api/signal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formState.name,
          email: formState.email,
          company: formState.company,
          title: formState.title,
          industry: formState.industry,
          website: formState.website,
          linkedin_url: formState.linkedin_url,
          hook: formState.hook,
          notes: `Story: ${formState.story}\nTier interest: ${formState.tier_interest}`,
          source: 'get-featured-form',
        }),
      });

      if (res.ok) {
        setSubmitted(true);
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Something went wrong. Please try again.');
      }
    } catch {
      setError('Unable to submit. Please email us directly at hello@signal.media');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main>
        {/* Hero */}
        <section className="max-w-4xl mx-auto px-6 pt-16 pb-12">
          <p className="text-amber-600 font-mono text-sm uppercase tracking-wider mb-3">Get Featured</p>
          <h1 className="font-display text-5xl text-stone-900 leading-tight mb-4">
            Your story belongs in SIGNAL.
          </h1>
          <p className="text-stone-600 text-xl leading-relaxed max-w-2xl">
            SIGNAL covers operators with real credentials, measurable impact, and a story worth telling.
            If that's you — in healthcare, energy, or construction — apply below.
          </p>
        </section>

        {/* Tiers */}
        <section className="bg-stone-50 border-y border-stone-200 py-12 mb-16">
          <div className="max-w-6xl mx-auto px-6">
            <p className="text-stone-500 font-mono text-xs uppercase tracking-wider mb-6 text-center">Coverage Packages</p>
            <div className="grid grid-cols-3 gap-6">
              {TIERS.map(tier => (
                <div
                  key={tier.name}
                  className={`rounded border p-6 ${
                    tier.highlight
                      ? 'border-amber-400 bg-white shadow-sm'
                      : 'border-stone-200 bg-white'
                  }`}
                >
                  {tier.highlight && (
                    <p className="text-amber-600 font-mono text-xs uppercase tracking-wider mb-2">Most Popular</p>
                  )}
                  <h3 className="font-display text-2xl text-stone-900 mb-1">{tier.name}</h3>
                  <p className="text-amber-700 font-mono text-lg mb-2">{tier.price}</p>
                  <p className="text-stone-500 text-sm mb-4">{tier.description}</p>
                  <ul className="space-y-2">
                    {tier.features.map(f => (
                      <li key={f} className="flex gap-2 text-sm text-stone-600">
                        <span className="text-amber-500 shrink-0 mt-0.5">→</span>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Form or Confirmation */}
        <section className="max-w-2xl mx-auto px-6 pb-24">
          {submitted ? (
            <div className="border border-stone-200 rounded p-10 text-center">
              <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
                <span className="text-amber-700 text-xl">✓</span>
              </div>
              <h2 className="font-display text-3xl text-stone-900 mb-3">Application received.</h2>
              <p className="text-stone-600 text-lg mb-6">
                Our editorial team reviews every submission. If your profile meets our criteria,
                we'll reach out within 5 business days.
              </p>
              <p className="text-stone-400 text-sm font-mono">
                You'll hear from us at {formState.email}
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <h2 className="font-display text-3xl text-stone-900 mb-1">Apply to get covered.</h2>
                <p className="text-stone-500 text-sm">
                  All fields marked * are required. We review every submission personally.
                </p>
              </div>

              {/* Personal */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-stone-700 text-sm font-sans mb-1">Full name *</label>
                  <input
                    type="text"
                    name="name"
                    required
                    value={formState.name}
                    onChange={handleChange}
                    className="w-full border border-stone-200 rounded px-3 py-2 text-sm text-stone-900 focus:outline-none focus:border-amber-400"
                    placeholder="Jane Smith"
                  />
                </div>
                <div>
                  <label className="block text-stone-700 text-sm font-sans mb-1">Email *</label>
                  <input
                    type="email"
                    name="email"
                    required
                    value={formState.email}
                    onChange={handleChange}
                    className="w-full border border-stone-200 rounded px-3 py-2 text-sm text-stone-900 focus:outline-none focus:border-amber-400"
                    placeholder="jane@company.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-stone-700 text-sm font-sans mb-1">Company *</label>
                  <input
                    type="text"
                    name="company"
                    required
                    value={formState.company}
                    onChange={handleChange}
                    className="w-full border border-stone-200 rounded px-3 py-2 text-sm text-stone-900 focus:outline-none focus:border-amber-400"
                    placeholder="Acme Corp"
                  />
                </div>
                <div>
                  <label className="block text-stone-700 text-sm font-sans mb-1">Title / Role</label>
                  <input
                    type="text"
                    name="title"
                    value={formState.title}
                    onChange={handleChange}
                    className="w-full border border-stone-200 rounded px-3 py-2 text-sm text-stone-900 focus:outline-none focus:border-amber-400"
                    placeholder="CEO & Co-Founder"
                  />
                </div>
              </div>

              {/* Industry */}
              <div>
                <label className="block text-stone-700 text-sm font-sans mb-1">Industry *</label>
                <select
                  name="industry"
                  required
                  value={formState.industry}
                  onChange={handleChange}
                  className="w-full border border-stone-200 rounded px-3 py-2 text-sm text-stone-900 focus:outline-none focus:border-amber-400 bg-white"
                >
                  <option value="">Select your sector</option>
                  {INDUSTRIES.map(i => (
                    <option key={i.value} value={i.value}>{i.label}</option>
                  ))}
                </select>
              </div>

              {/* Links */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-stone-700 text-sm font-sans mb-1">Company website</label>
                  <input
                    type="url"
                    name="website"
                    value={formState.website}
                    onChange={handleChange}
                    className="w-full border border-stone-200 rounded px-3 py-2 text-sm text-stone-900 focus:outline-none focus:border-amber-400"
                    placeholder="https://yourcompany.com"
                  />
                </div>
                <div>
                  <label className="block text-stone-700 text-sm font-sans mb-1">LinkedIn profile</label>
                  <input
                    type="url"
                    name="linkedin_url"
                    value={formState.linkedin_url}
                    onChange={handleChange}
                    className="w-full border border-stone-200 rounded px-3 py-2 text-sm text-stone-900 focus:outline-none focus:border-amber-400"
                    placeholder="https://linkedin.com/in/..."
                  />
                </div>
              </div>

              {/* Hook */}
              <div>
                <label className="block text-stone-700 text-sm font-sans mb-1">
                  One-sentence hook *
                </label>
                <p className="text-stone-400 text-xs mb-2">
                  The single most compelling thing about what you're building. Think: what would make a skeptical journalist pay attention?
                </p>
                <input
                  type="text"
                  name="hook"
                  required
                  value={formState.hook}
                  onChange={handleChange}
                  className="w-full border border-stone-200 rounded px-3 py-2 text-sm text-stone-900 focus:outline-none focus:border-amber-400"
                  placeholder="We cut OR turnover time by 40% using ML scheduling — without adding staff."
                />
              </div>

              {/* Story */}
              <div>
                <label className="block text-stone-700 text-sm font-sans mb-1">Your story *</label>
                <p className="text-stone-400 text-xs mb-2">
                  Tell us about your background, what you're building, the problem you're solving, and any measurable traction.
                  Be specific — vague answers don't move forward.
                </p>
                <textarea
                  name="story"
                  required
                  rows={5}
                  value={formState.story}
                  onChange={handleChange}
                  className="w-full border border-stone-200 rounded px-3 py-2 text-sm text-stone-900 focus:outline-none focus:border-amber-400 resize-none"
                  placeholder="I spent 12 years as a trauma surgeon before founding MedFlow in 2021. We saw..."
                />
              </div>

              {/* Tier */}
              <div>
                <label className="block text-stone-700 text-sm font-sans mb-1">Package interest</label>
                <select
                  name="tier_interest"
                  value={formState.tier_interest}
                  onChange={handleChange}
                  className="w-full border border-stone-200 rounded px-3 py-2 text-sm text-stone-900 focus:outline-none focus:border-amber-400 bg-white"
                >
                  <option value="">Not sure yet / discuss with team</option>
                  <option value="starter">Starter ($300–500) — Spotlight + social</option>
                  <option value="growth">Growth ($800–1,500) — Feature + podcast</option>
                  <option value="authority">Authority ($2,000+) — Full infrastructure</option>
                </select>
              </div>

              {error && (
                <p className="text-red-600 text-sm border border-red-200 bg-red-50 rounded px-3 py-2">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-amber-600 hover:bg-amber-700 disabled:bg-amber-300 text-white font-sans text-sm py-3 rounded transition-colors"
              >
                {submitting ? 'Submitting...' : 'Submit application →'}
              </button>

              <p className="text-stone-400 text-xs text-center">
                We respond to every qualified submission within 5 business days.
                Not every application moves forward — SIGNAL maintains strict editorial standards.
              </p>
            </form>
          )}
        </section>
    </main>
  );
}
