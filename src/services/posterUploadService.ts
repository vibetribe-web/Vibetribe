import { apiFetch } from "./api";

const MAX_POSTER_BYTES = 2 * 1024 * 1024;
const OPTIMIZE_AFTER_BYTES = 1024 * 1024;
const MAX_POSTER_DIMENSION = 1800;
const ALLOWED_POSTER_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

type SignedPosterUpload = {
  path: string;
  public_url: string;
};

export function validatePosterFile(file: File) {
  if (!ALLOWED_POSTER_TYPES.has(file.type)) {
    return "Only JPG, PNG, and WEBP files are allowed.";
  }

  if (file.size > MAX_POSTER_BYTES) {
    return "Poster size must be less than 2 MB.";
  }

  return null;
}

export async function uploadEventPoster(file: File, clubId: number) {
  const validationMessage = validatePosterFile(file);
  if (validationMessage) throw new Error(validationMessage);

  const optimizedFile = await optimizePosterFile(file);
  const formData = new FormData();
  formData.append("poster", optimizedFile, "event-poster");

  const upload = await apiFetch<SignedPosterUpload>(`/api/v1/clubs/${clubId}/event-poster-upload`, {
    method: "POST",
    body: formData,
  });

  return upload.public_url;
}

async function optimizePosterFile(file: File) {
  if (file.size <= OPTIMIZE_AFTER_BYTES) return file;

  const image = await loadImage(file);
  const scale = Math.min(1, MAX_POSTER_DIMENSION / Math.max(image.width, image.height));
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");

  if (!context) return file;

  context.drawImage(image, 0, 0, width, height);
  const blob = await canvasToBlob(canvas, "image/webp", 0.84);
  if (!blob || blob.size >= file.size) return file;

  return new File([blob], "event-poster.webp", {
    type: "image/webp",
    lastModified: Date.now(),
  });
}

function loadImage(file: File) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);
    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Could not read poster image."));
    };
    image.src = objectUrl;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number) {
  return new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, type, quality);
  });
}
