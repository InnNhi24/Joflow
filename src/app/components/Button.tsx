/**
 * Premium Glassmorphism Button Component
 * Modern gradient buttons with glass shine effect
 */

import { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

export default function Button({ 
  children, 
  variant = 'primary', 
  size = 'md',
  fullWidth = false,
  className = '',
  ...props 
}: ButtonProps) {
  const baseStyles = "rounded-3xl font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2 relative overflow-hidden group whitespace-nowrap";
  
  const variantStyles = {
    primary: "bg-gradient-to-r from-[#2A95BF] to-[#126DA6] text-white hover:shadow-lg hover:shadow-[#126DA6]/30 hover:scale-105 active:scale-100 shadow-md",
    secondary: "bg-white/80 backdrop-blur-md text-[#1261A6] border-2 border-white/40 hover:border-[#126DA6]/50 hover:bg-white/90 hover:scale-105 active:scale-100 shadow-lg shadow-[#126DA6]/10",
    ghost: "text-gray-700 hover:bg-white/50 backdrop-blur-sm hover:scale-105 active:scale-100"
  };
  
  const sizeStyles = {
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-3 text-base",
    lg: "px-8 py-4 text-lg"
  };
  
  const widthStyle = fullWidth ? "w-full" : "";
  
  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${widthStyle} ${className}`}
      {...props}
    >
      {/* Glass shine effect - only for primary variant */}
      {variant === 'primary' && (
        <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700 ease-in-out" />
      )}
      <span className="relative z-10 flex items-center gap-2">{children}</span>
    </button>
  );
}