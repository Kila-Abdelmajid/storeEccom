// components/ui/AppButton.tsx
import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface AppButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export const AppButton = ({ 
  variant = 'primary', 
  size = 'md', 
  className, 
  children, 
  ...props 
}: AppButtonProps) => {
  
  const baseStyles = "relative overflow-hidden font-medium rounded-full transition-all duration-300 active:scale-95 flex items-center justify-center gap-2 tracking-wide";
  
  const variants = {
    // Elegant gold gradient – identical to the hero slider button
    primary: "group relative overflow-hidden px-6 py-3 rounded-full bg-gradient-to-r from-amber-600 to-amber-700 text-white font-medium shadow-lg transition-all duration-300 hover:shadow-amber-500/20 hover:scale-105 active:scale-95",
    
    // Gold outline – becomes solid gold on hover (like hero button hover)
    outline: "border-2 border-[#c9a96e] text-[#c9a96e] bg-transparent hover:bg-[#c9a96e] hover:text-white transition-all",
    
    // Danger – soft rose gradient
    danger: "bg-gradient-to-r from-rose-500 to-rose-600 text-white hover:from-rose-600 hover:to-rose-700 shadow-md",
    
    // Ghost – subtle gray
    ghost: "bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800",
  };

  const sizes = {
    sm: "px-4 py-1.5 text-xs",
    md: "px-6 py-2.5 text-sm",
    lg: "px-8 py-3 text-base",
  };

  return (
    <button 
      className={cn(baseStyles, variants[variant], sizes[size], className)} 
      {...props}
    >
      <span className="relative z-10">{children}</span>
      
      {/* Subtle shine effect only for primary button */}
      {variant === 'primary' && (
        <span className="absolute inset-0 bg-white/20 translate-y-full hover:translate-y-0 transition-transform duration-300" />
      )}
    </button>
  );
};