import Sidebar from '@/components/dashboard/sideBar';
import "../globals.css";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
     <html lang="en">
      <body >
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar fixed f l-issar */}
      <Sidebar />
      
      {/* Content dyal ay page dkhlat lih */}
      <main className="flex-1 overflow-auto p-6">
        {/* <div className="p-8 h-full"> */}
          {children}
        {/* </div> */}
      </main>
    </div>

      </body>
    </html>
  );
}