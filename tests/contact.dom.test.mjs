import { describe, test, expect } from 'vitest';
import { JSDOM } from 'jsdom';
import { validateContact, buildMailto, initContactForm } from '../js/contact.js';

// js/contact.js against a small form fixture (5.4, 5.5, 5.7).
const FORM = (email) => `
  <form data-contact-form data-email="${email}">
    <input name="name" id="name"><p id="name-error"></p>
    <input name="email" id="email"><p id="email-error"></p>
    <input name="company" id="company">
    <select name="service" id="service"><option value="">-</option><option>Cloud</option></select>
    <textarea name="message" id="message"></textarea><p id="message-error"></p>
    <button type="submit">Send</button>
    <p role="status" aria-live="polite"></p>
  </form>`;

function setup(email) {
  const w = new JSDOM(`<!doctype html><body>${FORM(email)}</body>`).window;
  const form = w.document.querySelector('form');
  const opened = [];
  initContactForm(form, { navigate: (url) => opened.push(url) });
  const fill = (values) => {
    for (const [k, v] of Object.entries(values)) form.elements.namedItem(k).value = v;
  };
  const submit = () => form.dispatchEvent(new w.Event('submit', { cancelable: true, bubbles: true }));
  return { w, form, opened, fill, submit, status: form.querySelector('[role="status"]') };
}

describe('validateContact', () => {
  test('flags missing fields in order and accepts a full form', () => {
    expect(validateContact({ name: ' ', email: 'x', message: '' }).errors.map((e) => e.field))
      .toEqual(['name', 'email', 'message']);
    expect(validateContact({ name: 'Ana', email: 'ana@example.com', message: 'Hi' })).toEqual({ valid: true, errors: [] });
    expect(validateContact({ name: 'Ana', email: `${'a'.repeat(250)}@b.co`, message: 'Hi' }).valid).toBe(false);
  });
});

describe('buildMailto', () => {
  test('encodes subject and body', () => {
    const url = buildMailto('hello@example.com', { name: 'A & B', email: 'a@b.co', message: 'x?y' });
    expect(url.startsWith('mailto:hello@example.com?subject=')).toBe(true);
    expect(url).not.toMatch(/ /);
    const params = new URLSearchParams(url.split('?')[1]);
    expect(params.get('subject')).toBe('Project enquiry from A & B');
  });
});

describe('initContactForm', () => {
  test('invalid submit shows errors under fields, sets aria-invalid and focuses the first', () => {
    const { w, form, opened, fill, submit } = setup('hello@example.com');
    expect(form.noValidate).toBe(true);
    fill({ name: 'Ana', email: 'not-an-email', message: '' });
    submit();
    expect(opened).toEqual([]);
    expect(w.document.getElementById('email-error').textContent).not.toBe('');
    expect(w.document.getElementById('message-error').textContent).not.toBe('');
    expect(w.document.getElementById('name-error').textContent).toBe('');
    expect(form.elements.namedItem('email').getAttribute('aria-invalid')).toBe('true');
    expect(w.document.activeElement).toBe(form.elements.namedItem('email'));

    fill({ email: 'ana@example.com', message: 'Hello' });
    submit();
    expect(form.elements.namedItem('email').hasAttribute('aria-invalid')).toBe(false);
    expect(w.document.getElementById('email-error').textContent).toBe('');
  });

  test('valid submit with a configured inbox opens mailto and shows a status message', () => {
    const { opened, fill, submit, status } = setup('hello@example.com');
    fill({ name: 'Ana', email: 'ana@example.com', message: 'Hello', service: 'Cloud' });
    submit();
    expect(opened).toHaveLength(1);
    expect(opened[0].startsWith('mailto:hello@example.com?')).toBe(true);
    expect(status.dataset.state).toBe('success');
    expect(status.textContent).not.toBe('');
  });

  test('valid submit without an inbox keeps the data and does not open mailto', () => {
    const { form, opened, fill, submit, status } = setup('');
    fill({ name: 'Ana', email: 'ana@example.com', message: 'Hello' });
    submit();
    expect(opened).toEqual([]);
    expect(status.dataset.state).toBe('pending');
    expect(status.textContent).toMatch(/being set up/);
    expect(form.elements.namedItem('message').value).toBe('Hello');
  });
});
