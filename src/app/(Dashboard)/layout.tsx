'use client';
import Sidebar from '@/components/dashboard/sideBar';
import "../globals.css";
import { AuthProvider } from '@/contexts/AuthContext';
import { ToastProvider } from '@/contexts/ToastContext';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <ToastProvider>
            <div className="flex min-h-screen bg-gray-50">
              {/* Sidebar fixed on the left */}
              <Sidebar />
              
              {/* Main content – reduced padding to make components appear slightly smaller */}
              <main className="flex-1 overflow-auto p-6">
                {children}
              </main>
            </div>
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}