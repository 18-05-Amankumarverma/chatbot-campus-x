const { databaseSchema } = require('../schemas/database.schema');

function formatSchema(tableNames) {
  const requested = tableNames?.length ? tableNames : Object.keys(databaseSchema);

  return requested
    .filter((name) => databaseSchema[name])
    .map((name) => {
      const table = databaseSchema[name];
      const columns = Object.entries(table.columns)
        .map(([column, description]) => `${column} (${description})`)
        .join(', ');
      const foreignKeys = Object.entries(table.foreignKeys || {})
        .map(([column, reference]) => `${column} -> ${reference}`)
        .join(', ');

      return `${name}: ${table.description} Columns: ${columns}. PK: ${table.primaryKey}.${foreignKeys ? ` FKs: ${foreignKeys}.` : ''}`;
    })
    .join('\n');
}

function tableNamesFromSql(sql) {
  return Object.keys(databaseSchema).filter((table) =>
    new RegExp(`\\b${table}\\b`, 'i').test(sql),
  );
}

module.exports = { formatSchema, tableNamesFromSql, databaseSchema };
