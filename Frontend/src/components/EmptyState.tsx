interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  // support both API shapes
  action?: { label: string; onClick: () => void };
  actionLabel?: string;
  onAction?: () => void;
}

export default function EmptyState({ icon, title, description, action, actionLabel, onAction }: EmptyStateProps) {
  const btnLabel = actionLabel ?? action?.label;
  const btnClick = onAction ?? action?.onClick;

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {icon && (
        <div className="w-[64px] h-[64px] bg-[rgba(8,157,151,0.12)] rounded-full flex items-center justify-center text-[#089D97] mb-4">
          {icon}
        </div>
      )}
      <p className="font-['Poppins',sans-serif] font-semibold text-[18px] text-black mb-2">{title}</p>
      {description && (
        <p className="font-['Poppins',sans-serif] text-[14px] text-black/60 max-w-[300px]">{description}</p>
      )}
      {btnLabel && btnClick && (
        <button
          onClick={btnClick}
          className="mt-5 bg-[#089D97] text-white font-['Poppins',sans-serif] font-medium text-[14px] px-6 py-2.5 rounded-[20px] hover:bg-[#047975] transition-colors"
        >
          {btnLabel}
        </button>
      )}
    </div>
  );
}
