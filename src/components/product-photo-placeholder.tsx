import { Images } from "lucide-react";

type ProductPhotoPlaceholderProps = {
  className?: string;
  label?: string;
};

export function ProductPhotoPlaceholder({
  className = "",
  label = "No photo added",
}: ProductPhotoPlaceholderProps) {
  return (
    <div
      role="img"
      aria-label={label}
      className={`flex h-full w-full flex-col items-center justify-center gap-2 bg-[#f1f3f1] text-[#7b867e] ${className}`}
    >
      <Images className="size-8 stroke-[1.5]" aria-hidden="true" />
      {label && <span className="text-xs font-medium">{label}</span>}
    </div>
  );
}
