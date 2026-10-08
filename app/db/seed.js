require('dotenv').config();

const { PrismaClient, Prisma } = require('@prisma/client');
const { ensureDatabaseUrl } = require('../config/databases');

// Stable IDs and unique values make this seed safe to run repeatedly. The
// generated accounts use a placeholder password and must not be used in prod.
const RECORDS_PER_MODEL = 10;
const prisma = new PrismaClient();
const models = Prisma.dmmf.datamodel.models;
const enums = Object.fromEntries(Prisma.dmmf.datamodel.enums.map((item) => [item.name, item.values.map((value) => value.name)]));
const modelByName = new Map(models.map((model) => [model.name, model]));
const ids = new Map(models.map((model) => [model.name, Array.from({ length: RECORDS_PER_MODEL }, (_, index) => `${model.name.toLowerCase()}_seed_${String(index + 1).padStart(2, '0')}`)]));

function insertionOrder() {
  const pending = new Set(models.map((model) => model.name));
  const complete = new Set();
  const ordered = [];
  while (pending.size) {
    const ready = [...pending].filter((name) => {
      const model = modelByName.get(name);
      return model.fields.filter((field) => field.kind === 'object' && field.isRequired && field.relationFromFields.length > 0)
        .every((field) => field.type === name || complete.has(field.type));
    });
    if (!ready.length) throw new Error(`Required relation cycle in Prisma models: ${[...pending].join(', ')}`);
    for (const name of ready) {
      pending.delete(name);
      complete.add(name);
      ordered.push(modelByName.get(name));
    }
  }
  return ordered;
}

function scalarValue(field, model, rowIndex) {
  const uniqueSuffix = `${model.name.toLowerCase()}_${String(rowIndex + 1).padStart(2, '0')}`;
  if (field.kind === 'enum') return enums[field.type][0];
  switch (field.type) {
    case 'String':
      if (/email/i.test(field.name)) return `${uniqueSuffix}@seed.smartcampus.edu`;
      if (/url|website/i.test(field.name)) return `https://example.com/${uniqueSuffix}`;
      if (/passwordhash/i.test(field.name)) return 'SEED_ONLY_CHANGE_BEFORE_USE';
      if (/date|time/i.test(field.name)) return 'Seed sample';
      return `${field.name} ${rowIndex + 1} (${model.name})`;
    case 'Int': return /year|semester|duration|capacity|copies|hours|minutes|count|floor|order|attempt|number|age|experience/i.test(field.name) ? (field.name.toLowerCase().includes('year') ? 2025 : rowIndex + 1) : rowIndex + 1;
    case 'Float': return rowIndex + 1;
    case 'Boolean': return false;
    case 'DateTime': return new Date(Date.UTC(2025, 0, 1 + rowIndex));
    case 'Json': return Prisma.JsonNull;
    case 'BigInt': return BigInt(rowIndex + 1);
    case 'Decimal': return rowIndex + 1;
    case 'Bytes': return Buffer.from(`seed-${uniqueSuffix}`);
    default: return undefined;
  }
}

function buildRecord(model, rowIndex) {
  const data = {};
  const relationsByScalarField = new Map();
  for (const relation of model.fields.filter((field) => field.kind === 'object')) {
    relation.relationFromFields.forEach((scalarField, position) => {
      relationsByScalarField.set(scalarField, { relation, targetField: relation.relationToFields[position] });
    });
  }

  for (const field of model.fields) {
    if (field.kind !== 'scalar' && field.kind !== 'enum') continue;
    if (field.isId) {
      data[field.name] = ids.get(model.name)[rowIndex];
      continue;
    }
    const relationRef = relationsByScalarField.get(field.name);
    if (relationRef) {
      if (!field.isRequired && relationRef.relation.isRequired === false) {
        data[field.name] = null;
      } else {
        const targetIds = ids.get(relationRef.relation.type);
        data[field.name] = targetIds[rowIndex % targetIds.length];
      }
      continue;
    }
    if (!field.isRequired || field.hasDefaultValue || field.isUpdatedAt) continue;
    data[field.name] = scalarValue(field, model, rowIndex);
  }
  return data;
}

async function seed() {
  ensureDatabaseUrl();
  let count = 0;
  for (const model of insertionOrder()) {
    const delegate = prisma[model.name[0].toLowerCase() + model.name.slice(1)];
    for (let index = 0; index < RECORDS_PER_MODEL; index += 1) {
      const data = buildRecord(model, index);
      await delegate.upsert({
        where: { [model.fields.find((field) => field.isId).name]: data[model.fields.find((field) => field.isId).name] },
        create: data,
        update: {},
      });
      count += 1;
    }
  }
  console.info(`Smart Campus seed complete: ${count} records across ${models.length} tables (up to ${RECORDS_PER_MODEL} per table).`);
}

seed()
  .catch((error) => {
    console.error('Seed failed:', error.message || 'Unable to connect to the database.');
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
