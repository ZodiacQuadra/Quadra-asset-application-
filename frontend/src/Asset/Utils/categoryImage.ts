// Category -> image filename in /public. Only these categories have a
// dedicated image today (files already present in /public); anything else
// (Mobile, Accessory, Printer, or a category not yet matching one of these
// exact names) falls back to the generic Laptop.png.
const CATEGORY_IMAGE_MAP: Record<string, string> = {
  laptop: "AssetLapTop.png",
  mouse: "AssetMouse.png",
  keyboard: "AssetKeyboard.png",
  monitor: "AssetMonitor.png",
  headphone: "AssetHeadphone.png",
  webcam: "AssetWebcam.png",
};
const FALLBACK_CATEGORY_IMAGE = "Laptop.png";

export const getCategoryImage = (category?: string | null) => {
  if (!category || typeof category !== "string") return FALLBACK_CATEGORY_IMAGE;
  const key = category.trim().toLowerCase();
  return CATEGORY_IMAGE_MAP[key] ?? FALLBACK_CATEGORY_IMAGE;
};
