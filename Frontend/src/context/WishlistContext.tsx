import { createContext, useContext, useState, ReactNode } from "react";
import { Product } from "../data/products";
import { PetResponse } from "../lib/api";

interface WishlistContextValue {
  savedPets: PetResponse[];
  savedProducts: Product[];
  togglePet: (pet: PetResponse) => void;
  toggleProduct: (product: Product) => void;
  isPetSaved: (petId: string) => boolean;
  isProductSaved: (productId: number) => boolean;
  totalSaved: number;
}

const WishlistContext = createContext<WishlistContextValue | null>(null);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [savedPets, setSavedPets] = useState<PetResponse[]>([]);
  const [savedProducts, setSavedProducts] = useState<Product[]>([]);

  const togglePet = (pet: PetResponse) => {
    setSavedPets((prev) =>
      prev.some((p) => p.petId === pet.petId) ? prev.filter((p) => p.petId !== pet.petId) : [...prev, pet]
    );
  };

  const toggleProduct = (product: Product) => {
    setSavedProducts((prev) =>
      prev.some((p) => p.id === product.id) ? prev.filter((p) => p.id !== product.id) : [...prev, product]
    );
  };

  const isPetSaved = (petId: string) => savedPets.some((p) => p.petId === petId);
  const isProductSaved = (productId: number) => savedProducts.some((p) => p.id === productId);
  const totalSaved = savedPets.length + savedProducts.length;

  return (
    <WishlistContext.Provider value={{ savedPets, savedProducts, togglePet, toggleProduct, isPetSaved, isProductSaved, totalSaved }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist(): WishlistContextValue {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used inside WishlistProvider");
  return ctx;
}
