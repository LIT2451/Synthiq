// Contact form: validates in the browser and opens the visitor's mail client with a prefilled
// message. Nothing is sent to a server and nothing is stored (NFR 7).

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const EMAIL_MAX = 254;
export const SUBJECT_PREFIX = 'Project enquiry from ';

const MESSAGES = {
  name: 'Please enter your name.',
  email: 'Please enter a valid email address, for example name@company.com.',
  message: 'Please tell us a little about your project.',
};

const str = (value) => (typeof value === 'string' ? value : '');

// Pure: { valid, errors: [{ field, message }] } with errors in the order name, email, message.
export function validateContact(data = {}) {
  const name = str(data.name).trim();
  const email = str(data.email).trim();
  const message = str(data.message).trim();
  const errors = [];
  if (!name) errors.push({ field: 'name', message: MESSAGES.name });
  if (!email || email.length > EMAIL_MAX || !EMAIL_RE.test(email)) errors.push({ field: 'email', message: MESSAGES.email });
  if (!message) errors.push({ field: 'message', message: MESSAGES.message });
  return { valid: errors.length === 0, errors };
}

// Pure: mailto URL with subject "Project enquiry from <name>" and a labelled body; the message
// comes last so it can span several lines.
export function buildMailto(to, data = {}) {
  const subject = `${SUBJECT_PREFIX}${str(data.name)}`;
  const body = [
    `Name: ${str(data.name)}`,
    `Email: ${str(data.email)}`,
    `Company: ${str(data.company)}`,
    `Service: ${str(data.service)}`,
    '',
    str(data.message),
  ].join('\n');
  return `mailto:${str(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

const FIELDS = ['name', 'email', 'company', 'service', 'message'];

export function initContactForm(form, { navigate = (url) => { globalThis.location.href = url; } } = {}) {
  if (!form) return null;
  form.noValidate = true;
  const status = form.querySelector('[role="status"]');
  const doc = form.ownerDocument;

  function clearErrors() {
    for (const field of FIELDS) {
      const input = form.elements.namedItem(field);
      if (input) input.removeAttribute('aria-invalid');
      const slot = doc.getElementById(`${field}-error`);
      if (slot) slot.textContent = '';
    }
  }

  function say(text, kind) {
    if (!status) return;
    status.textContent = text;
    status.dataset.state = kind;
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    clearErrors();
    const data = {};
    for (const field of FIELDS) {
      const input = form.elements.namedItem(field);
      data[field] = input ? input.value : '';
    }
    const { valid, errors } = validateContact(data);
    if (!valid) {
      for (const { field, message } of errors) {
        const input = form.elements.namedItem(field);
        if (input) input.setAttribute('aria-invalid', 'true');
        const slot = doc.getElementById(`${field}-error`);
        if (slot) slot.textContent = message;
      }
      const first = form.elements.namedItem(errors[0].field);
      if (first) first.focus();
      say('', 'error');
      return;
    }
    const to = str(form.dataset.email).trim();
    if (!to) {
      // No inbox configured yet: keep what the visitor typed and do not open a mail client (5.7).
      say('Our contact channel is being set up. Your message is still here, so please try again soon.', 'pending');
      return;
    }
    navigate(buildMailto(to, data));
    say('Your email app should open with the message ready to send. If it does not, write to us at ' + to + '.', 'success');
  });
  return { clearErrors };
}

if (typeof document !== 'undefined' && !globalThis.__SYNTHIQ_NO_AUTOINIT__) {
  initContactForm(document.querySelector('form[data-contact-form]'));
}
