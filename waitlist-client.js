const notSaved = 'Your email was not saved. Please try again.';
const notConfigured = 'Waitlist signup is not configured yet. Please try again later.';

function normalizedEmail(value) {
  if (typeof value !== 'string' || value.length > 320) return null;
  const email = value.trim().toLowerCase();
  if (email.length > 254 || email.length < 3) return null;
  const parts = email.split('@');
  if (parts.length !== 2) return null;
  const [local, domain] = parts;
  if (!local || local.length > 64 || local.startsWith('.') || local.endsWith('.') ||
    local.includes('..') || !/^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+$/.test(local)) return null;
  const labels = domain.split('.');
  if (labels.length < 2 || labels.some((label) =>
    !/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(label)
  ) || !/^[a-z]{2,63}$/.test(labels.at(-1))) return null;
  return email;
}

function publicConfiguration(config) {
  try {
    const url = new URL(config.supabaseUrl);
    const key = config.supabasePublishableKey;
    if (url.protocol !== 'https:' || !/^[a-z0-9-]+\.supabase\.co$/.test(url.hostname) ||
      url.port || url.username || url.password || url.pathname !== '/' || url.search || url.hash ||
      typeof key !== 'string') return null;
    if (!key.startsWith('sb_publishable_')) return null;
    return { url: url.origin, key };
  } catch { return null; }
}

/** Insert-only browser client. Database grants and RLS enforce access independently. */
export async function submitWaitlist(input, { config = {}, location = globalThis.location, fetcher = globalThis.fetch } = {}) {
  const email = normalizedEmail(input?.email);
  if (!email || input?.consent !== true) throw new Error('Enter a valid email and confirm you want launch updates.');
  const local = ['localhost', '127.0.0.1', '[::1]'].includes(location?.hostname) &&
    ['http:', 'https:'].includes(location?.protocol);
  const remote = local ? null : publicConfiguration(config);
  if (!local && !remote) throw new Error(notConfigured);
  // A convenience filter only: direct API callers can bypass this honeypot.
  if (typeof input.website === 'string' && input.website.length > 0) return;
  const headers = { 'Content-Type': 'application/json' };
  if (!local && remote) {
    headers.apikey = remote.key;
    headers.Prefer = 'return=minimal';
  }
  let response;
  try {
    response = await fetcher(local ? '/api/waitlist' : `${remote.url}/rest/v1/waitlist_signups`, {
      method: 'POST', headers, credentials: 'omit', redirect: 'error', signal: AbortSignal.timeout(15000),
      body: JSON.stringify(local ? { email, consent: true, website: input.website || '' } : { email }),
    });
  } catch (error) {
    throw new Error(error?.name === 'TimeoutError'
      ? 'We could not confirm your signup. Please retry; your email will only be saved once.'
      : 'Could not connect. Please try again.');
  }
  if (local) {
    let result;
    try { result = await response.json(); } catch { throw new Error(notSaved); }
    if (response.ok && result.ok === true) return;
    throw new Error(response.status === 429 ? 'Too many attempts. Please try again later.' : notSaved);
  }
  if (response.ok) return;
  if (response.status === 409) {
    let result;
    try { result = await response.json(); } catch { throw new Error(notSaved); }
    if (result.code === '23505') return;
  }
  throw new Error(notSaved);
}
