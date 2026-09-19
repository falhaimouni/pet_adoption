import defaultPetImage from "../assets/default-pet.jpeg";
import { PetImageResponse } from "./api";

export function getPetImageUrl(imageUrl?: string | null) {
  return imageUrl || defaultPetImage;
}

export function getPrimaryPetImageUrl(images?: PetImageResponse[] | null) {
  return getPetImageUrl(images?.[images.length - 1]?.imageUrl);
}

export { defaultPetImage };
