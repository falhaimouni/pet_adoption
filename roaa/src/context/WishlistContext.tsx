import { createContext, useContext, useState, ReactNode } from "react";
import { Pet } from "../data/pets";
import { Product } from "../data/products";

interface WishlistContextValue {
  savedPets: Pet[];
  savedProducts: Product[];
  togglePet: (pet: Pet) => void;
  toggleProduct: (product: Product) => void;
  isPetSaved: (petId: number) => boolean;
  isProductSaved: (productId: number) => boolean;
  totalSaved: number;
}

const WishlistContext = createContext<WishlistContextValue | null>(null);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [savedPets, setSavedPets] = useState<Pet[]>([]);
  const [savedProducts, setSavedProducts] = useState<Product[]>([]);

  const togglePet = (pet: Pet) => {
    setSavedPets((prev) =>
      prev.some((p) => p.id === pet.id) ? prev.filter((p) => p.id !== pet.id) : [...prev, pet]
    );
  };

  const toggleProduct = (product: Product) => {
    setSavedProducts((prev) =>
      prev.some((p) => p.id === product.id) ? prev.filter((p) => p.id !== product.id) : [...prev, product]
    );
  };

  const isPetSaved = (petId: number) => savedPets.some((p) => p.id === petId);
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
