import JSZip from "jszip";

async function fetchAsBlob(url: string): Promise<Blob> {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`Download failed: ${r.status}`);
  return r.blob();
}

function fileNameFromUrl(url: string, fallback: string): string {
  try {
    const u = new URL(url);
    const last = u.pathname.split("/").pop() || fallback;
    return last;
  } catch { return fallback; }
}

export async function downloadSingleImage(url: string, name?: string): Promise<void> {
  const blob = await fetchAsBlob(url);
  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = objectUrl;
  a.download = name || fileNameFromUrl(url, "image.jpg");
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(objectUrl);
}

export async function downloadImagesAsZip(
  images: { url: string; name?: string }[],
  zipName = "images.zip",
): Promise<void> {
  const zip = new JSZip();
  for (let i = 0; i < images.length; i++) {
    const img = images[i];
    try {
      const blob = await fetchAsBlob(img.url);
      const name = img.name || `${String(i + 1).padStart(3, "0")}-${fileNameFromUrl(img.url, "image.jpg")}`;
      zip.file(name, blob);
    } catch (e) {
      console.warn("Skipping image", img.url, e);
    }
  }
  const out = await zip.generateAsync({ type: "blob" });
  const objectUrl = URL.createObjectURL(out);
  const a = document.createElement("a");
  a.href = objectUrl;
  a.download = zipName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(objectUrl);
}
