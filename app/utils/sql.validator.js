const DEFAULT_LIMIT = Number(process.env.QUERY_ROW_LIMIT || 100);
const forbidden = new Set(['insert', 'update', 'delete', 'drop', 'alter', 'truncate', 'create', 'grant', 'revoke', 'comment', 'copy', 'vacuum', 'analyze', 'call', 'do', 'merge', 'lock', 'set', 'reset', 'listen', 'notify', 'unlisten']);

function validationError(message) {
  const error = new Error(message);
  error.statusCode = 400;
  error.code = 'INVALID_SQL';
  return error;
}

function stripCommentsAndStrings(sql) {
  let out = '', i = 0, mode = 'normal';
  while (i < sql.length) {
    const pair = sql.slice(i, i + 2), char = sql[i];
    if (mode === 'normal' && pair === '--') { mode = 'line'; out += '  '; i += 2; continue; }
    if (mode === 'normal' && pair === '/*') { mode = 'block'; out += '  '; i += 2; continue; }
    if (mode === 'line' && char === '\n') { mode = 'normal'; out += char; i++; continue; }
    if (mode === 'block' && pair === '*/') { mode = 'normal'; out += '  '; i += 2; continue; }
    if (mode === 'normal' && char === "'") { mode = 'single'; out += ' '; i++; continue; }
    if (mode === 'single' && char === "'" && sql[i + 1] === "'") { out += '  '; i += 2; continue; }
    if (mode === 'single' && char === "'") { mode = 'normal'; out += ' '; i++; continue; }
    if (mode === 'normal' && char === '"') { mode = 'double'; out += ' '; i++; continue; }
    if (mode === 'double' && char === '"') { mode = 'normal'; out += ' '; i++; continue; }
    out += mode === 'normal' ? char : ' '; i++;
  }
  if (mode === 'block' || mode === 'single' || mode === 'double') throw validationError('SQL contains an unclosed comment or quoted value.');
  return out;
}

function validateSql(sql, rowLimit = DEFAULT_LIMIT) {
  if (typeof sql !== 'string' || !sql.trim()) throw validationError('SQL must be a non-empty string.');
  const clean = stripCommentsAndStrings(sql).trim();
  const statements = clean.split(';').filter(Boolean);
  if (statements.length !== 1) throw validationError('Only one SQL statement is allowed.');
  const tokens = statements[0].toLowerCase().match(/[a-z_][a-z0-9_$]*/g) || [];
  if (!['select', 'with'].includes(tokens[0])) throw validationError('Only SELECT queries and read-only WITH queries are allowed.');
  const blocked = tokens.find((token) => forbidden.has(token));
  if (blocked) throw validationError(`The SQL keyword "${blocked.toUpperCase()}" is not allowed.`);
  if (/\b(pg_catalog|information_schema|pg_toast)\b/i.test(clean)) throw validationError('PostgreSQL system schemas are not accessible.');
  if (/\bselect\b[\s\S]*\binto\b/i.test(clean)) throw validationError('SELECT INTO is not allowed.');
  const normalized = sql.trim().replace(/;+\s*$/, '');
  return /\blimit\s+\d+\b/i.test(clean) ? normalized : `${normalized} LIMIT ${Math.max(1, Math.min(Number(rowLimit) || DEFAULT_LIMIT, DEFAULT_LIMIT))}`;
}

module.exports = { validateSql };
