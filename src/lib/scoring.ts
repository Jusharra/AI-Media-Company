import type { ConfidenceTier } from './types';

export interface ValidationResult {
  score: number;
  tier: ConfidenceTier;
  gaps: string[];
  passed: boolean;
}

export interface ValidationCriteria {
  accuracy: number;       // 0-20: Claims traceable to backgrounder
  completeness: number;   // 0-20: All required sections present
  toneQuality: number;    // 0-20: Editorial, not generic AI
  noHallucinations: number; // 0-20: No unverified stats/quotes
  brandAlignment: number;  // 0-10: SIGNAL voice: sharp, authoritative
  structural: number;      // 0-10: Proper format, word count in range
}

export function calculateValidationScore(criteria: ValidationCriteria): ValidationResult {
  const score = Math.round(
    criteria.accuracy +
    criteria.completeness +
    criteria.toneQuality +
    criteria.noHallucinations +
    criteria.brandAlignment +
    criteria.structural
  );

  const clampedScore = Math.max(0, Math.min(100, score));

  const gaps: string[] = [];

  if (criteria.accuracy < 15) gaps.push('Accuracy: Claims not sufficiently traceable to source material');
  if (criteria.completeness < 15) gaps.push('Completeness: Missing required sections or content types');
  if (criteria.toneQuality < 12) gaps.push('Tone: Content reads as generic AI output, not editorial quality');
  if (criteria.noHallucinations < 15) gaps.push('Hallucination Risk: Unverified statistics or quotes detected');
  if (criteria.brandAlignment < 7) gaps.push('Brand: Does not match SIGNAL voice (sharp, authoritative, human)');
  if (criteria.structural < 7) gaps.push('Structure: Formatting issues or word count out of expected range');

  let tier: ConfidenceTier;
  if (clampedScore >= 90) tier = 'high';
  else if (clampedScore >= 70) tier = 'medium';
  else tier = 'low';

  return {
    score: clampedScore,
    tier,
    gaps,
    passed: clampedScore >= 50,
  };
}

export function getConfidenceTier(score: number): ConfidenceTier {
  if (score >= 90) return 'high';
  if (score >= 70) return 'medium';
  return 'low';
}

export function requiresRevision(score: number): boolean {
  return score < 50;
}

export function isFastLane(score: number): boolean {
  return score >= 90;
}

// Score entity relevance for Signal Scout
export interface EntityScoreCriteria {
  industryMatch: boolean;
  hasInnovationAngle: boolean;
  isUnderexposed: boolean;  // Not already widely covered
  sectorRelevance: number;  // 0-25: healthcare/oil-gas/construction depth
  founderCredibility: number; // 0-25: measurable credibility markers
}

export function scoreEntity(criteria: EntityScoreCriteria): number {
  let score = 0;
  if (criteria.industryMatch) score += 20;
  if (criteria.hasInnovationAngle) score += 15;
  if (criteria.isUnderexposed) score += 15;
  score += criteria.sectorRelevance;
  score += criteria.founderCredibility;
  return Math.min(100, score);
}
