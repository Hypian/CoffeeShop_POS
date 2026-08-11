/* ==========================================================================
   DMCH Resto POS & MIS — Vercel Build Environment Variable Injector
   ========================================================================== */

const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, '../js/config.js');

try {
  if (fs.existsSync(configPath)) {
    let content = fs.readFileSync(configPath, 'utf8');

    const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
    const key = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

    if (url && key) {
      content = content.replace(
        /const SUPABASE_URL = window\.SUPABASE_URL \|\| "[^"]*";/,
        `const SUPABASE_URL = window.SUPABASE_URL || "${url}";`
      );
      content = content.replace(
        /const SUPABASE_ANON_KEY = window\.SUPABASE_ANON_KEY \|\| "[^"]*";/,
        `const SUPABASE_ANON_KEY = window.SUPABASE_ANON_KEY || "${key}";`
      );
      fs.writeFileSync(configPath, content, 'utf8');
      console.log('⚡ Vercel Environment Variables successfully injected into js/config.js!');
    } else {
      console.log('ℹ️ No SUPABASE_URL / SUPABASE_ANON_KEY environment variables found during build.');
    }
  }
} catch (err) {
  console.error('Error during env injection build step:', err);
}
