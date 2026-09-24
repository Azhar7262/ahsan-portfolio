require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const content = require('./content');

const app = express();
const PORT = process.env.PORT || 3000;
app.locals.siteUrl = process.env.SITE_URL || `http://localhost:${PORT}`;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public'), { maxAge: '7d' }));

// ------------------------------------------------------------------
// Simple JSON-file "database" (no setup needed)
// ------------------------------------------------------------------
const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);
const MESSAGES_FILE = path.join(DATA_DIR, 'messages.json');
const STATS_FILE = path.join(DATA_DIR, 'stats.json');

function readJson(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return fallback;
  }
}
function writeJson(file, data) {
  try {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
  } catch (e) {
    // Never let tracking/persistence failures crash a request
    console.error('Write failed for', file, ':', e.message);
  }
}

// CV download counter (persisted in data/stats.json)
let stats = readJson(STATS_FILE, { cvDownloads: 0 });

// ------------------------------------------------------------------
// Email (optional). If SMTP env vars are set, form submissions are
// emailed. Otherwise they are saved to data/messages.json.
// ------------------------------------------------------------------
let transporter = null;
if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
}

// ------------------------------------------------------------------
// Routes
// ------------------------------------------------------------------
app.get('/', (req, res) => {
  res.render('index', {
    content,
    stats,
    cvFile: res.locals.cvFile,
    submitted: req.query.sent === '1',
    formError: req.query.error === '1',
  });
});

// CV download (tracked)
app.get('/cv', (req, res) => {
  const cvPath = path.join(DATA_DIR, 'cv', 'cv.pdf');
  if (!fs.existsSync(cvPath)) {
    console.error('CV missing at', cvPath);
    return res
      .status(404)
      .send('CV file missing — please email ' + content.contact.email + ' for my CV.');
  }
  // Count the download, but never let tracking failures break it
  try {
    stats.cvDownloads += 1;
    writeJson(STATS_FILE, stats);
  } catch (e) {
    console.error('CV stats update failed:', e.message);
  }
  res.download(cvPath, 'Ahsan_Ilyas_CV.pdf', (err) => {
    if (err && !res.headersSent) {
      console.error('CV download failed:', err.message);
      res.status(500).send('Could not download the CV — please email ' + content.contact.email);
    }
  });
});

// Contact form
app.post('/contact', (req, res) => {
  const { name, email, subject, message, website } = req.body; // "website" = honeypot

  const valid =
    name && name.trim().length >= 2 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email || '') &&
    subject &&
    message && message.trim().length >= 10;

  // Honeypot filled => almost certainly a bot: pretend success, do nothing.
  if (website) return res.redirect('/?sent=1');

  if (!valid) return res.redirect('/?error=1#contact');

  const entry = {
    receivedAt: new Date().toISOString(),
    ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
    name: name.trim(),
    email: email.trim(),
    subject,
    message: message.trim(),
  };

  // Always save a local copy...
  const messages = readJson(MESSAGES_FILE, []);
  messages.push(entry);
  writeJson(MESSAGES_FILE, messages);

  // ...and email it if SMTP is configured.
  const mailOptions = transporter && {
    from: `"Portfolio Form" <${process.env.SMTP_USER}>`,
    to: content.contact.email,
    replyTo: entry.email,
    subject: `[Portfolio] ${entry.subject} — ${entry.name}`,
    text: `Name: ${entry.name}\nEmail: ${entry.email}\nSubject: ${entry.subject}\n\n${entry.message}`,
  };

  if (transporter) {
    transporter.sendMail(mailOptions, (err) => {
      if (err) console.error('Email send failed (message still saved):', err.message);
      res.redirect('/?sent=1#contact');
    });
  } else {
    res.redirect('/?sent=1#contact');
  }
});

// Light obfuscated email for the HTML (basic anti-scrape)
app.use((req, res, next) => {
  res.locals.cvFile = '/cv';
  next();
});

// Global error handler — friendly page instead of an ugly stack trace
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.stack || err.message);
  if (res.headersSent) return next(err);
  res.status(500).send('Something went wrong — please try again or email ' + content.contact.email);
});

app.listen(PORT, () => {
  console.log(`Portfolio running: http://localhost:${PORT}`);
});
