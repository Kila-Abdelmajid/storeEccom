import { ToastProvider } from "@/contexts/ToastContext";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body >
        <ToastProvider>
    <div className="min-h-screen   flex items-center justify-center p-4">
      {/* Background Overlay */}
      <div className="absolute inset-0 bg-white/30 backdrop-blur-sm" />
      
      <div className="relative w-full max-w-md">
        
        {children}
      </div>
    </div>
    </ToastProvider>
    </body>
    </html>
  );
}