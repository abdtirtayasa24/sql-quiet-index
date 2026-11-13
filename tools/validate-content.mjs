import { readFile, readdir, realpath, stat } from 'node:fs/promises';
import { resolve, relative, isAbsolute } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { validateContent } from '../src/content/validate-content.ts';

const projectRoot = fileURLToPath(new URL('../', import.meta.url));
const record = (value) =>
  value !== null && typeof value === 'object' && !Array.isArray(value);
const parse = (source, text) => {
  try {
    return JSON.parse(text, (key, value) => {
      if (['__proto__', 'prototype', 'constructor'].includes(key))
        throw new Error('Forbidden object key');
      return value;
    });
  } catch (error) {
    throw new Error(
      `${source}/: Invalid JSON (${error instanceof Error ? error.message : 'parse failure'})`,
      { cause: error },
    );
  }
};

export async function validateRepository(args, mode = 'content') {
  let root = resolve(projectRoot, 'content');
  let mission;
  const seen = new Set();
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (!['--root', '--mission'].includes(arg) || seen.has(arg))
      throw new Error(`Unknown/duplicate option ${arg}`);
    seen.add(arg);
    const value = args[++i];
    if (!value || value.startsWith('--'))
      throw new Error(`Missing value for ${arg}`);
    if (arg === '--root') root = resolve(value);
    else {
      if (!/^(00[1-9]|0[1-7][0-9]|080)$/.test(value))
        throw new Error('Invalid mission selector');
      mission = value;
    }
  }
  root = await realpath(root);
  let reads = 0;
  const inside = async (path) => {
    if (
      !/^[a-zA-Z0-9_./-]+$/.test(path) ||
      path.split('/').some((p) => !p || p === '.' || p === '..') ||
      isAbsolute(path)
    )
      throw new Error(`${path}/: Unsafe content path`);
    const full = await realpath(resolve(root, path));
    const rel = relative(root, full);
    if (rel.startsWith('..') || isAbsolute(rel))
      throw new Error(`${path}/: Symlink/path escapes outside content root`);
    return full;
  };
  const text = async (path) => {
    if (++reads > 1000) throw new Error('Content file count limit');
    try {
      const full = await inside(path);
      if ((await stat(full)).size > 2 * 1024 * 1024)
        throw new Error('Source exceeds 2 MiB');
      return await readFile(full, 'utf8');
    } catch (error) {
      throw new Error(
        `${path}/: ${error instanceof Error ? error.message : 'Cannot read source'}`,
        { cause: error },
      );
    }
  };
  const json = async (path) => parse(path, await text(path));
  const pack = {
    season: await json('season.json'),
    registry: await json('registry.json'),
    concepts: await json('concepts.json'),
    locales: {},
    manifests: {},
    files: {},
    graphs: {},
  };
  const localeDir = await inside('locales');
  const localeFiles = await readdir(localeDir);
  if (localeFiles.length > 20) throw new Error('Locale count limit');
  for (const file of localeFiles) {
    if (!/^[a-z]{2,3}\.json$/.test(file))
      throw new Error(`locales/${file}/: Invalid locale path`);
    pack.locales[file.slice(0, -5)] = await json(`locales/${file}`);
  }
  if (
    !record(pack.registry) ||
    !Array.isArray(pack.registry.missions) ||
    !Array.isArray(pack.registry.graphs) ||
    pack.registry.missions.length > 80 ||
    pack.registry.graphs.length > 10
  )
    throw new Error('registry.json/: Invalid bounded registry');
  for (const entry of pack.registry.missions) {
    if (
      !record(entry) ||
      typeof entry.id !== 'string' ||
      entry.manifest !== `missions/${entry.id}/mission.json` ||
      !/^(00[1-9]|0[1-7][0-9]|080)$/.test(entry.id)
    )
      throw new Error('registry.json/missions: Invalid manifest path/ID');
    pack.manifests[entry.manifest] = await json(entry.manifest);
    const directory = `missions/${entry.id}`;
    const files = await readdir(await inside(directory));
    if (files.length > 30)
      throw new Error(`${directory}/: Source file count limit`);
    for (const file of files) {
      if (file === 'mission.json') continue;
      if (
        !/^(reference|variants|seed|wrong_[a-z][a-z0-9_]{0,39})\.sql$/.test(
          file,
        )
      )
        throw new Error(`${directory}/${file}/: Unexpected source path`);
      pack.files[`${directory}/${file}`] = await text(`${directory}/${file}`);
    }
  }
  for (const entry of pack.registry.graphs) {
    if (
      !record(entry) ||
      typeof entry.actId !== 'string' ||
      !/^act(0[1-9]|10)$/.test(entry.actId) ||
      entry.path !== `graph/${entry.actId}.json`
    )
      throw new Error('registry.json/graphs: Invalid graph path/act');
    pack.graphs[entry.path] = await json(entry.path);
  }
  const schema = parse(
    'schemas/mission.schema.json',
    await readFile(resolve(projectRoot, 'schemas/mission.schema.json'), 'utf8'),
  );
  const graphSchema = parse(
    'schemas/graph.schema.json',
    await readFile(resolve(projectRoot, 'schemas/graph.schema.json'), 'utf8'),
  );
  const issues = validateContent(pack, schema, graphSchema);
  if (issues.length)
    throw new Error(
      issues.map((e) => `${e.source}${e.pointer}: ${e.message}`).join('\n'),
    );
  if (mission && !pack.registry.missions.some((m) => m.id === mission))
    throw new Error(
      `Mission ${mission}: zero playable matches (outline is not publication)`,
    );
  if (mode === 'graphs')
    console.log(
      `Validated ${pack.registry.graphs.length} authored case graphs (zero means none published, not a gameplay proof).`,
    );
  else
    console.log(
      `Validated 80 outline missions; ${pack.registry.missions.length} playable source contracts; ${pack.registry.graphs.length} authored graphs${mission ? `; selected ${mission}` : ''}. SQL solution execution remains a separate gate.`,
    );
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  try {
    await validateRepository(process.argv.slice(2));
  } catch (error) {
    console.error(
      error instanceof Error ? error.message : 'Content validation failed',
    );
    process.exitCode = 1;
  }
}
