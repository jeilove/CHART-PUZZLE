async function testSearch(domain, st) {
  const q = "삼성";
  const url = `https://${domain}/ac?q=${encodeURIComponent(q)}&q_enc=utf-8&st=${st}&r_format=json&r_enc=utf-8&_srch=finance`;
  
  console.log(`Testing ${domain} st=${st}...`);
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
      }
    });
    
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    console.log(`Result:`, JSON.stringify(data.items?.[0]?.[0] || "None", null, 2));
  } catch (error) {
    console.error(`Error for ${domain}:`, error.message);
  }
}

async function run() {
  await testSearch("ac.naver.com", 1);
  await testSearch("ac.naver.com", 11);
  await testSearch("ac.naver.com", 111);
}

run();
