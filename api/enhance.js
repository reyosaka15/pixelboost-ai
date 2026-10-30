
import { Client, handle_file } from "@gradio/client";

export const config = { maxDuration: 60 };

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Gunakan POST" });
  }

  try {
    const { image, scale = "4" } = req.body || {};

    if (!["2", "4", "8"].includes(String(scale))) {
      return res.status(400).json({ error: "Skala tidak valid" });
    }

    if (
      typeof image !== "string" ||
      !/^data:image\/(png|jpeg|webp);base64,/.test(image)
    ) {
      return res.status(400).json({ error: "Gambar tidak valid" });
    }

    if (image.length > 4000000) {
      return res.status(413).json({ error: "Gambar terlalu besar" });
    }

    const match = image.match(
      /^data:(image\/(?:png|jpeg|webp));base64,(.+)$/
    );

    const blob = new Blob(
      [Buffer.from(match[2], "base64")],
      { type: match[1] }
    );

    const client = await Client.connect(
      "Nick088/Real-ESRGAN_Pytorch"
    );

    const result = await client.predict("/predict", {
      img: handle_file(blob),
      size_modifier: String(scale)
    });

    const output = result.data?.[0];
    const url = typeof output === "string"
      ? output
      : output?.url;

    if (!url) {
      throw new Error("AI tidak mengembalikan gambar");
    }

    return res.status(200).json({ url });
  } catch (error) {
    return res.status(502).json({
      error: "AI gagal atau sedang sibuk",
      detail: String(error.message)
    });
  }
}
  
