import type { ButtonHTMLAttributes, ReactNode } from "react";

type PrimaryActionProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
};

export function PrimaryAction({ children, className = "", ...props }: PrimaryActionProps) {
  return (
    <button
      {...props}
      className={`min-h-12 rounded-xl bg-[#d98700] px-7 py-3 text-lg font-bold text-[#142737] shadow-[0_3px_0_#9c5f00] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#1d5b83] focus-visible:ring-offset-2 enabled:hover:bg-[#e59a13] disabled:cursor-not-allowed disabled:opacity-45 ${className}`}
    >
      {children}
    </button>
  );
}