import { AD_SIZE_CLASS, type AdDefinition } from "@/lib/ads";
import { cn } from "@/lib/utils";

export function AdSlot({
  slot,
  className,
}: {
  slot: AdDefinition;
  className?: string;
}) {
  return (
    <aside
      data-ad-slot={slot.id}
      aria-label={`Advertisement: ${slot.label}`}
      className={cn("ad-frame px-3 py-2", AD_SIZE_CLASS[slot.size], className)}
    >
      <span className="text-[10px] font-medium uppercase tracking-[0.16em]">Advertisement</span>
      <span className="text-xs">{slot.label}</span>
    </aside>
  );
}
