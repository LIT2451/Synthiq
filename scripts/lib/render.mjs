// Minimal template engine for the Synthiq static build.
// Syntax: {{key}}, {{a.b}}, {{> partial}}, {{#if key}}…{{else}}…{{/if}}.
// Pure functions only: no file system access here.

export class RenderError extends Error {
  constructor(message) {
    super(message);
    this.name = 'RenderError';
  }
}

const MAX_PARTIAL_DEPTH = 5;
const REQUIRED_META = ['title', 'description', 'path'];

const ESCAPES = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
  // Braces are escaped too so an inserted value can never look like a tag.
  '{': '&#123;',
  '}': '&#125;',
};

export function escapeHtml(value) {
  return String(value).replace(/[&<>"'{}]/g, (ch) => ESCAPES[ch]);
}

// Splits "---\nkey: value\n---\nbody" into { meta, body }.
export function parsePage(source) {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(source);
  if (!match) throw new RenderError('missing front matter block');
  const meta = {};
  for (const raw of match[1].split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    const idx = line.indexOf(':');
    if (idx <= 0) throw new RenderError(`invalid front matter line: "${line}"`);
    const key = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim();
    meta[key] = value === 'true' ? true : value === 'false' ? false : value;
  }
  for (const key of REQUIRED_META) {
    if (typeof meta[key] !== 'string' || meta[key] === '') {
      throw new RenderError(`front matter is missing "${key}"`);
    }
  }
  return { meta, body: source.slice(match[0].length) };
}

function expandPartials(template, partials, stack) {
  return template.replace(/\{\{>\s*([\w-]+)\s*\}\}/g, (_, name) => {
    if (stack.includes(name)) {
      throw new RenderError(`partial cycle: ${[...stack, name].join(' > ')}`);
    }
    if (stack.length >= MAX_PARTIAL_DEPTH) {
      throw new RenderError(`partials nested deeper than ${MAX_PARTIAL_DEPTH}: ${[...stack, name].join(' > ')}`);
    }
    if (!Object.prototype.hasOwnProperty.call(partials, name)) {
      throw new RenderError(`unknown partial "${name}"`);
    }
    return expandPartials(partials[name], partials, [...stack, name]);
  });
}

const TAG = /\{\{\s*(#if\s+[\w.]+|else|\/if|[\w.]+)\s*\}\}/g;

// Builds a tree of text, var and if nodes.
function parse(template) {
  const root = { children: [] };
  const stack = [root];
  let last = 0;
  const current = () => stack[stack.length - 1];
  const push = (node) => {
    const top = current();
    (top.inElse ? top.otherwise : top.children).push(node);
  };

  for (const m of template.matchAll(TAG)) {
    if (m.index > last) push({ type: 'text', value: template.slice(last, m.index) });
    last = m.index + m[0].length;
    const tag = m[1];
    if (tag.startsWith('#if')) {
      const node = { type: 'if', key: tag.slice(3).trim(), children: [], otherwise: [], inElse: false };
      push(node);
      stack.push(node);
    } else if (tag === 'else') {
      const top = current();
      if (top === root || top.inElse) throw new RenderError('unexpected {{else}}');
      top.inElse = true;
    } else if (tag === '/if') {
      if (current() === root) throw new RenderError('unexpected {{/if}}');
      stack.pop();
    } else {
      push({ type: 'var', key: tag });
    }
  }
  if (stack.length > 1) throw new RenderError(`unclosed {{#if ${current().key}}}`);
  if (last < template.length) push({ type: 'text', value: template.slice(last) });
  return root.children;
}

function lookup(ctx, key) {
  let value = ctx;
  for (const part of key.split('.')) {
    if (value === null || typeof value !== 'object' || !Object.prototype.hasOwnProperty.call(value, part)) {
      throw new RenderError(`unknown key "${key}"`);
    }
    value = value[part];
  }
  return value;
}

function isTruthy(value) {
  if (Array.isArray(value)) return value.length > 0;
  return value !== '' && value !== false && value !== 0 && value !== null && value !== undefined;
}

function evaluate(nodes, ctx) {
  let out = '';
  for (const node of nodes) {
    if (node.type === 'text') out += node.value;
    else if (node.type === 'var') {
      const value = lookup(ctx, node.key);
      if (value !== null && typeof value === 'object') throw new RenderError(`key "${node.key}" is not a scalar`);
      out += escapeHtml(value);
    } else {
      out += evaluate(isTruthy(lookup(ctx, node.key)) ? node.children : node.otherwise, ctx);
    }
  }
  return out;
}

export function render(template, ctx, partials = {}) {
  return evaluate(parse(expandPartials(template, partials, [])), ctx);
}
