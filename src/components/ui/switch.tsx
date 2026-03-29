"use client";

interface SwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}

export function Switch({ checked, onCheckedChange, disabled = false, className = "" }: SwitchProps) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => !disabled && onCheckedChange(!checked)}
      disabled={disabled}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      style={{ backgroundColor: checked ? undefined : undefined }}
    >
      <span
        className="pointer-events-none block h-5 w-5 rounded-full bg-white shadow-sm ring-0 transition-transform duration-200"
        style={{ transform: checked ? "translateX(1.25rem)" : "translateX(0.125rem)", marginTop: "2px" }}
      />
    </button>
  );
}
