import { v4 as uuidv4 } from 'uuid';
import { getDb } from './db';
import type { AgentMessage, AgentName, MessageType } from './types';

/**
 * MessageTool — Inter-agent communication bus via SQLite
 *
 * Each agent has its own messages_in and messages_out tables.
 * Sending a message writes to the recipient's messages_in table
 * AND to the sender's messages_out table for audit logging.
 */

export function sendMessage(message: Omit<AgentMessage, 'id' | 'timestamp'>): AgentMessage {
  const fullMessage: AgentMessage = {
    ...message,
    id: uuidv4(),
    timestamp: new Date().toISOString(),
  };

  const recipientDb = getDb(message.to);
  const senderDb = getDb(message.from);

  // Always include taskId in serialized payload so messages can be filtered by task
  const payload = JSON.stringify({ taskId: message.taskId, ...message.payload });

  // Write to recipient's inbox
  recipientDb.prepare(`
    INSERT INTO messages_in (id, from_agent, message_type, payload, processed, created_at)
    VALUES (?, ?, ?, ?, 0, ?)
  `).run(fullMessage.id, message.from, message.type, payload, fullMessage.timestamp);

  // Write to sender's outbox for audit
  senderDb.prepare(`
    INSERT INTO messages_out (id, to_agent, message_type, payload, created_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(fullMessage.id, message.to, message.type, payload, fullMessage.timestamp);

  console.log(`[MessageTool] ${message.from} → ${message.to} [${message.type}] task:${message.taskId}`);

  return fullMessage;
}

export function getUnprocessedMessages(agentName: AgentName): AgentMessage[] {
  const db = getDb(agentName);

  const rows = db.prepare(`
    SELECT id, from_agent, message_type, payload, created_at
    FROM messages_in
    WHERE processed = 0
    ORDER BY created_at ASC
  `).all() as Array<{
    id: string;
    from_agent: string;
    message_type: string;
    payload: string;
    created_at: string;
  }>;

  return rows.map(row => {
    const payload = JSON.parse(row.payload);
    return {
      id: row.id,
      taskId: payload.taskId || '',
      from: row.from_agent as AgentName,
      to: agentName,
      type: row.message_type as MessageType,
      payload,
      timestamp: row.created_at,
    };
  });
}

export function markMessageProcessed(agentName: AgentName, messageId: string): void {
  const db = getDb(agentName);
  db.prepare('UPDATE messages_in SET processed = 1 WHERE id = ?').run(messageId);
}

export function getMessageHistory(agentName: AgentName, taskId?: string): AgentMessage[] {
  const db = getDb(agentName);

  const query = taskId
    ? `SELECT id, from_agent, message_type, payload, created_at FROM messages_in WHERE JSON_EXTRACT(payload, '$.taskId') = ? ORDER BY created_at ASC`
    : `SELECT id, from_agent, message_type, payload, created_at FROM messages_in ORDER BY created_at DESC LIMIT 100`;

  const rows = (taskId ? db.prepare(query).all(taskId) : db.prepare(query).all()) as Array<{
    id: string;
    from_agent: string;
    message_type: string;
    payload: string;
    created_at: string;
  }>;

  return rows.map(row => {
    const payload = JSON.parse(row.payload);
    return {
      id: row.id,
      taskId: payload.taskId || '',
      from: row.from_agent as AgentName,
      to: agentName,
      type: row.message_type as MessageType,
      payload,
      timestamp: row.created_at,
    };
  });
}

// Get all messages across all agents for a specific task (for admin dashboard)
export function getTaskMessageTrace(taskId: string): AgentMessage[] {
  const agents: AgentName[] = [
    'signal-scout', 'interview-engine', 'backgrounder',
    'journalist', 'media-producer', 'validator', 'distributor', 'lead'
  ];

  const allMessages: AgentMessage[] = [];

  for (const agent of agents) {
    const messages = getMessageHistory(agent, taskId);
    allMessages.push(...messages);
  }

  return allMessages.sort((a, b) =>
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );
}
