export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const MAX_DOCUMENT_SIZE_BYTES = 10 * 1024 * 1024;
export const ALLOWED_DOCUMENT_TYPES = ["application/pdf"];

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

export function validateImageFile(file: File, t?: (key: string) => string) {
  const translate = t ?? ((key: string) => key);
  if (file.size <= 0) return translate("upload_error_empty_image");
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) return translate("upload_error_image_type");
  if (file.size > MAX_IMAGE_SIZE_BYTES) return translate("upload_error_image_size");
  return "";
}

export function validateDocumentFile(file: File) {
  if (file.size <= 0) return "Please choose a non-empty PDF file.";
  if (!ALLOWED_DOCUMENT_TYPES.includes(file.type) || !file.name.toLowerCase().endsWith(".pdf")) {
    return "Only PDF documents are allowed.";
  }
  if (file.size > MAX_DOCUMENT_SIZE_BYTES) return "Document size must be 10 MB or less.";
  return "";
}
