import {
  useCallback,
  useId,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type KeyboardEvent,
} from "react";
import { FileUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function Dropzone({
  accept,
  multiple,
  onFiles,
  label,
  hint,
}: {
  accept: string;
  multiple: boolean;
  onFiles: (files: File[]) => void;
  label: string;
  hint?: string;
}) {
  const [active, setActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();

  const take = useCallback(
    (list: FileList | File[] | null) => {
      if (!list) return;
      const files = Array.from(list).filter(Boolean);
      if (files.length) onFiles(multiple ? files : files.slice(0, 1));
    },
    [multiple, onFiles],
  );

  const openPicker = () => {
    const el = inputRef.current;
    if (!el) return;
    el.value = "";
    el.click();
  };

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setActive(false);
    take(event.dataTransfer.files);
  };

  const onChange = (event: ChangeEvent<HTMLInputElement>) => {
    take(event.target.files);
    event.target.value = "";
  };

  const onKey = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openPicker();
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      aria-controls={inputId}
      aria-label={label}
      onClick={openPicker}
      onKeyDown={onKey}
      onDragOver={(event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = "copy";
        setActive(true);
      }}
      onDragEnter={(event) => {
        event.preventDefault();
        setActive(true);
      }}
      onDragLeave={() => setActive(false)}
      onDrop={onDrop}
      className={cn(
        "drop-target flex min-h-52 cursor-pointer flex-col items-center justify-center gap-3 rounded-xl px-6 py-10 text-center transition-[border-color,background-color] duration-150",
        active && "drop-target-active",
      )}
    >
      <span className="flex size-12 items-center justify-center rounded-full bg-secondary text-primary">
        <FileUp className="size-5" />
      </span>
      <span className="font-display text-2xl font-medium">{label}</span>
      {hint ? <span className="max-w-md text-sm text-muted-foreground">{hint}</span> : null}
      <Button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          openPicker();
        }}
      >
        Choose files
      </Button>
      <input
        id={inputId}
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={onChange}
        onClick={(event) => event.stopPropagation()}
        className="sr-only"
      />
    </div>
  );
}
