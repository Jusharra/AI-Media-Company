// ============================================================
// SIGNAL Media Engine — Shared Type Definitions
// ============================================================

export type AgentName =
  | 'signal-scout'
  | 'interview-engine'
  | 'backgrounder'
  | 'journalist'
  | 'media-producer'
  | 'validator'
  | 'distributor'
  | 'lead'
  | 'complete';

export type MessageType =
  | 'handoff'
  | 'validation_request'
  | 'validation_pass'
  | 'revision_required'
  | 'approved'
  | 'gate_pending'
  | 'gate_approved'
  | 'gate_rejected'
  | 'distribution_complete';

export type Industry = 'healthcare' | 'oil_gas' | 'construction' | 'other';
export type EntitySource = 'manual' | 'api' | 'voice' | 'agent';
export type EntityStatus = 'pending' | 'approved' | 'rejected' | 'featured' | 'archived';

export type TaskStatus =
  | 'pending'
  | 'in_progress'
  | 'awaiting_validation'
  | 'revision'
  | 'awaiting_approval'
  | 'approved'
  | 'complete'
  | 'failed';

export type DocType =
  | 'backgrounder'
  | 'feature_article'
  | 'spotlight'
  | 'thought_leadership'
  | 'podcast_script'
  | 'youtube_script'
  | 'linkedin_post'
  | 'twitter_thread'
  | 'social_package';

export type ConfidenceTier = 'high' | 'medium' | 'low';
export type OutputStatus = 'draft' | 'revision' | 'approved' | 'published';
export type GateNumber = 1 | 2 | 3 | 4;
export type GateDecision = 'approved' | 'rejected' | 'revision';
export type Platform = 'website' | 'linkedin' | 'twitter' | 'youtube' | 'instagram';
export type AdminRole = 'owner' | 'editor' | 'viewer';

export interface AgentMessage {
  id: string;
  taskId: string;
  from: AgentName;
  to: AgentName;
  type: MessageType;
  payload: {
    entity_id?: string;
    backgrounder_id?: string;
    content_ids?: string[];
    validation_scores?: Record<string, number>;
    gaps?: string[];
    revision_notes?: string[];
    citations?: string[];
    summary?: string;
    gate?: GateNumber;
    monetization_flag?: boolean;
    distribution_urls?: Record<string, string>;
    transcript_id?: string;
    key_quotes?: string[];
    insight_tags?: string[];
    industry_tag?: Industry;
    source_notes?: string;
    hook?: string;
    article_ids?: string[];
    media_package_id?: string;
  };
  timestamp: string;
}

export interface Entity {
  id: string;
  name: string;
  company: string | null;
  industry: Industry;
  source: EntitySource;
  status: EntityStatus;
  score: number;
  monetization_flag: number;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  entity_id: string | null;
  parent_task_id: string | null;
  agent: AgentName;
  status: TaskStatus;
  created_at: string;
  updated_at: string;
}

export interface Output {
  id: string;
  task_id: string;
  entity_id: string;
  doc_type: DocType;
  content: string;
  validation_score: number | null;
  confidence_tier: ConfidenceTier | null;
  version: number;
  status: OutputStatus;
  created_at: string;
}

export interface GateDecisionRecord {
  id: string;
  task_id: string;
  gate_number: GateNumber;
  decision: GateDecision;
  notes: string | null;
  decided_by: 'human' | 'auto';
  created_at: string;
}

export interface DistributionLog {
  id: string;
  task_id: string;
  content_id: string;
  platform: Platform;
  post_url: string | null;
  status: 'pending' | 'published' | 'failed';
  performance_metrics: string | null;
  published_at: string | null;
  created_at: string;
}

export interface AdminUser {
  id: string;
  username: string;
  password_hash: string;
  role: AdminRole;
  last_login: string | null;
  created_at: string;
}

export interface Session {
  id: string;
  user_id: string;
  token: string;
  expires_at: string;
  created_at: string;
}

// Pipeline state tracking
export interface PipelineState {
  taskId: string;
  entityId: string;
  entityName: string;
  currentStage: AgentName;
  gateStatus: Record<GateNumber, GateDecision | 'pending' | null>;
  validationScores: Record<string, number>;
  contentIds: string[];
  distributionUrls: Record<string, string>;
  monetizationFlag: boolean;
  createdAt: string;
  updatedAt: string;
}

// API request/response types
export interface IntakeRequest {
  name: string;
  company: string;
  industry: Industry;
  source: EntitySource;
  notes?: string;
  hook?: string;
  email?: string;
  website?: string;
  linkedinUrl?: string;
}

export interface ApproveRequest {
  taskId: string;
  gate: GateNumber;
  decision: GateDecision;
  notes?: string;
}

export interface PipelineStatusResponse {
  activePipelines: number;
  pendingGates: Array<{ taskId: string; gate: GateNumber; entityName: string }>;
  highConfidenceItems: number;
  recentlyPublished: number;
}
