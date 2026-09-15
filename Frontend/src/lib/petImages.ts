import defaultPetImage from "../imports/Home/735b39631c3076cb0778dad52f238169e2713381.png";
import { resolveAssetUrl } from "./api";

export function getPetImageUrl(imageUrl?: string | null) {
  return resolveAssetUrl(imageUrl) || defaultPetImage;
}

export { defaultPetImage };
