import { test, expect } from 'vitest';
import fc from 'fast-check';
import { buildMailto, SUBJECT_PREFIX } from '../js/contact.js';

// P6: for every recipient and valid form data (unicode, newlines, &?=#%), decoding `subject` and
// `body` of buildMailto gives back exactly the name, email, company, service and message entered.
// name/email/company/service come from single-line controls (no line breaks); message is a textarea.
const SPECIAL = fc.constantFrom('&', '?', '=', '#', '%', '+', ' ', '/', ':', 'ñ', 'Đ', 'ệ', '中', '😀');
const piece = (unit) => fc.oneof(fc.string({ unit, maxLength: 20 }), SPECIAL);
const joined = (unit, max) => fc.array(piece(unit), { maxLength: max }).map((parts) => parts.join(''));
const singleLine = joined('grapheme', 12).map((s) => s.replace(/[\r\n]/g, ' '));
const nonEmptyLine = singleLine.filter((s) => s.trim() !== '');
const multiLine = fc.array(fc.oneof(joined('grapheme', 6), fc.constantFrom('\n', '\r\n', '\n\n')), { maxLength: 10 })
  .map((parts) => parts.join(''))
  .filter((s) => s.trim() !== '');
const address = fc.tuple(
  fc.stringMatching(/^[a-z0-9._+-]{1,30}$/),
  fc.stringMatching(/^[a-z0-9-]{1,20}$/),
  fc.stringMatching(/^[a-z]{2,10}$/),
).map(([l, d, t]) => `${l}@${d}.${t}`);

// Reads a mailto URL back into its fields.
function parse(url) {
  const [head, query] = url.split('?');
  const params = {};
  for (const pair of query.split('&')) {
    const i = pair.indexOf('=');
    params[pair.slice(0, i)] = decodeURIComponent(pair.slice(i + 1));
  }
  const lines = params.body.split('\n');
  const value = (line, label) => {
    expect(line.startsWith(`${label}: `)).toBe(true);
    return line.slice(label.length + 2);
  };
  expect(lines[4]).toBe('');
  return {
    to: head.slice('mailto:'.length),
    subject: params.subject,
    name: value(lines[0], 'Name'),
    email: value(lines[1], 'Email'),
    company: value(lines[2], 'Company'),
    service: value(lines[3], 'Service'),
    message: lines.slice(5).join('\n'),
  };
}

test('P6: mailto round-trip', () => {
  fc.assert(
    fc.property(
      address,
      fc.record({ name: nonEmptyLine, email: address, company: singleLine, service: singleLine, message: multiLine }),
      (to, data) => {
        const url = buildMailto(to, data);
        expect(url).not.toMatch(/[\s#]/);
        const back = parse(url);
        expect(back.to).toBe(to);
        expect(back.subject).toBe(`${SUBJECT_PREFIX}${data.name}`);
        expect(back.subject.slice(SUBJECT_PREFIX.length)).toBe(data.name);
        expect({ name: back.name, email: back.email, company: back.company, service: back.service, message: back.message })
          .toEqual(data);
      },
    ),
    { numRuns: 400 },
  );
});
