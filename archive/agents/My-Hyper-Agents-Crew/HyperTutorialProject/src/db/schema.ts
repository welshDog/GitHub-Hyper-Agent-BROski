
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const agents = sqliteTable('agents', {
  id: integer('id').primaryKey(),
  name: text('name').notNull(),
  type: text('type').notNull(),
  version: text('version').notNull(),
  status: text('status').notNull(),
});

export const workflows = sqliteTable('workflows', {
  id: integer('id').primaryKey(),
  userRequest: text('user_request').notNull(),
  status: text('status').notNull(), // 'pending', 'completed', 'failed'
  createdAt: text('created_at').default(new Date().toISOString()),
});

export const tasks = sqliteTable('tasks', {
  id: integer('id').primaryKey(),
  workflowId: integer('workflow_id').references(() => workflows.id),
  agentType: text('agent_type').notNull(),
  name: text('name').notNull(),
  input: text('input'),
  output: text('output'),
  status: text('status').notNull(),
});
