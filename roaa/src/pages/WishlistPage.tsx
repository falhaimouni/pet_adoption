import { Heart, ArrowLeft, PawPrint, ShoppingCart } from "lucide-react";
import Navbar from "../components/Navbar";
import PetCard from "../components/PetCard";
import ProductCard from "../components/ProductCard";
import EmptyState from "../components/EmptyState";
import { useWishlist } from "../context/WishlistContext";
import { useLanguage } from "../context/LanguageContext";
import { useState } from "react";

interface WishlistPageProps {
  onNavigate: (page: string, params?: Record<string, unknown>) => void;
}

export default function WishlistPage({ onNavigate }: WishlistPageProps) {
  const { savedPets, savedProducts, totalSaved } = useWishlist();
  const { t } = useLanguage();
  const [tab, setTab] = useState<"pets" | "products">("pets");

  return (
    <div className="min-h-screen bg-[#f0f8f7]">
      <Navbar onNavigate={onNavigate} />

      {/* Header */}
      <div className="bg-gradient-to-br from-[#089D97] to-[#047975] text-white py-10 px-5">
        <div className="max-w-5xl mx-auto">
          <button onClick={() => onNavigate("home")} className="flex items-center gap-1.5 font-['Poppins',sans-serif] text-[13px] text-white/70 hover:text-white mb-4 transition-colors group">
            <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> {t("wishlist_back")}
          </button>
          <div className="flex items-center gap-3 mb-1">
            <Heart size={24} className="text-red-300 fill-red-300" />
            <h1 className="font-['Prata',serif] text-[32px]">{t("wishlist_title")}</h1>
          </div>
          <p className="font-['Poppins',sans-serif] text-[15px] text-white/75">
            {totalSaved} {totalSaved !== 1 ? t("wishlist_saved_pl") : t("wishlist_saved")}
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-5 py-6 pb-16">
        {/* Tabs */}
        <div className="flex gap-3 mb-6">
          <button
            onClick={() => setTab("pets")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-[20px] font-['Poppins',sans-serif] text-[13px] font-medium transition-all ${tab === "pets" ? "bg-[#089D97] text-white shadow-md" : "bg-white text-[#1a2e2d] hover:bg-[#e0f2f0]"}`}
          >
            <PawPrint size={14} /> {t("wishlist_pets_tab")} ({savedPets.length})
          </button>
          <button
            onClick={() => setTab("products")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-[20px] font-['Poppins',sans-serif] text-[13px] font-medium transition-all ${tab === "products" ? "bg-[#089D97] text-white shadow-md" : "bg-white text-[#1a2e2d] hover:bg-[#e0f2f0]"}`}
          >
            <ShoppingCart size={14} /> {t("wishlist_products_tab")} ({savedProducts.length})
          </button>
        </div>

        {tab === "pets" ? (
          savedPets.length === 0 ? (
            <EmptyState
              icon={<PawPrint size={32} />}
              title={t("wishlist_no_pets")}
              description={t("wishlist_no_pets_desc")}
              actionLabel={t("wishlist_browse_pets")}
              onAction={() => onNavigate("pets")}
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {savedPets.map((pet) => (
                <PetCard
                  key={pet.id}
                  pet={pet}
                  onViewDetails={(id) => onNavigate("pet-detail", { petId: id })}
                  onAdopt={(id) => onNavigate("pet-detail", { petId: id })}
                />
              ))}
            </div>
          )
        ) : (
          savedProducts.length === 0 ? (
            <EmptyState
              icon={<ShoppingCart size={32} />}
              title={t("wishlist_no_products")}
              description={t("wishlist_no_products_desc")}
              actionLabel={t("wishlist_browse_shop")}
              onAction={() => onNavigate("shop")}
            />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {savedProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}
