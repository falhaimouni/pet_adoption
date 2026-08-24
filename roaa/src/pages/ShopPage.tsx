import { useState, useMemo } from "react";
import { Search, X, ShoppingCart } from "lucide-react";
import Navbar from "../components/Navbar";
import ProductCard from "../components/ProductCard";
import EmptyState from "../components/EmptyState";
import { PRODUCTS, PRODUCT_CATEGORIES, ProductCategory } from "../data/products";
import { useCart } from "../context/CartContext";
import { useLanguage } from "../context/LanguageContext";

const CATEGORY_ICONS: Record<string, string> = {
  Food: "🍖",
  Accessories: "🦮",
  Health: "💊",
  Grooming: "✂️",
  "Beds & Blankets": "🛏️",
  Toys: "🎾",
  Housing: "🏠",
};

const SPECIES_FILTERS = ["All", "Dog", "Cat", "Rabbit", "Bird"];
const SPECIES_FILTER_KEY: Record<string, string> = {
  All: "req_all",
  Dog: "species_dog",
  Cat: "species_cat",
  Rabbit: "species_rabbit",
  Bird: "species_bird",
};
interface ShopPageProps {
  onNavigate: (page: string, params?: Record<string, unknown>) => void;
}

export default function ShopPage({ onNavigate }: ShopPageProps) {
  const { t } = useLanguage();
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<ProductCategory | "All">("All");
  const [speciesFilter, setSpeciesFilter] = useState("All");
  const [sort, setSort] = useState("featured");
  const { count } = useCart();

  const SORT_OPTIONS = [
    { value: "featured", label: t("shop_sort_featured") },
    { value: "price-asc", label: t("shop_sort_asc") },
    { value: "price-desc", label: t("shop_sort_desc") },
    { value: "rating", label: t("shop_sort_rated") },
  ];

  const filtered = useMemo(() => {
    let list = PRODUCTS.filter((p) => {
      const q = search.toLowerCase();
      if (q && !p.name.toLowerCase().includes(q) && !p.brand.toLowerCase().includes(q) && !p.category.toLowerCase().includes(q)) return false;
      if (activeCategory !== "All" && p.category !== activeCategory) return false;
      if (speciesFilter !== "All" && !p.forSpecies.includes(speciesFilter)) return false;
      return true;
    });
    if (sort === "price-asc") list = [...list].sort((a, b) => a.price - b.price);
    if (sort === "price-desc") list = [...list].sort((a, b) => b.price - a.price);
    if (sort === "rating") list = [...list].sort((a, b) => b.rating - a.rating);
    return list;
  }, [search, activeCategory, speciesFilter, sort]);

  return (
    <div className="min-h-screen bg-[#f0f8f7]">
      <Navbar onNavigate={onNavigate} activePage="shop" />

      {/* Hero */}
      <div className="bg-gradient-to-br from-[#047975] to-[#089D97] text-white py-10 px-5">
        <div className="max-w-6xl mx-auto flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          <div>
            <h1 className="font-['Prata',serif] text-[32px] lg:text-[40px] mb-1">{t("shop_title")}</h1>
            <p className="font-['Poppins',sans-serif] text-[15px] text-white/80">
              {t("shop_subtitle")}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative flex-1 lg:w-80">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#089D97]" />
              <input
                placeholder={t("shop_search_ph")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-[14px] bg-white text-[#1a2e2d] font-['Poppins',sans-serif] text-[14px] outline-none shadow-lg placeholder-gray-400"
              />
              {search && <button onClick={() => setSearch("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><X size={14} /></button>}
            </div>
            <button onClick={() => onNavigate("cart")} className="relative w-12 h-12 bg-white/20 hover:bg-white/30 rounded-[14px] flex items-center justify-center transition-colors">
              <ShoppingCart size={20} className="text-white" />
              {count > 0 && <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">{count}</span>}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-5 py-6 pb-16">
        {/* Category tabs */}
        <div className="flex gap-3 overflow-x-auto pb-2 mb-6 scrollbar-hide">
          <button
            onClick={() => setActiveCategory("All")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-[20px] font-['Poppins',sans-serif] text-[13px] font-medium whitespace-nowrap transition-all ${activeCategory === "All" ? "bg-[#089D97] text-white shadow-md" : "bg-white text-[#1a2e2d] hover:bg-[#e0f2f0]"}`}
          >
            🛒 {t("shop_all")}
          </button>
          {PRODUCT_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-[20px] font-['Poppins',sans-serif] text-[13px] font-medium whitespace-nowrap transition-all ${activeCategory === cat ? "bg-[#089D97] text-white shadow-md" : "bg-white text-[#1a2e2d] hover:bg-[#e0f2f0]"}`}
            >
              {CATEGORY_ICONS[cat]} {cat}
            </button>
          ))}
        </div>

        {/* Filters bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div className="flex gap-2 flex-wrap">
            {SPECIES_FILTERS.map((s) => (
              <button
                key={s}
                onClick={() => setSpeciesFilter(s)}
                className={`px-3 py-1.5 rounded-[20px] font-['Poppins',sans-serif] text-[12px] font-medium transition-all border ${speciesFilter === s ? "bg-[#1a2e2d] text-white border-[#1a2e2d]" : "bg-white text-[#5a8a87] border-gray-200 hover:border-[#089D97]"}`}
              >
                {t(SPECIES_FILTER_KEY[s])}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <span className="font-['Poppins',sans-serif] text-[13px] text-[#5a8a87] whitespace-nowrap">{filtered.length} {t("shop_products")}</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="border border-gray-200 rounded-[10px] px-3 py-2 font-['Poppins',sans-serif] text-[13px] text-[#1a2e2d] bg-white outline-none focus:border-[#089D97] transition-colors"
            >
              {SORT_OPTIONS.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Product grid */}
        {filtered.length === 0 ? (
          <EmptyState
            icon={<ShoppingCart size={32} />}
            title={t("shop_no_found")}
            description={t("shop_no_found_desc")}
            actionLabel={t("shop_clear")}
            onAction={() => { setSearch(""); setActiveCategory("All"); setSpeciesFilter("All"); }}
          />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filtered.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}

        {/* Cart CTA banner */}
        {count > 0 && (
          <div
            onClick={() => onNavigate("cart")}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 bg-[#089D97] text-white px-6 py-3.5 rounded-full shadow-2xl cursor-pointer hover:bg-[#047975] transition-all hover:scale-105"
          >
            <ShoppingCart size={18} />
            <span className="font-['Poppins',sans-serif] font-semibold text-[14px]">{count} {count > 1 ? t("cart_items_pl") : t("cart_items")} {t("shop_in_cart")}</span>
          </div>
        )}
      </div>
    </div>
  );
}
