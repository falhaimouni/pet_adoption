import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  page: number;
  totalPages: number;
  onPage: (p: number) => void;
}

export default function Pagination({ page, totalPages, onPage }: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages: (number | "...")[] = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= page - 1 && i <= page + 1)) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== "...") {
      pages.push("...");
    }
  }

  return (
    <div className="flex items-center justify-center gap-1 mt-4">
      <button
        disabled={page === 1}
        onClick={() => onPage(page - 1)}
        className="w-8 h-8 flex items-center justify-center rounded-[8px] text-[#089D97] hover:bg-[rgba(8,157,151,0.12)] disabled:opacity-30 transition-colors"
      >
        <ChevronLeft size={16} />
      </button>

      {pages.map((p, i) => (
        <button
          key={i}
          disabled={p === "..."}
          onClick={() => typeof p === "number" && onPage(p)}
          className={`min-w-[32px] h-8 px-1 flex items-center justify-center rounded-[8px] font-['Poppins',sans-serif] text-[13px] transition-colors ${
            p === page
              ? "bg-[#089D97] text-white"
              : p === "..."
              ? "text-black/40 cursor-default"
              : "text-black hover:bg-[rgba(8,157,151,0.12)]"
          }`}
        >
          {p}
        </button>
      ))}

      <button
        disabled={page === totalPages}
        onClick={() => onPage(page + 1)}
        className="w-8 h-8 flex items-center justify-center rounded-[8px] text-[#089D97] hover:bg-[rgba(8,157,151,0.12)] disabled:opacity-30 transition-colors"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
}
