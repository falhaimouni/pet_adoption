export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

export function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function isStrongPassword(value: string) {
  return (
    value.length >= 8 &&
    value.length <= 255 &&
    /[a-z]/.test(value) &&
    /[A-Z]/.test(value) &&
    /\d/.test(value) &&
    /[^A-Za-z0-9]/.test(value)
  );
}

export function validateImageFile(file: File) {
  if (file.size <= 0) return "Please choose a non-empty image file.";
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) return "Only JPG, JPEG, PNG and WEBP images are allowed.";
  if (file.size > MAX_IMAGE_SIZE_BYTES) return "Image size must be 5 MB or less.";
  return "";
}
