const SITEMAP = "https://www.thehrstackguide.com/sitemap-0.xml";

async function run() {
  console.log("Fetching sitemap...");
  const res = await fetch(SITEMAP);
  const xml = await res.text();
  const urls = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map(m => m[1]);
  console.log(`Checking ${urls.length} URLs for 404s...\n`);

  const broken = [];
  const batchSize = 15;

  for (let i = 0; i < urls.length; i += batchSize) {
    const batch = urls.slice(i, i + batchSize);
    await Promise.all(batch.map(async (url) => {
      try {
        const r = await fetch(url, { method: "HEAD" });
        if (r.status === 404) {
          broken.push(url);
          console.log(`❌ [404] ${url}`);
        }
      } catch (e) {
        broken.push(url);
        console.log(`💥 [ERR] ${url}`);
      }
    }));
  }

  console.log("\n--- AUDIT COMPLETE ---");
  console.log(`Total URLs Checked: ${urls.length}`);
  console.log(`Total 404 Errors Found: ${broken.length}`);
  if (broken.length > 0) {
    console.table(broken);
  }
}

run();
