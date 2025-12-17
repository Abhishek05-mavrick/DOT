require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(cors());
app.use(express.json());
const path = require('path');

// Serve static files from the project root so you can open http://localhost:3000/form.html
app.use(express.static(path.join(__dirname, '..')));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "form.html"));
});

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://eorwvuivppmyzavvuquo.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY;
if (!SUPABASE_KEY) {
  console.error('Missing SUPABASE_KEY in environment. Please set it in .env or as an environment variable.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

app.post('/register', async (req, res) => {
  try {
    const payload = req.body || {};
    // Basic validation
    const required = ['full_name', 'personal_email'];
    for (const f of required) {
      if (!payload[f] || typeof payload[f] !== 'string' || !payload[f].trim()) {
        return res.status(400).json({ success: false, error: `${f} is required` });
      }
    }

    const insertPayload = {
      full_name: payload.full_name.trim(),
      personal_email: payload.personal_email.trim(),
      company_name: (payload.company_name || '').trim(),
      company_email: (payload.company_email || '').trim(),
      accepted_terms: !!payload.accepted_terms,
      newsletter_opt_in: !!payload.newsletter_opt_in,
      created_at: new Date().toISOString()
    };

    const { data, error } = await supabase.from('registrations').insert([insertPayload]).select();

    if (error) {
      console.error('Supabase insert error:', error);
      return res.status(500).json({ success: false, error: error.message });
    }

    return res.json({ success: true, data });
  } catch (err) {
    console.error('Server error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Health endpoint for quick availability checks
app.get('/health', (req, res) => {
  res.json({ ok: true, time: new Date().toISOString() });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
