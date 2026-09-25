import { useText } from "../i18n/useText";
import { useState } from "react";
import { ShoppingCart, Star } from "lucide-react";
import { Product, defaultSupplyImage } from "../data/products";
import { useCart } from "../context/CartContext";
import { useLanguage } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext";
import AuthenticatedImage from "./AuthenticatedImage";

interface ProductCardProps {
  product: Product;
  onQuickView?: (product: Product) => void;
}

const BADGE_STYLES: Record<string, string> = {
  Sale: "bg-red-500 text-white",
  New: "bg-primary text-white",
  "Best Seller": "bg-amber-400 text-white",
  Bundle: "bg-purple-500 text-white",
};

function StarRating({ rating, count }: { rating: number; count: number }) {
  return (
    <div className="flex items-center gap-1">
      <div className="flex">
        {[1, 2, 3, 4, 5].map((s) => (
          <Star key={s} size={11} className={s <= Math.round(rating) ? "text-amber-400 fill-amber-400" : "text-gray-200 fill-gray-200"} />
        ))}
      </div>
      <span className="font-['Poppins',sans-serif] text-[11px] text-[#5a8a87]">({count})</span>
    </div>
  );
}

export default function ProductCard({ product, onQuickView }: ProductCardProps) {
  const tx = useText();
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");
  const { addToCart, isInCart } = useCart();
  const { isAuthenticated, user } = useAuth();
  const { t } = useLanguage();
  const productId = String(product.id);
  const inCart = isInCart(productId);
  const canUseCart = isAuthenticated && user?.role === "adopter";
  const discount = product.originalPrice
    ? Math.round((1 - product.price / product.originalPrice) * 100)
    : null;

  return (
    <article className="bg-white rounded-[20px] shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden group border border-transparent hover:border-[rgba(8,157,151,0.12)] flex flex-col">
      {/* Image */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => onQuickView?.(product)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") onQuickView?.(product);
        }}
        className="relative h-[190px] bg-gray-50 overflow-hidden flex-shrink-0 text-start cursor-pointer"
      >
        {!imgLoaded && !imgError && (
          <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-gray-100 via-gray-50 to-gray-100 bg-[length:200%_100%]" />
        )}
        <AuthenticatedImage
          src={imgError ? defaultSupplyImage : product.image}
          fallback={defaultSupplyImage}
          alt={product.name}
          onLoad={() => setImgLoaded(true)}
          onError={() => { setImgLoaded(true); setImgError(true); }}
          className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${imgLoaded ? "opacity-100" : "opacity-0"}`}
        />

        {/* Badge */}
        {product.badge && (
          <span className={`absolute top-3 start-3 px-2 py-0.5 rounded-full font-['Poppins',sans-serif] text-[10px] font-bold ${BADGE_STYLES[product.badge]}`}>
            {product.badge === "Sale" && discount ? `-${discount}%` : tx(product.badge)}
          </span>
        )}
        {/* Out of stock overlay */}
        {!product.inStock && (
          <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
            <span className="bg-gray-800 text-white font-['Poppins',sans-serif] text-[12px] font-semibold px-3 py-1 rounded-full">{t("product_out_of_stock")}</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col gap-2.5 flex-1">
        <div>
          <p className="font-['Poppins',sans-serif] text-[10px] text-[#5a8a87] mb-0.5">{product.brand}</p>
          <button type="button" onClick={() => onQuickView?.(product)} className="text-start">
            <h3 className="font-['Poppins',sans-serif] font-semibold text-[14px] text-foreground leading-snug line-clamp-2 hover:text-primary transition-colors">{product.name}</h3>
          </button>
        </div>

        <StarRating rating={product.rating} count={product.reviewCount} />

        {/* Price */}
        <div className="flex items-baseline gap-2 mt-auto">
          <span className="font-['Poppins',sans-serif] font-bold text-[18px] text-primary">${product.price.toFixed(2)}</span>
          {product.originalPrice && (
            <span className="font-['Poppins',sans-serif] text-[13px] text-gray-400 line-through">${product.originalPrice.toFixed(2)}</span>
          )}
        </div>

        {/* Add to cart */}
        {canUseCart && (
          <button
            onClick={async () => {
              setAdding(true);
              setError("");
              try {
                await addToCart(product);
              } catch (err) {
                setError(err instanceof Error ? err.message : t("product_add_error"));
              } finally {
                setAdding(false);
              }
            }}
            disabled={!product.inStock || adding}
            className={`w-full flex items-center justify-center gap-2 py-2.5 font-['Poppins',sans-serif] font-medium text-[13px] rounded-[11px] transition-all duration-200 ${inCart ? "bg-secondary text-primary border-2 border-primary" : "bg-primary text-white hover:bg-primary-hover"} disabled:opacity-40 disabled:cursor-not-allowed`}
          >
            <ShoppingCart size={14} />
            {adding ? t("product_adding") : inCart ? t("product_in_cart") : t("product_add_to_cart")}
          </button>
        )}
        {error && <p className="font-['Poppins',sans-serif] text-[11px] text-red-600">{error}</p>}
      </div>
    </article>
  );
}
