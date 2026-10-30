// Receives the enquiry form and emails it to the business inbox through its own SMTP mailbox.
// Settings come from Vercel environment variables (never stored in the code):
//   SMTP_USER  mailbox address, e.g. support@logicscaletech.com
//   SMTP_PASS  mailbox password
//   SMTP_HOST  optional, default smtp.titan.email
//   SMTP_PORT  optional, default 465
//   MAIL_TO    optional, default = SMTP_USER
const nodemailer = require('nodemailer');

const one = (s, n) => String(s == null ? '' : s).replace(/[\r\n\u2028\u2029]+/g, ' ').trim().slice(0, n);
const many = (s, n) => String(s == null ? '' : s).replace(/\r/g, '').trim().slice(0, n);
const hits = new Map(); // best-effort limit per server instance

function limited(ip) {
  const now = Date.now(), win = 10 * 60 * 1000;
  const list = (hits.get(ip) || []).filter(t => now - t < win);
  list.push(now); hits.set(ip, list);
  if (hits.size > 500) hits.clear();
  return list.length > 5;
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') { res.status(405).json({ ok: false, error: 'POST only' }); return; }

  const origin = req.headers.origin || '';
  if (origin && !/^https:\/\/(www\.)?logicscaletech\.com$|^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
    res.status(403).json({ ok: false, error: 'Not allowed' }); return;
  }

  let b = req.body;
  if (typeof b === 'string') { try { b = JSON.parse(b); } catch (e) { b = {}; } }
  b = b || {};

  if (b.hp) { res.status(200).json({ ok: true }); return; } // hidden field filled in: a bot, pretend success

  const ip = one(req.headers['x-forwarded-for'] || '', 80).split(',')[0] || 'unknown';
  if (limited(ip)) { res.status(429).json({ ok: false, error: 'Too many enquiries. Please try again later.' }); return; }

  const f = {
    name: one(b.name, 100), phone: one(b.phone, 30), email: one(b.email, 120), city: one(b.city, 100),
    biz: one(b.biz, 150), type: one(b.type, 120), web: one(b.web, 200), want: one(b.want, 60),
    feats: one(b.feats, 600), budget: one(b.budget, 100), when: one(b.when, 100), notes: many(b.notes, 2000)
  };
  if (!f.name || !f.biz || !f.city || f.phone.replace(/\D/g, '').length < 10) {
    res.status(400).json({ ok: false, error: 'Please fill your name, phone, city and business name.' }); return;
  }

  const user = process.env.SMTP_USER, pass = process.env.SMTP_PASS;
  if (!user || !pass) { res.status(500).json({ ok: false, error: 'Mail is not set up yet.' }); return; }
  const port = parseInt(process.env.SMTP_PORT || '465', 10);
  const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.titan.email', port, secure: port === 465,
    auth: { user, pass }, connectionTimeout: 10000, greetingTimeout: 10000, socketTimeout: 15000
  });

  const text = 'New enquiry from logicscaletech.com\n\n' +
    'Name: ' + f.name + '\nPhone/WhatsApp: ' + f.phone + '\nEmail: ' + (f.email || '-') + '\nCity/Area: ' + f.city +
    '\n\nBusiness: ' + f.biz + '\nType: ' + (f.type || '-') + '\nExisting website/Instagram: ' + (f.web || '-') +
    '\n\nWants: ' + (f.want || '-') + '\nFeatures: ' + (f.feats || '-') + '\nBudget: ' + (f.budget || '-') +
    '\nTimeline: ' + (f.when || '-') + '\nNotes: ' + (f.notes || '-') + '\n';
  const msg = {
    from: '"Logic Scale Tech website" <' + user + '>',
    to: process.env.MAIL_TO || user,
    subject: 'Website/App enquiry: ' + (f.type || 'Other') + ' - ' + f.biz,
    text
  };
  if (/^[^\s@,;<>]+@[^\s@,;<>]+\.[^\s@,;<>]+$/.test(f.email)) msg.replyTo = f.email;

  try {
    await transport.sendMail(msg);
    res.status(200).json({ ok: true });
  } catch (e) {
    console.error('enquiry mail failed:', e && e.code, e && e.message);
    res.status(502).json({ ok: false, error: 'Could not send right now.' });
  }
};
