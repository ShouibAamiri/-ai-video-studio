import { config, higgsfield } from "@higgsfield/client/v2";

export default async function handler(req, res) {
  // Allow requests from your GitHub Pages website
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  try {
    const { prompt, duration, ratio } = req.body || {};

    if (!process.env.HF_CREDENTIALS) {
      return res.status(500).json({
        error: "Higgsfield credentials are not configured."
      });
    }

    if (!prompt || !prompt.trim()) {
      return res.status(400).json({
        error: "Please enter a video prompt."
      });
    }

    const safeDuration = Number(duration) || 5;

    if (safeDuration < 4 || safeDuration > 30) {
      return res.status(400).json({
        error: "Duration must be between 4 and 30 seconds."
      });
    }

    const allowedRatios = [
      "16:9",
      "4:3",
      "1:1",
      "3:4",
      "9:16",
      "21:9"
    ];

    const aspectRatio = allowedRatios.includes(ratio)
      ? ratio
      : "9:16";

    // Configure the official Higgsfield SDK
    config({
      credentials: process.env.HF_CREDENTIALS
    });

    // Generate the video with Seedance 2.5
    const result = await higgsfield.subscribe(
      "bytedance/seedance-2.5/text-to-video",
      {
        input: {
          prompt: prompt.trim(),
          duration: safeDuration,
          resolution: "720p",
          aspect_ratio: aspectRatio,
          output_format: "mp4",
          generate_audio: true
        },
        withPolling: true
      }
    );

    if (!result || !result.video) {
      return res.status(502).json({
        error: "Higgsfield completed the request but did not return a video.",
        details: result
      });
    }

    return res.status(200).json({
      success: true,
      video: result.video
    });

  } catch (error) {
    console.error(
      "Higgsfield generation error:",
      error?.message || error
    );

    return res.status(500).json({
      error:
        error?.message ||
        "Unable to generate video."
    });
  }
}
