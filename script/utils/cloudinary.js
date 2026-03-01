const CLOUDINARY_CLOUD = "du6lu8z3k";
const CLOUDINARY_PRESET = "social-uploads";

export async function uploadImage(file) {
  if (!file) return null;

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", CLOUDINARY_PRESET);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/upload`,
    {
      method: "POST",
      body: formData,
    },
  );

  if (!res.ok) {
    let details = "";
    try {
      const data = await res.json();
      details = data.error?.message ? `: ${data.error.message}` : "";
    } catch (err) {}

    throw new Error(`Failed to upload image${details}`);
  }

  const data = await res.json();
  return data.secure_url;
}
