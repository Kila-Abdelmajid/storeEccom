// components/ui/AppButton.tsx
import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Helper function bach n-manage-iw l-classes (ila knti m-installi tailwind-merge)
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
  
  // 1. Base styles (li kyt-3awdo dima)
  const baseStyles = "relative overflow-hidden font-medium rounded-full transition-all duration-300 active:scale-95 flex items-center justify-center gap-2 tracking-wide";
  
  // 2. Variants logic (khdina l-alwan mn l-Hero Slider dyalk)
  const variants = {
    // Dak l-lon l-gold li bghiti f Hero
    primary: "bg-linear-to-br from-[#c9a96e] to-[#b58b4a] text-[#1e1a14] shadow-md hover:shadow-xl hover:-translate-y-0.5 filter hover:brightness-110",
    
    // Dak l-border white transparent
    outline: "bg-transparent border-[1.5px] border-white/60 text-white backdrop-blur-sm hover:bg-white/15 hover:border-white hover:-translate-y-0.5 shadow-sm",
    
    // Anwa3 khrin (optional)
    danger: "bg-rose-600 text-white hover:bg-rose-700",
    ghost: "bg-transparent hover:bg-white/10 text-white/80",
  };

  // 3. Sizes
  const sizes = {
    sm: "px-4 py-1.5 text-xs",
    md: "px-7 py-3 text-sm",
    lg: "px-10 py-4 text-base",
  };

  return (
    <button 
      className={cn(baseStyles, variants[variant], sizes[size], className)} 
      {...props}
    >
      {/* Had l-span bach n-diru dak l-glow effect sghir (optional) */}
      <span className="relative z-10">{children}</span>
      
      {/* Shine effect mlli k-tklicki aw t-hoveri */}
      {variant === 'primary' && (
        <span className="absolute inset-0 bg-white/20 translate-y-full hover:translate-y-0 transition-transform duration-300" />
      )}
    </button>
  );
};