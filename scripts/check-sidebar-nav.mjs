#!/usr/bin/env node
/**
 * Guards the sidebar against the "clicking a link throws me into another section"
 * bug class.
 *
 * The rail's active section is kept when the current section owns the destination
 * (SECTION_PATHS in IconRail.jsx). That map is maintained by hand, so adding a link
 * to a sidebar view without updating it silently reintroduces the jump — which is
 * exactly how the Dashboard "My Projects" link regressed.
 *
 * This script reads both files, resolves every sidebar link the way the app does,
 * and fails if any link would move the rail out of its own section.
 *
 * Run: npm run check:nav
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const railSrc = readFileSync(join(root, 'src/components/layout/IconRail.jsx'), 'utf8');
const panelSrc = readFileSync(join(root, 'src/components/layout/SidebarPanel.jsx'), 'utf8');

function extract(source, pattern, label) {
  const match = source.match(pattern);
  if (!match) {
    console.error(`✗ could not find ${label} in IconRail.jsx — update this script.`);
    process.exit(1);
  }
  return match[0].replace(/^export /, '');
}

const evaluated = new Function(`
  ${extract(railSrc, /export function getSectionFromPath[\s\S]*?\n}/, 'getSectionFromPath')}
  ${extract(railSrc, /const SECTION_PATHS = \{[\s\S]*?\n\};/, 'SECTION_PATHS')}
  ${extract(railSrc, /export function sectionOwnsPath[\s\S]*?\n}/, 'sectionOwnsPath')}
  ${extract(railSrc, /export function getSectionDefaultPath[\s\S]*?\n}/, 'getSectionDefaultPath')}
  return { getSectionFromPath, sectionOwnsPath, getSectionDefaultPath, SECTION_PATHS };
`)();

const { getSectionFromPath, sectionOwnsPath, getSectionDefaultPath } = evaluated;

/** Sidebar view function name → the rail section that renders it. */
const VIEW_SECTIONS = [
  ['HomeView', 'home'],
  ['AIView', 'ai'],
  ['TeamsView', 'teams'],
  ['DashboardView', 'dashboard'],
  ['PlannerView', 'planner'],
  ['MoreView', 'more'],
];

const lines = panelSrc.split('\n');
const views = VIEW_SECTIONS.map(([name, section]) => ({
  name,
  section,
  start: lines.findIndex((l) => l.startsWith(`function ${name}`)),
})).filter((v) => v.start !== -1);

views.sort((a, b) => a.start - b.start);

const failures = [];
let checked = 0;

views.forEach((view, i) => {
  const end = i + 1 < views.length ? views[i + 1].start : lines.length;
  const body = lines.slice(view.start, end).join('\n');

  const literal = [...body.matchAll(/to="([^"]+)"/g)].map((m) => m[1]);
  // `/teams/${team._id}` → /teams/:id — only the static prefix matters for routing.
  const dynamic = [...body.matchAll(/to=\{`([^`]+)`\}/g)].map((m) =>
    m[1].replace(/\$\{[^}]*\}/g, 'id')
  );

  for (const raw of [...new Set([...literal, ...dynamic])]) {
    const pathname = raw.split('?')[0];
    checked += 1;
    const destination = sectionOwnsPath(view.section, pathname)
      ? view.section
      : getSectionFromPath(pathname);

    if (destination !== view.section) {
      failures.push({ view: view.name, section: view.section, raw, destination });
    }
  }
});

// A rail icon must always land on its own section, or the rail fights itself.
for (const [, section] of VIEW_SECTIONS) {
  const target = getSectionDefaultPath(section);
  const landed = sectionOwnsPath(section, target) ? section : getSectionFromPath(target);
  checked += 1;
  if (landed !== section) {
    failures.push({
      view: `rail:${section}`,
      section,
      raw: target,
      destination: landed,
    });
  }
}

if (failures.length) {
  console.error(`\n✗ ${failures.length} sidebar link(s) leave their own section:\n`);
  for (const f of failures) {
    console.error(`  ${f.view} (${f.section})  ${f.raw}  →  lands in "${f.destination}"`);
  }
  console.error(
    '\nFix: add the path to that section in SECTION_PATHS (src/components/layout/IconRail.jsx),\n' +
      'or move the link to the sidebar view it belongs to.\n'
  );
  process.exit(1);
}

console.log(`✓ sidebar nav OK — ${checked} links checked, none leave their section.`);
