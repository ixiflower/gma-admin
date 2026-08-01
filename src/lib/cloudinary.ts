import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export { cloudinary };

export async function uploadImage(file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const base64 = `data:${file.type};base64,${buffer.toString("base64")}`;

  const result = await cloudinary.uploader.upload(base64, {
    folder: "gma",
    resource_type: "image",
  });

  return result.secure_url;
}

export async function uploadVideo(file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const base64 = `data:${file.type};base64,${buffer.toString("base64")}`;

  const result = await cloudinary.uploader.upload(base64, {
    folder: "gma",
    resource_type: "video",
  });

  return result.secure_url;
}

export function getOptimizedUrl(url: string, width = 800): string {
  return cloudinary.url(url, {
    fetch_format: "auto",
    quality: "auto",
    width,
    crop: "scale",
  });
}
