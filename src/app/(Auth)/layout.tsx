
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body >
    <div className="min-h-screen bg-[url('/bg-floral.jpg')] bg-cover bg-center flex items-center justify-center p-4">
      {/* Background Overlay */}
      <div className="absolute inset-0 bg-white/30 backdrop-blur-sm" />
      
      <div className="relative w-full max-w-md">
        
        
        {children}
      </div>
    </div>
    </body>
    </html>
  );
}