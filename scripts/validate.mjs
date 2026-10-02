import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, resolve, dirname, relative, isAbsolute } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const release = process.argv.includes('--release');
const skills = ['paper-tutor', 'knowledge-tutor'];
const errors = [];
const fail = (message) => errors.push(message);
const readUtf8 = (path) => new TextDecoder('utf-8', { fatal: true }).decode(readFileSync(path));

function checkLocalLinks(text, base, label) {
  const links = text.matchAll(/\]\(([^)]+)\)/g);
  for (const match of links) {
    const target = match[1].split('#')[0];
    if (!target || /^(?:https?:|mailto:)/i.test(target)) continue;
    if (isAbsolute(target) || /^[A-Za-z]:[\\/]/.test(target)) {
      fail(`${label}: absolute local link ${target}`);
      continue;
    }
    if (!existsSync(resolve(base, decodeURIComponent(target)))) {
      fail(`${label}: broken local link ${target}`);
    }
  }
}

for (const name of skills) {
  const directory = join(root, 'skills', name);
  const path = join(directory, 'SKILL.md');
  if (!existsSync(path)) {
    fail(`${name}: missing SKILL.md`);
    continue;
  }
  const contents = readdirSync(directory);
  if (contents.some((entry) => /^SKILL_v|_SKILL_/i.test(entry))) {
    fail(`${name}: versioned entrypoint found beside SKILL.md`);
  }
  const text = readUtf8(path).replace(/\r\n/g, '\n');
  const frontmatter = text.match(/^---\n([\s\S]*?)\n---\n/);
  if (!frontmatter) {
    fail(`${name}: missing YAML frontmatter delimiters`);
    continue;
  }
  const values = Object.fromEntries(
    frontmatter[1].split('\n')
      .filter((line) => /^[a-z][a-z-]*:\s*/.test(line))
      .map((line) => {
        const i = line.indexOf(':');
        return [line.slice(0, i), line.slice(i + 1).trim()];
      }),
  );
  if (values.name !== name || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(values.name ?? '')) {
    fail(`${name}: invalid or mismatched name`);
  }
  if (!values.description || values.description.length > 1024) {
    fail(`${name}: description must contain 1-1024 characters`);
  }
  if (values.license !== 'MIT') {
    fail(`${name}: license metadata must match MIT release choice`);
  }
  if (text.split('\n').length > 500) {
    fail(`${name}: entrypoint exceeds 500 lines; consider on-demand references`);
  }
  checkLocalLinks(text, directory, name);
}

const evalPath = join(root, 'evals', 'cases.json');
if (!existsSync(evalPath)) {
  fail('evals/cases.json: missing');
} else {
  try {
    const cases = JSON.parse(readUtf8(evalPath));
    if (!Array.isArray(cases) || cases.length < 8) fail('evals/cases.json: expected at least 8 cases');
    const ids = new Set();
    for (const item of cases) {
      if (typeof item.id !== 'string' || ids.has(item.id)) fail(`eval case: missing or duplicate id ${item.id}`);
      ids.add(item.id);
      if (![...skills, 'none'].includes(item.skill)) fail(`${item.id}: invalid skill`);
      if (!['trigger', 'behavior'].includes(item.kind)) fail(`${item.id}: invalid kind`);
      if (typeof item.prompt !== 'string' || !item.prompt.trim()) fail(`${item.id}: empty prompt`);
      if (!Array.isArray(item.expected) || !item.expected.length || item.expected.some((v) => typeof v !== 'string' || !v.trim())) {
        fail(`${item.id}: expected must be a nonempty string array`);
      }
      if (item.fixture) {
        const fixture = resolve(root, item.fixture);
        if (relative(root, fixture).startsWith('..') || !existsSync(fixture)) {
          fail(`${item.id}: fixture missing or outside repository`);
        }
      }
    }
  } catch (error) {
    fail(`evals/cases.json: ${error.message}`);
  }
}

for (const file of ['README.md', 'CONTRIBUTING.md', 'evals/README.md']) {
  const path = join(root, file);
  if (!existsSync(path)) fail(`${file}: missing`);
  else checkLocalLinks(readUtf8(path), dirname(path), file);
}

const license = join(root, 'LICENSE');
if (release) {
  if (!existsSync(license)) fail('LICENSE: missing; author copyright name is required before publication');
  else {
    const text = readUtf8(license);
    if (!text.startsWith('MIT License\n')) fail('LICENSE: not an MIT license file');
    if (/\{\{COPYRIGHT_HOLDER\}\}|待提供|PLACEHOLDER/i.test(text)) fail('LICENSE: unresolved copyright holder');
  }
}

if (errors.length) {
  for (const error of errors) process.stderr.write(`FAIL ${error}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write(`PASS: ${skills.length} skills, evaluation cases, links, and ${release ? 'release' : 'draft'} structure validated.\n`);
}
