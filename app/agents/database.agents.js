const { z } = require('zod');
const { HumanMessage, SystemMessage } = require('@langchain/core/messages');
const { getLlm } = require('../config/llm');
const { DATABASE_SYSTEM_PROMPT } = require('./prompts');
const { formatSchema, tableNamesFromSql } = require('../services/schema.service');
const { executeReadOnlyQuery } = require('../services/query.service');

const planSchema = z.object({
  needsClarification: z.boolean(),
  clarification: z.string().nullable().optional(),
  sql: z.string().nullable().optional(),
});
const answerSchema = z.object({ answer: z.string().min(1) });

function extractJson(content, schema) {
  const text = typeof content === 'string'
    ? content
    : content.map((part) => (typeof part === 'string' ? part : part.text || '')).join('');
  const objectText = text.trim().replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/, '');

  try {
    return schema.parse(JSON.parse(objectText));
  } catch (cause) {
    const error = new Error('The model returned malformed structured output. Please try the request again.');
    error.code = 'MALFORMED_AGENT_OUTPUT';
    error.statusCode = 502;
    error.cause = cause;
    throw error;
  }
}

async function invokeJson(llm, schema, messages) {
  // Some ChatGroq releases do not implement Runnable.bind(). The prompt itself
  // requires a JSON object and the response is validated locally below.
  const response = await llm.invoke(messages);
  return extractJson(response.content, schema);
}

async function askDatabase(question) {
  const llm = getLlm();
  const schema = formatSchema();
  const plan = await invokeJson(llm, planSchema, [
    new SystemMessage(`${DATABASE_SYSTEM_PROMPT}\n\nDATABASE SCHEMA:\n${schema}\n\nRespond with exactly one JSON object, without markdown: {"needsClarification": boolean, "clarification": string or null, "sql": string or null}. Create SQL only when the question is answerable.`),
    new HumanMessage(question),
  ]);

  if (plan.needsClarification || !plan.sql) {
    return {
      answer: plan.clarification || 'I need a little more detail to answer that question.',
      data: [],
      tablesUsed: [],
    };
  }

  const result = await executeReadOnlyQuery(plan.sql);
  if (!result.rowCount) {
    return { answer: 'No matching records were found.', data: [], tablesUsed: tableNamesFromSql(result.sql) };
  }

  const response = await invokeJson(llm, answerSchema, [
    new SystemMessage(`${DATABASE_SYSTEM_PROMPT}\nAnswer the user from these query results only. Mention useful counts or aggregates clearly. Do not mention SQL or internal process. Respond with exactly one JSON object: {"answer":"concise answer"}.`),
    new HumanMessage(`Question: ${question}\nResults: ${JSON.stringify(result.rows)}`),
  ]);

  return { answer: response.answer, data: result.rows, tablesUsed: tableNamesFromSql(result.sql) };
}

module.exports = { askDatabase };
