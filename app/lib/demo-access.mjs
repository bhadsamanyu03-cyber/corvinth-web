import { DemoError } from './demo-contract.mjs';

// Frontend contract only. Do not route this through the unrelated API-access waitlist.
export function readTokenRequest(input) {
  const work_email = typeof input?.work_email === 'string' ? input.work_email.trim() : '';
  const company_url = typeof input?.company_url === 'string' ? input.company_url.trim() : '';
  if (work_email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(work_email)) {
    throw new DemoError('demo_request_invalid');
  }
  try {
    const url = new URL(company_url);
    if (company_url.length > 2048 || !['https:', 'http:'].includes(url.protocol)
        || !url.hostname.includes('.') || url.username || url.password) throw new Error();
  } catch { throw new DemoError('demo_request_invalid'); }
  return { work_email, company_url };
}

export function readTokenRequestReceipt(data) {
  if (data?.status !== 'accepted' || typeof data.request_id !== 'string'
      || !/^[A-Za-z0-9_-]{1,120}$/.test(data.request_id)) {
    throw new DemoError('demo_request_unconfirmed');
  }
  return { status: 'accepted', request_id: data.request_id };
}

export const liveTokenRequests = Object.freeze({
  available: false,
  async submit() { throw new DemoError('demo_request_unavailable'); },
});
