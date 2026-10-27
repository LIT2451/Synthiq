import { test, expect } from 'vitest';
import fc from 'fast-check';
import { render, escapeHtml } from '../scripts/lib/render.mjs';

// P1: Render template đúng điều kiện và đầy đủ.
// Với mọi context (chuỗi rỗng hoặc bất kỳ, kể cả <>&"') và template ghép từ {{key}},
// {{#if key}}A{{else}}B{{/if}} lồng tới 3 cấp: không còn "{{"; khối A có mặt khi và chỉ khi
// giá trị khác rỗng; mọi giá trị chèn vào đã escape và giải escape ra đúng chuỗi gốc.

const KEYS = ['k0', 'k1', 'k2', 'k3', 'k4'];

const unescapeHtml = (s) =>
  s
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#123;/g, '{')
    .replace(/&#125;/g, '}')
    .replace(/&amp;/g, '&');

// Values: empty or arbitrary strings, biased toward HTML-special characters and braces.
const valueArb = fc.oneof(
  fc.constant(''),
  fc.string(),
  fc.string({ unit: fc.constantFrom('<', '>', '&', '"', "'", '{', '}', 'a', ' ') }),
);
const ctxArb = fc.record(Object.fromEntries(KEYS.map((k) => [k, valueArb])));

// Literal text never contains braces, so any "{{" in output must come from the engine.
const textArb = fc.string({ unit: fc.constantFrom('a', 'b', ' ', '<', '>', '&', '\n', '-') });

let markerId = 0;
const nodeArb = fc.letrec((tie) => ({
  node: fc.oneof(
    { depthSize: 'small', withCrossShrink: true },
    textArb.map((value) => ({ type: 'text', value })),
    fc.constantFrom(...KEYS).map((key) => ({ type: 'var', key })),
    fc.record({
      type: fc.constant('if'),
      key: fc.constantFrom(...KEYS),
      a: tie('list'),
      b: tie('list'),
    }),
  ),
  list: fc.array(tie('node'), { maxLength: 3 }),
}));

// Bound nesting to 3 levels of {{#if}} and give each branch a unique marker.
function limit(nodes, depth) {
  return nodes
    .filter((n) => n.type !== 'if' || depth < 3)
    .map((n) =>
      n.type === 'if'
        ? { ...n, id: markerId++, a: limit(n.a, depth + 1), b: limit(n.b, depth + 1) }
        : n,
    );
}

function toTemplate(nodes) {
  return nodes
    .map((n) => {
      if (n.type === 'text') return n.value;
      if (n.type === 'var') return `{{${n.key}}}`;
      return `{{#if ${n.key}}}[A${n.id}]${toTemplate(n.a)}{{else}}[B${n.id}]${toTemplate(n.b)}{{/if}}`;
    })
    .join('');
}

// Oracle: what the engine must produce, plus which branch markers must appear.
function model(nodes, ctx, seen) {
  return nodes
    .map((n) => {
      if (n.type === 'text') return n.value;
      if (n.type === 'var') return escapeHtml(ctx[n.key]);
      const taken = ctx[n.key] !== '';
      seen.push({ id: n.id, taken });
      return taken ? `[A${n.id}]${model(n.a, ctx, [])}` : `[B${n.id}]${model(n.b, ctx, [])}`;
    })
    .join('');
}

function collectIfs(nodes, out = []) {
  for (const n of nodes) {
    if (n.type === 'if') {
      out.push(n);
      collectIfs(n.a, out);
      collectIfs(n.b, out);
    }
  }
  return out;
}

test('P1: render honours conditions, leaves no tags and escapes every value', () => {
  fc.assert(
    fc.property(fc.array(nodeArb.node, { maxLength: 5 }), ctxArb, (raw, ctx) => {
      const nodes = limit(raw, 0);
      const out = render(toTemplate(nodes), ctx);

      // No template syntax survives, whatever the values contain.
      expect(out).not.toContain('{{');

      // Output matches the oracle exactly.
      expect(out).toBe(model(nodes, ctx, []));

      // Every top-level block: A present iff value non-empty (nested ones are covered by the oracle).
      for (const n of nodes.filter((x) => x.type === 'if')) {
        const taken = ctx[n.key] !== '';
        expect(out.includes(`[A${n.id}]`)).toBe(taken);
        expect(out.includes(`[B${n.id}]`)).toBe(!taken);
      }

      // Markers of untaken branches never leak.
      for (const n of collectIfs(nodes)) {
        if (!out.includes(`[A${n.id}]`) && !out.includes(`[B${n.id}]`)) continue;
        expect(out.includes(`[A${n.id}]`) && out.includes(`[B${n.id}]`)).toBe(false);
      }

      // Inserted values are escaped and round-trip back to the original.
      for (const key of KEYS) {
        const inserted = render(`{{${key}}}`, ctx);
        expect(inserted).not.toMatch(/[<>"'{}]/);
        expect(unescapeHtml(inserted)).toBe(ctx[key]);
      }
    }),
    { numRuns: 200 },
  );
});
