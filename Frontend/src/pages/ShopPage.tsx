import { useEffect, useMemo, useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import Navbar from "../components/Navbar";
import ProductCard from "../components/ProductCard";
import EmptyState from "../components/EmptyState";
import Modal from "../components/Modal";
import { Product, productImage } from "../data/products";
import { useCart } from "../context/CartContext";
import { useLanguage } from "../context/LanguageContext";
import { apiFetch } from "../lib/api";

interface ShopPageProps {
  onNavigate: (page: string, params?: Record<string, unknown>) => void;
}

interface StoreSupply {
  supplyId: string;
  productId: string;
  supplyName: string;
  category: string;
  sellingPrice: string;
  quantity?: number;
  inStock: boolean;
}

interface StoreResponse {
  data: StoreSupply[];
  total: number;
  page: number;
  limit: number;
}

function mapSupplyToProduct(supply: StoreSupply, index: number): Product {
  return {
    id: supply.productId,
    productId: supply.productId,
    supplyId: supply.supplyId,
    name: supply.supplyName,
    brand: "Petopia Store",
    category: supply.category,
    subCategory: supply.category,
    price: Number(supply.sellingPrice),
    image: productImage(index),
    rating: 0,
    reviewCount: 0,
    inStock: supply.inStock,
    description: `${supply.supplyName} · ${supply.category}`,
    forSpecies: [],
  };
}

export default function ShopPage({ onNavigate }: ShopPageProps) {
  const { t } = useLanguage();
  const { count } = useCart();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [sort, setSort] = useState("featured");
  const [quickView, setQuickView] = useState<Product | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const categories = useMemo(
    () => Array.from(new Set(products.map((product) => String(product.category)))).sort(),
    [products],
  );

  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams({
      page: "1",
      limit: "100",
      sortBy: "supplyName",
      order: "ASC",
    });
    if (search.trim()) params.set("search", search.trim());
    if (category !== "All") params.set("category", category);

    setLoading(true);
    setError("");
    apiFetch<StoreResponse>(`/store/supplies?${params}`)
      .then((response) => {
        if (!cancelled) setProducts(response.data.map(mapSupplyToProduct));
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Unable to load store supplies.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [category, search]);

  const sortedProducts = useMemo(() => {
    return [...products].sort((a, b) => {
      if (sort === "price-asc") return a.price - b.price;
      if (sort === "price-desc") return b.price - a.price;
      return a.name.localeCompare(b.name);
    });
  }, [products, sort]);

  function clearFilters() {
    setSearch("");
    setCategory("All");
    setSort("featured");
  }

  return (
    <div className="min-h-screen bg-[#f0f8f7]">
      <Navbar onNavigate={onNavigate} activePage="shop" />

      <div className="bg-gradient-to-br from-[#047975] to-[#089D97] text-white py-10 px-5">
        <div className="max-w-6xl mx-auto flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          <div>
            <h1 className="font-['Prata',serif] text-[32px] lg:text-[40px] mb-1">{t("shop_title")}</h1>
            <p className="font-['Poppins',sans-serif] text-[15px] text-white/80">{t("shop_supplies_subtitle")}</p>
          </div>
          <div className="relative flex-1 lg:max-w-sm">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#089D97]" />
            <input
              placeholder={t("shop_search_ph")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-[14px] bg-white text-[#1a2e2d] font-['Poppins',sans-serif] text-[14px] outline-none shadow-lg placeholder-gray-400"
            />
            {search && <button onClick={() => setSearch("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><X size={14} /></button>}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-5 py-6 pb-16">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {["All", ...categories].map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-4 py-2 rounded-[20px] font-['Poppins',sans-serif] text-[13px] font-medium whitespace-nowrap transition-all ${category === cat ? "bg-[#089D97] text-white shadow-md" : "bg-white text-[#1a2e2d] hover:bg-[#e0f2f0]"}`}
              >
                {cat === "All" ? t("shop_all") : cat}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            {count > 0 && (
              <button onClick={() => onNavigate("cart")} className="px-3 py-2 rounded-[10px] bg-[#e0f2f0] text-[#047975] font-['Poppins',sans-serif] text-[12px] font-semibold hover:bg-[#bae0dd] transition-colors">
                {count} {count === 1 ? t("cart_items") : t("cart_items_pl")}
              </button>
            )}
            <span className="font-['Poppins',sans-serif] text-[13px] text-[#5a8a87] whitespace-nowrap">{sortedProducts.length} {t("shop_products")}</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="border border-gray-200 rounded-[10px] px-3 py-2 font-['Poppins',sans-serif] text-[13px] text-[#1a2e2d] bg-white outline-none focus:border-[#089D97] transition-colors"
            >
              <option value="featured">{t("shop_sort_featured")}</option>
              <option value="price-asc">{t("shop_sort_asc")}</option>
              <option value="price-desc">{t("shop_sort_desc")}</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((row) => <div key={row} className="h-[340px] rounded-[20px] bg-white animate-pulse" />)}
          </div>
        ) : error ? (
          <EmptyState icon={<SlidersHorizontal size={32} />} title={t("shop_load_error")} description={error} actionLabel="Try again" onAction={clearFilters} />
        ) : sortedProducts.length === 0 ? (
          <EmptyState icon={<SlidersHorizontal size={32} />} title={t("shop_no_found")} description={t("shop_no_found_desc")} actionLabel={t("shop_clear")} onAction={clearFilters} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {sortedProducts.map((product) => (
              <ProductCard key={product.id} product={product} onQuickView={setQuickView} />
            ))}
          </div>
        )}
      </div>

      <Modal title={quickView?.name ?? ""} open={!!quickView} onClose={() => setQuickView(null)} size="md">
        {quickView && (
          <div className="grid sm:grid-cols-[160px_1fr] gap-4">
            <img src={quickView.image} alt={quickView.name} className="w-full aspect-square rounded-[14px] object-cover bg-[#f0f8f7]" />
            <div>
              <p className="font-['Poppins',sans-serif] text-[12px] text-[#5a8a87] mb-1">{quickView.category}</p>
              <p className="font-['Poppins',sans-serif] text-[14px] text-[#1a2e2d] leading-relaxed">{quickView.description}</p>
              <p className="font-['Poppins',sans-serif] font-bold text-[22px] text-[#089D97] mt-4">${quickView.price.toFixed(2)}</p>
              <p className="font-['Poppins',sans-serif] text-[12px] text-[#5a8a87] mt-2">{quickView.inStock ? "In stock" : "Out of stock"}</p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
