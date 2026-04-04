import { NextResponse } from 'next/server';
import { startPipeline, processGateDecision, getPipelineStatus, getDealQueue } from '@signal/agents/lead';
import { getDb } from '@signal/lib/db';

// VAPI/Retell AI voice webhook — handles function calls from the voice assistant
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // VAPI sends: { message: { type: 'function-call', functionCall: { name, parameters } } }
    const functionCall = body?.message?.functionCall || body?.functionCall;

    if (!functionCall) {
      return NextResponse.json({ result: 'No function call received' });
    }

    const { name, parameters } = functionCall;
    let result: string;

    switch (name) {
      case 'intake_founder': {
        const { founderName, company, industry, website, notes } = parameters;
        const taskId = await startPipeline({
          name: founderName,
          company,
          industry: industry || 'other',
          website,
          linkedinUrl: parameters.linkedinUrl,
          source: 'voice',
          notes,
        });
        result = `Pipeline started for ${founderName} from ${company}. Task ID is ${taskId.slice(0, 8)}. Signal Scout is now researching this founder.`;
        break;
      }

      case 'check_pipeline_status': {
        const status = getPipelineStatus();
        result = `Currently ${status.activePipelines} active pipelines. ${status.pendingGates.length} gates awaiting your decision. ${status.recentlyPublished} founders published in the last 7 days.`;

        if (status.pendingGates.length > 0) {
          const gateList = status.pendingGates.map(g => `${g.entityName} at Gate ${g.gate}`).join(', ');
          result += ` Pending gates: ${gateList}.`;
        }
        break;
      }

      case 'approve_gate': {
        const { taskId, gateNumber, decision, notes } = parameters;
        const gate = parseInt(gateNumber) as 1 | 2 | 3 | 4;
        await processGateDecision(taskId, gate, decision || 'approved', notes);
        const decisionLabel = decision === 'rejected' ? 'rejected' : decision === 'revision' ? 'sent back for revision' : 'approved';
        result = `Gate ${gateNumber} has been ${decisionLabel} for task ${taskId.slice(0, 8)}.`;
        break;
      }

      case 'get_pending_gates': {
        const status = getPipelineStatus();
        if (status.pendingGates.length === 0) {
          result = 'No gates are currently pending your decision.';
        } else {
          const list = status.pendingGates.map(g => `${g.entityName} needs Gate ${g.gate} approval`).join('. ');
          result = `You have ${status.pendingGates.length} pending gate decisions: ${list}.`;
        }
        break;
      }

      case 'get_distribution_status': {
        const db = getDb('distributor');
        const recent = db.prepare(`
          SELECT * FROM distribution_logs ORDER BY created_at DESC LIMIT 5
        `).all() as Array<{ entity_id: string; platform: string; status: string }>;

        if (recent.length === 0) {
          result = 'No recent distribution activity.';
        } else {
          const summary = recent.map(r => `${r.entity_id.slice(0, 6)} to ${r.platform}: ${r.status}`).join(', ');
          result = `Recent distributions: ${summary}.`;
        }
        break;
      }

      case 'flag_monetization': {
        const { entityId } = parameters;
        const scoutDb = getDb('signal-scout');
        scoutDb.prepare('UPDATE entities SET monetization_flag = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(entityId);
        result = `Entity ${entityId.slice(0, 8)} has been flagged for monetization outreach.`;
        break;
      }

      case 'get_deal_queue': {
        const deals = getDealQueue() as Array<{ name: string; score: number; current_stage: string }>;
        if (deals.length === 0) {
          result = 'No deals currently in the monetization queue.';
        } else {
          const list = deals.slice(0, 5).map(d => `${d.name} (score: ${d.score})`).join(', ');
          result = `${deals.length} deals in queue. Top prospects: ${list}.`;
        }
        break;
      }

      default:
        result = `Unknown function: ${name}. Available functions are: intake_founder, check_pipeline_status, approve_gate, get_pending_gates, get_distribution_status, flag_monetization, get_deal_queue.`;
    }

    // VAPI expects: { result: string }
    return NextResponse.json({ result });
  } catch (err) {
    console.error('VAPI webhook error:', err);
    return NextResponse.json({ result: 'An error occurred processing your request. Please try again.' });
  }
}
