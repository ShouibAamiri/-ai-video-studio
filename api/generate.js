export default async function handler(req, res) {
  // Allow requests from your GitHub Pages website
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { prompt, duration, ratio } = req.body || {};

    if (!prompt || !prompt.trim()) {
      return res.status(400).json({
        error: "Please enter a video prompt."
      });
    }

    const apiKeyId = process.env.HF_API_KEY_ID;
    const apiKeySecret = process.env.HF_API_KEY_SECRET;

    if (!apiKeyId || !apiKeySecret) {
      return res.status(500).json({
        error: "Higgsfield API credentials are not configured."
      });
    }

    const response = await fetch(
      "https://api.higgsfield.ai/bytedance/seedance-2.0/text-to-video",
      {
        method: "POST",
        headers: {
          "Authorization": `Key ${apiKeyId}:${apiKeySecret}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          prompt: prompt.trim(),
          duration: Number(duration) || 5,
          resolution: "720p",
          aspect_ratio: ratio || "9:16",
          generate_audio: true
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: data?.message || data?.error || "Higgsfield API request failed.",
        details: data
      });
    }

    return res.status(200).json({
      success: true,
      request_id: data.request_id,
      status: data.status,
      status_url: data.status_url
    });

  } catch (error) {
    console.error("Higgsfield error:", error);

    return res.status(500).json({
      error: "Unable to start video generation.",
      details: error.message
    });
  }
}
