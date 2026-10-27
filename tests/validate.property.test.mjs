import { test, expect } from 'vitest';
import fc from 'fast-check';
import { validateContact } from '../js/contact.js';

// P4: for every form data set (random strings, whitespace, empty strings, valid/invalid emails,
// length up to 300), `valid` holds iff name and message are non-empty after trim and the email
// matches the regex with at most 254 characters; `errors` follows name, email, message and lists
// only the failing fields.
const MODEL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // regex from the design, kept independent of the code

const ws = fc.constantFrom('', ' ', '\t', '\n', '  \n ');
const text = fc.oneof(
  fc.string({ maxLength: 300 }),
  ws,
  fc.tuple(ws, fc.string({ minLength: 1, maxLength: 300 }), ws).map(([a, s, b]) => a + s + b),
);
const local = fc.stringMatching(/^[a-z0-9._+-]{1,120}$/);
const label = fc.stringMatching(/^[a-z0-9-]{1,80}$/);
const email = fc.oneof(
  fc.string({ maxLength: 300 }),
  ws,
  fc.tuple(ws, local, label, label, ws).map(([a, l, d, t, b]) => `${a}${l}@${d}.${t}${b}`),
  fc.tuple(local, label).map(([l, d]) => `${l}@${d}`),
  fc.tuple(local, label, label).map(([l, d, t]) => `${l} x@${d}.${t}`),
  fc.tuple(local, label, label).map(([l, d, t]) => `${l}@@${d}.${t}`),
);

test('P4: validateContact matches the model', () => {
  fc.assert(
    fc.property(
      fc.record({ name: text, email, company: text, service: text, message: text }),
      (data) => {
        const e = data.email.trim();
        const bad = {
          name: data.name.trim() === '',
          email: !(MODEL_RE.test(e) && e.length <= 254),
          message: data.message.trim() === '',
        };
        const expectedFields = ['name', 'email', 'message'].filter((f) => bad[f]);
        const { valid, errors } = validateContact(data);
        expect(valid).toBe(expectedFields.length === 0);
        expect(errors.map((err) => err.field)).toEqual(expectedFields);
        for (const err of errors) expect(err.message.length).toBeGreaterThan(0);
      },
    ),
    { numRuns: 500 },
  );
});
