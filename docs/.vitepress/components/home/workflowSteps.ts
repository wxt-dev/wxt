import { stats } from './stats';

/**
 * Scripted terminal sessions for the "Create, develop, ship." section.
 *
 * The output is based on real runs of each command, trimmed down to the lines
 * that are worth reading. Lines use a tiny markup, `[class]text[/]`, with the
 * classes: dim, ok, cyan, bold, sel, spin (renders the spinner frame).
 */

export type TermLine = string | { id: string; text: string };

export interface TermEvent {
  /** Milliseconds after the command finished typing. */
  at: number;
  /** Remove this many lines from the end before adding. */
  drop?: number;
  add?: TermLine[];
  /** Replace the text of existing lines by id. */
  update?: Record<string, string>;
}

export interface WorkflowStep {
  name: string;
  description: string;
  command: string;
  events: TermEvent[];
}

export interface LineState {
  id?: string;
  text: string;
}

export function applyEvent(lines: LineState[], event: TermEvent): LineState[] {
  const next = event.drop ? lines.slice(0, -event.drop) : [...lines];
  for (const line of event.add ?? []) {
    next.push(typeof line === 'string' ? { text: line } : line);
  }
  for (const [id, text] of Object.entries(event.update ?? {})) {
    const index = next.findIndex((line) => line.id === id);
    if (index >= 0) next[index] = { ...next[index], text };
  }
  return next;
}

/** Every line state a step passes through, in order. */
function snapshots(step: WorkflowStep): LineState[][] {
  const all: LineState[][] = [];
  let lines: LineState[] = [];
  for (const event of step.events) {
    lines = applyEvent(lines, event);
    all.push(lines);
  }
  return all;
}

export function finalLines(step: WorkflowStep): LineState[] {
  return snapshots(step).at(-1) ?? [];
}

/** Most lines on screen at once, used to reserve space and avoid layout jumps. */
export function maxLineCount(steps: WorkflowStep[]): number {
  return Math.max(
    ...steps.flatMap((step) => snapshots(step).map((lines) => lines.length)),
  );
}

export interface Segment {
  text: string;
  cls?: string;
  spin?: boolean;
}

export function parseMarkup(line: string): Segment[] {
  if (line === '') return [{ text: '\u00a0' }];
  const segments: Segment[] = [];
  let last = 0;
  for (const match of line.matchAll(/\[(\w+)\](.*?)\[\/\]/g)) {
    if (match.index > last)
      segments.push({ text: line.slice(last, match.index) });
    segments.push(
      match[1] === 'spin'
        ? { text: '', cls: 'cyan', spin: true }
        : { text: match[2], cls: match[1] },
    );
    last = match.index + match[0].length;
  }
  if (last < line.length) segments.push({ text: line.slice(last) });
  return segments;
}

const version = `[dim]WXT[/] [bold]${stats.wxt}[/]`;
const info = (text: string) => `[cyan]ℹ[/] ${text}`;
const done = (text: string) => `[ok]✔[/] ${text}`;

function choices(items: string[], selected: number): string[] {
  return items.map((item, i) =>
    i === selected ? `[sel]› ${item}[/]` : `  ${item}`,
  );
}

function files(
  prefix: string,
  entries: [name: string, size: string][],
): string[] {
  const width = Math.max(...entries.map(([name]) => name.length)) + 4;
  const sizeWidth = Math.max(...entries.map(([, size]) => size.length));
  return entries.map(([name, size], i) => {
    const branch = i === entries.length - 1 ? '└─' : '├─';
    const gap = ' '.repeat(width - name.length);
    return `  [dim]${branch} ${prefix}[/][cyan]${name}[/]${gap}[dim]${size.padStart(sizeWidth)}[/]`;
  });
}

const templates = ['vanilla', 'vue', 'react', 'solid', 'svelte'];
const packageManagers = ['bun', 'npm', 'pnpm', 'yarn'];

const stores: {
  id: string;
  name: string;
  /** [ms after start, status]; the last status finishes the store at `doneAt`. */
  statuses: [number, string][];
  doneAt: number;
}[] = [
  {
    id: 'chrome',
    name: 'Chrome Web Store',
    statuses: [
      [0, 'Checking ZIP files exist'],
      [800, 'Validating credentials'],
      [1500, 'Uploading new ZIP file'],
      [2800, 'Submitting for review'],
    ],
    doneAt: 3600,
  },
  {
    id: 'firefox',
    name: 'Firefox Addon Store',
    statuses: [
      [0, 'Checking ZIP files exist'],
      [800, 'Getting addon details'],
      [1500, 'Uploading new ZIP file'],
      [2800, 'Waiting for validation results'],
      [4000, 'Submitting new version'],
    ],
    doneAt: 4800,
  },
  {
    id: 'edge',
    name: 'Edge Addons',
    statuses: [
      [0, 'Checking ZIP files exist'],
      [1000, 'Uploading new ZIP file'],
      [2300, 'Waiting for validation results'],
      [3400, 'Submitting new version'],
    ],
    doneAt: 4200,
  },
  {
    id: 'opera',
    name: 'Opera Addons',
    statuses: [
      [0, 'Checking ZIP files exist'],
      [600, 'Getting addon details'],
      [1200, 'Getting previous addon version details'],
      [2000, 'Uploading new version from zip'],
      [3000, 'Waiting for validation results'],
      [3900, 'Updating new addon version details'],
      [4600, 'Submitting new version for review'],
    ],
    doneAt: 5400,
  },
];

function submitEvents(): TermEvent[] {
  const byTime = new Map<number, TermEvent>();
  const at = (ms: number) => {
    if (!byTime.has(ms)) byTime.set(ms, { at: ms, update: {} });
    return byTime.get(ms)!;
  };
  const running = (name: string, status: string) =>
    `[spin]⠋[/] ${name}  [dim]→ ${status}[/]`;

  at(0).add = [
    info('Publishing extension'),
    ...stores.map((s) => ({
      id: s.id,
      text: running(s.name, s.statuses[0][1]),
    })),
  ];
  for (const store of stores) {
    for (const [ms, status] of store.statuses.slice(1)) {
      at(ms).update![store.id] = running(store.name, status);
    }
    at(store.doneAt).update![store.id] = done(store.name);
  }
  return [...byTime.values()].sort((x, y) => x.at - y.at);
}

export const steps: WorkflowStep[] = [
  {
    name: 'init',
    description: 'Bootstrap a project from a starter template.',
    command: 'bunx wxt@latest init',
    events: [
      {
        at: 0,
        add: [
          version,
          info('Initializing new project'),
          '[cyan]?[/] [bold]Project Directory[/] [dim]›[/] [cyan]my-extension[/]',
        ],
      },
      {
        at: 900,
        drop: 1,
        add: [
          `${done('[bold]Project Directory[/]')} [dim]›[/] [cyan]my-extension[/]`,
          '[cyan]?[/] [bold]Choose a template[/]',
          ...choices(templates, 0),
        ],
      },
      { at: 1700, drop: 5, add: choices(templates, 1) },
      {
        at: 2300,
        drop: 6,
        add: [
          `${done('[bold]Choose a template[/]')} [dim]›[/] [cyan]vue[/]`,
          '[cyan]?[/] [bold]Package Manager[/]',
          ...choices(packageManagers, 0),
        ],
      },
      { at: 3000, drop: 4, add: choices(packageManagers, 0) },
      {
        at: 3600,
        drop: 5,
        add: [
          `${done('[bold]Package Manager[/]')} [dim]›[/] [cyan]bun[/]`,
          '[spin]⠋[/] Downloading template',
        ],
      },
      {
        at: 4600,
        drop: 1,
        add: [
          done('Downloading template'),
          '',
          '✨ WXT project created with the [cyan]vue[/] template.',
          '',
          'Next steps:',
          '  1. [cyan]cd my-extension[/]',
          '  2. [cyan]bun install[/]',
        ],
      },
    ],
  },
  {
    name: 'dev',
    description:
      'Open a browser with your extension installed, with HMR for UI and fast reloads for scripts.',
    command: 'bun dev',
    events: [
      { at: 0, add: [version] },
      {
        at: 400,
        add: [done(`Started dev server @ [cyan]http://localhost:3000[/]`)],
      },
      {
        at: 800,
        add: [
          info(
            `Pre-rendering [cyan]chrome-mv3[/] for [cyan]development[/] with [ok]Vite ${stats.vite}[/]`,
          ),
        ],
      },
      {
        at: 1800,
        add: [
          done('Built extension in 888 ms'),
          ...files('.output/chrome-mv3-dev/', [
            ['manifest.json', '1.74 kB'],
            ['popup.html', '681 B'],
            ['background.js', '100.45 kB'],
            ['content-scripts/content.js', '34.25 kB'],
            ['icons/128.png', '1.56 kB'],
          ]),
          '[cyan]Σ[/] Total size: 3.53 MB',
        ],
      },
      { at: 2600, add: [done('Opened browser in 553 ms')] },
      {
        at: 2800,
        add: [info('Press [bold]o + enter[/] to reopen the browser')],
      },
    ],
  },
  {
    name: 'zip',
    description: 'Package the extension for review and release.',
    command: 'bun zip',
    events: [
      { at: 0, add: [version] },
      {
        at: 400,
        add: [
          info(
            `Building [cyan]chrome-mv3[/] for [cyan]production[/] with [ok]Vite ${stats.vite}[/]`,
          ),
        ],
      },
      { at: 1300, add: [done('Built extension in 830 ms')] },
      {
        at: 1500,
        add: [
          ...files('.output/chrome-mv3/', [
            ['manifest.json', '1.24 kB'],
            ['popup.html', '401 B'],
            ['background.js', '10.87 kB'],
            ['content-scripts/content.js', '4.08 kB'],
            ['icons/128.png', '1.68 kB'],
          ]),
          '[cyan]Σ[/] Total size: 262.37 kB',
        ],
      },
      { at: 2300, add: [info('Zipping extension...')] },
      {
        at: 2800,
        drop: 1,
        add: [
          done('Zipped extension in 29 ms'),
          '  [dim]└─ .output/[/][ok]wxt-demo-1.0.0-chrome.zip[/]  [dim]94.93 kB[/]',
          '[cyan]Σ[/] Total size: 94.93 kB',
        ],
      },
      { at: 3100, add: [done('Finished in 1.261 s')] },
    ],
  },
  {
    name: 'submit',
    description:
      'Submit the zip to the stores, and publish automatically once approved.',
    command: 'bunx wxt submit',
    events: submitEvents(),
  },
];

export const maxLines = maxLineCount(steps);
