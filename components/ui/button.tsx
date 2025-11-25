import { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: "default" | "secondary";
  className?: string;
}

export function Button({ children, variant = "default", className = "", ...props }: ButtonProps) {
  const baseClasses = "rounded-full px-6 py-3 text-sm font-semibold transition-colors";
  const variantClasses =
    variant === "default"
      ? "bg-slate-900 text-white shadow-lg hover:bg-slate-800 dark:bg-white dark:text-slate-900"
      : "bg-slate-100 text-slate-900 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700";

  return (
    <button className={`${baseClasses} ${variantClasses} ${className}`} {...props}>
      {children}
    </button>
  );
}

