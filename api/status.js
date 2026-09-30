export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  const requestId = req.query?.id;

  if (!requestId) {
    return res.status(400).json({
      error: "Missing request ID."
    });
  }

  const apiKeyId = process.env.HF_API_KEY_ID;
  const apiKeySecret = process.env.HF_API_KEY_SECRET;

  if (!apiKeyId || !apiKeySecret) {
    return res.status(500).json({
      error: "Higgsfield API credentials are not configured."
    });
  }

  try {
    const response = await fetch(
      `https://api.higgsfield.ai/requests/${encodeURIComponent(requestId)}/status`,
      {
        method: "GET",
        headers: {
          "Authorization": `Key ${apiKeyId}:${apiKeySecret}`
        }
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: data?.message || data?.error || "Unable to check video status.",
        details: data
      });
    }

    return res.status(200).json(data);

  } catch (error) {
    console.error("Higgsfield status error:", error);

    return res.status(500).json({
      error: "Unable to check video status.",
      details: error.message
    });
  }
}
