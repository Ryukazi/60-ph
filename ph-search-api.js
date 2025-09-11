// Parse search page
function parseResults(html, limit = 70) {
  const $ = cheerio.load(html);
  const results = [];

  $(".phimage, .searchVideo, .wrap, .videoPreview").each((i, el) => {
    const root = $(el);

    let a = root.find("a").first();
    let href = a.attr("href") || "";
    if (href && !href.startsWith("http")) href = "https://www.pornhub.com" + href;

    const title =
      a.attr("title") || root.find(".title, .videoTitle").text().trim() || null;
    const thumb =
      root.find("img").attr("data-src") || root.find("img").attr("src") || null;
    const duration = root.find(".duration, .time").text().trim() || null;

    if (href && title) {
      results.push({ title, duration, thumbnail: thumb, videoUrl: href });
    }
  });

  return results.slice(0, limit); // slice after collecting
}

// ✅ Main API Route
app.get("/Denish/pornhub/search", async (req, res) => {
  try {
    const q = (req.query.q || "").trim();
    if (!q) return res.status(400).json({ error: "Missing query ?q=" });

    const limit = Math.min(parseInt(req.query.limit || "70"), 70); // allow up to 70

    const cacheKey = `search:${q}:${limit}`;
    const cached = cache.get(cacheKey);
    if (cached) return res.json({ cached: true, results: cached });

    const url = `https://www.pornhub.com/video/search?search=${encodeURIComponent(
      q
    )}`;
    const html = await fetchHTML(url);
    const results = parseResults(html, limit);

    cache.set(cacheKey, results);

    res.json({ cached: false, results });
  } catch (err) {
    res.status(500).json({ error: "Search failed", details: err.message });
  }
});
