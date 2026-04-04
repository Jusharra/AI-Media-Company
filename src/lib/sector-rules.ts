import type { Industry } from './types';

export const SECTOR_CONTEXT: Record<Industry, SectorContext> = {
  healthcare: {
    name: 'Healthcare',
    description: 'Healthcare innovation, medical technology, value-based care, digital health, and life sciences operators',
    keyThemes: [
      'Value-based care models',
      'AI diagnostics and clinical decision support',
      'Healthcare interoperability and data standards',
      'Rural and underserved community access',
      'Mental health technology and teletherapy',
      'Medical device innovation',
      'Population health management',
      'Revenue cycle management and billing automation',
    ],
    qualificationMarkers: [
      'Board certifications or clinical credentials',
      'CMS/FDA regulatory experience',
      'Hospital system or health plan contracts',
      'Patient outcome metrics',
      'EHR integration partnerships',
      'HIPAA compliance infrastructure',
    ],
    keyPublications: ['STAT News', 'Modern Healthcare', 'Health Affairs', 'Becker\'s Hospital Review', 'MedCity News'],
    targetFounderProfile: 'Clinicians-turned-operators, health system executives building independent ventures, medical device engineers, digital health platform founders',
    badgeColor: 'rose',
    sectorContext: `Healthcare is undergoing its most significant structural transformation in decades. Fee-for-service models are giving way to value-based care, AI is entering clinical workflows, and a new class of operators — many with clinical backgrounds — are building the infrastructure layer between payers, providers, and patients. Despite the scale of this transformation, most of its builders remain unknown outside specialist circles. SIGNAL finds them.`,
  },

  oil_gas: {
    name: 'Oil & Gas / Energy',
    description: 'Energy transition, upstream/midstream/downstream operators, LNG, carbon capture, and energy infrastructure innovators',
    keyThemes: [
      'Energy transition and decarbonization strategies',
      'LNG infrastructure and export facilities',
      'Carbon capture, utilization, and storage (CCUS)',
      'Digital oilfield and IoT sensor networks',
      'Permian Basin and shale optimization',
      'Offshore drilling technology',
      'Pipeline integrity and leak detection',
      'Energy storage and grid balancing',
    ],
    qualificationMarkers: [
      'Operator certifications (API, SPE membership)',
      'Production volume or acreage metrics',
      'Reserve estimates and PV10 valuations',
      'Regulatory compliance history (EPA, FERC, PHMSA)',
      'Named technology or process patents',
      'Joint venture or farmout agreements',
    ],
    keyPublications: ['Oil & Gas Journal', 'Hart Energy', 'World Oil', 'Rigzone', 'SPE Journal', 'Energy Intelligence'],
    targetFounderProfile: 'Independent operators, E&P company founders, oilfield services entrepreneurs, energy transition executives, geoscience-led startups',
    badgeColor: 'amber',
    sectorContext: `The energy industry is being reshaped by the dual forces of the energy transition and a resurgent commodity market. Operators who built careers on conventional production are now navigating carbon accounting, ESG investor pressure, and the race to decarbonize. At the same time, a new generation of energy entrepreneurs is building the infrastructure — carbon pipelines, hydrogen facilities, digital monitoring platforms — that the transition requires. SIGNAL covers both.`,
  },

  construction: {
    name: 'Construction',
    description: 'Construction technology, modular building, project management platforms, supply chain, and built environment innovators',
    keyThemes: [
      'Modular and prefabricated construction',
      'Construction technology and BuildTech',
      'Project management and scheduling software',
      'Drone and aerial survey technology',
      'Materials innovation (mass timber, concrete alternatives)',
      'Labor shortage and workforce development',
      'Supply chain visibility and procurement',
      'Sustainability and green building standards',
    ],
    qualificationMarkers: [
      'Licensed contractor status (GC, specialty contractor)',
      'Project portfolio value (completed or under construction)',
      'Union agreements or apprenticeship programs',
      'LEED or sustainability certifications',
      'Safety record (EMR rating)',
      'Technology adoption metrics',
    ],
    keyPublications: ['Engineering News-Record (ENR)', 'Construction Dive', 'BuiltWorld', 'Autodesk Construction Cloud Blog', 'Construction Executive'],
    targetFounderProfile: 'General contractors turned tech founders, construction software entrepreneurs, modular building companies, specialty subcontractors with proprietary methods',
    badgeColor: 'orange',
    sectorContext: `Construction is the world\'s largest industry by employment and among its least digitized. The sector accounts for 13% of global GDP yet productivity growth has been essentially flat for decades. A new generation of operators — many with boots-on-the-ground experience — is changing that, building software platforms, new material supply chains, and modular building systems that could fundamentally reshape how the built environment gets made. SIGNAL covers the builders building better ways to build.`,
  },

  other: {
    name: 'Other',
    description: 'Cross-sector operators and founders not fitting primary categories',
    keyThemes: ['Cross-industry innovation', 'Market disruption', 'Operational excellence'],
    qualificationMarkers: ['Industry credentials', 'Revenue metrics', 'Customer contracts'],
    keyPublications: [],
    targetFounderProfile: 'Operators with cross-sector applicability',
    badgeColor: 'zinc',
    sectorContext: 'Innovators operating across sector boundaries.',
  },
};

export interface SectorContext {
  name: string;
  description: string;
  keyThemes: string[];
  qualificationMarkers: string[];
  keyPublications: string[];
  targetFounderProfile: string;
  badgeColor: string;
  sectorContext: string;
}

export function getSectorContext(industry: Industry): SectorContext {
  return SECTOR_CONTEXT[industry];
}

export function getResearchPromptContext(industry: Industry): string {
  const ctx = SECTOR_CONTEXT[industry];
  return `
SECTOR: ${ctx.name}
CONTEXT: ${ctx.sectorContext}

KEY THEMES TO WATCH:
${ctx.keyThemes.map(t => `- ${t}`).join('\n')}

CREDIBILITY MARKERS TO VERIFY:
${ctx.qualificationMarkers.map(m => `- ${m}`).join('\n')}

TARGET PROFILE: ${ctx.targetFounderProfile}

RELEVANT PUBLICATIONS FOR CROSS-REFERENCE: ${ctx.keyPublications.join(', ')}
`;
}

export const MONETIZATION_TIERS = {
  starter: {
    name: 'Starter',
    price: '$300–$500',
    includes: ['Feature article', 'Social distribution (LinkedIn + X)', 'SIGNAL website publication'],
    targetEntity: 'Emerging founder, early-stage company, limited media presence',
  },
  growth: {
    name: 'Growth',
    price: '$800–$1,500',
    includes: ['Feature article', 'Podcast episode script', 'Full social distribution', 'YouTube script', 'SIGNAL website publication with spotlight'],
    targetEntity: 'Mid-stage founder, Series A-B company, growing media profile',
  },
  authority: {
    name: 'Authority',
    price: '$2,000+',
    includes: ['Feature article + spotlight + thought leadership piece', 'Podcast episode (full production support)', 'YouTube video', 'Full social package', 'Priority placement', 'Distribution report', 'SIGNAL website homepage feature'],
    targetEntity: 'Established operator, significant company, authority-building investment',
  },
} as const;
