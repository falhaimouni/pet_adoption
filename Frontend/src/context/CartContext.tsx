import { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import { Product, defaultSupplyImage } from "../data/products";
import { apiFetch, resolveAssetUrl } from "../lib/api";
import { useAuth } from "./AuthContext";

export interface CartItem {
  product: Product;
  quantity: number;
  cartItemId?: string;
  unitPrice: string;
  subtotal: string;
  imageUrl?: string | null;
}

interface BackendCartItem {
  cartItemId: string;
  productId: string;
  quantity: number;
  unitPrice: string;
  subtotal: string;
  imageUrl?: string | null;
  product?: {
    productId: string;
    productName: string;
    unitPrice: string;
    isActive: boolean;
  };
}

interface BackendCart {
  cartId: string;
  userId: string;
  cartItems?: BackendCartItem[];
}

interface CartContextValue {
  items: CartItem[];
  total: number;
  count: number;
  loading: boolean;
  error: string;
  addToCart: (product: Product) => Promise<void>;
  removeFromCart: (productId: string | number) => Promise<void>;
  updateQuantity: (productId: string | number, qty: number) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
  isInCart: (productId: string | number) => boolean;
}

const CartContext = createContext<CartContextValue | null>(null);

function mapCartItem(item: BackendCartItem): CartItem {
  const name = item.product?.productName ?? "Store item";
  const price = Number(item.unitPrice ?? item.product?.unitPrice ?? 0);
  return {
    cartItemId: item.cartItemId,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    subtotal: item.subtotal,
    product: {
      id: item.productId,
      productId: item.productId,
      name,
      brand: "Petopia Store",
      category: "Store",
      subCategory: "Supply",
      price,
      image: resolveAssetUrl(item.imageUrl) || defaultSupplyImage,
      rating: 0,
      reviewCount: 0,
      inStock: item.product?.isActive ?? true,
      description: name,
      forSpecies: [],
    },
  };
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, user } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const canUseCart = isAuthenticated && user?.role === "adopter";

  const refreshCart = useCallback(async () => {
    if (!canUseCart) {
      setItems([]);
      setError("");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const cart = await apiFetch<BackendCart>("/cart/me");
      setItems((cart.cartItems ?? []).map(mapCartItem));
    } catch (err) {
      setItems([]);
      setError(err instanceof Error ? err.message : "Unable to load cart.");
    } finally {
      setLoading(false);
    }
  }, [canUseCart]);

  useEffect(() => {
    void refreshCart();
  }, [refreshCart]);

  const addToCart = useCallback(async (product: Product) => {
    if (!canUseCart) {
      setError("Sign in as an adopter to add store items.");
      return;
    }

    const productId = String(product.productId ?? product.id);
    setError("");
    await apiFetch<BackendCart>("/cart/items", {
      method: "POST",
      body: JSON.stringify({ productId, quantity: 1 }),
    });
    await refreshCart();
  }, [canUseCart, refreshCart]);

  const removeFromCart = useCallback(async (productId: string | number) => {
    if (!canUseCart) return;
    const normalizedProductId = String(productId);
    setError("");
    await apiFetch<BackendCart>(`/cart/items/${normalizedProductId}`, { method: "DELETE" });
    await refreshCart();
  }, [canUseCart, refreshCart]);

  const updateQuantity = useCallback(async (productId: string | number, qty: number) => {
    if (!canUseCart) return;
    const normalizedProductId = String(productId);
    const existing = items.find((item) => String(item.product.id) === normalizedProductId);
    if (!existing) return;

    if (qty <= 0) {
      await removeFromCart(normalizedProductId);
      return;
    }

    if (qty > existing.quantity) {
      await apiFetch<BackendCart>("/cart/items", {
        method: "POST",
        body: JSON.stringify({ productId: normalizedProductId, quantity: qty - existing.quantity }),
      });
      await refreshCart();
      return;
    }

    if (qty < existing.quantity) {
      await apiFetch<BackendCart>(`/cart/items/${normalizedProductId}`, {
        method: "PATCH",
        body: JSON.stringify({ quantity: qty }),
      });
      await refreshCart();
    }
  }, [canUseCart, items, refreshCart, removeFromCart]);

  const clearCart = useCallback(async () => {
    if (!canUseCart) {
      setItems([]);
      return;
    }

    setError("");
    await apiFetch<{ success: boolean; message: string }>("/cart/me", { method: "DELETE" });
    setItems([]);
  }, [canUseCart]);

  const isInCart = useCallback((productId: string | number) => items.some((item) => String(item.product.id) === String(productId)), [items]);
  const total = useMemo(() => items.reduce((sum, item) => sum + Number(item.subtotal), 0), [items]);
  const count = useMemo(() => items.reduce((sum, item) => sum + item.quantity, 0), [items]);

  return (
    <CartContext.Provider value={{ items, total, count, loading, error, addToCart, removeFromCart, updateQuantity, clearCart, refreshCart, isInCart }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
