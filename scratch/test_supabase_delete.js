const SUPABASE_URL = "https://koyzlttkznwrrvndddfy.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_eBvPT_1GQErr_WdtTERiyA_EPtn1Y77";

async function testSupabase() {
  console.log('Testing Supabase REST API...');

  // 1. Fetch products
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/products?select=*`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    });
    console.log('Fetch products status:', res.status);
    const data = await res.json();
    console.log('Products count:', Array.isArray(data) ? data.length : data);
    if (Array.isArray(data) && data.length > 0) {
      console.log('Sample product:', data[0]);
    }
  } catch (e) {
    console.error('Fetch products error:', e);
  }

  // 2. Test DELETE request on products
  try {
    const delRes = await fetch(`${SUPABASE_URL}/rest/v1/products?id=eq.p1`, {
      method: 'DELETE',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Prefer': 'return=representation'
      }
    });
    console.log('Delete product p1 status:', delRes.status);
    const delData = await delRes.text();
    console.log('Delete product p1 response:', delData);
  } catch (e) {
    console.error('Delete product error:', e);
  }
}

testSupabase();
