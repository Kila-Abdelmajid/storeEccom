'use client';

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  Search,
  User,
  Globe,
  ShoppingCart,
  Menu,
  X,
  Home,
  ShoppingBag,
  Mail,
  Info,
  Users,
} from "lucide-react";
import { useSession } from "@/lib/useSession";

const navItems = [
  { name: "Home", path: "/", icon: Home },
  { name: "Shop", path: "#shop", icon: ShoppingBag },
  { name: "Contact", path: "#contact", icon: Mail },
  { name: "About", path: "#about", icon: Info },
  { name: "Our Team", path: "#our-team", icon: Users },
];

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const { session, loading } = useSession();
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeHash, setActiveHash] = useState("");

  const isLoggedIn = !!session;

  useEffect(() => {
    const handleHashChange = () => setActiveHash(window.location.hash);
    window.addEventListener("hashchange", handleHashChange);
    handleHashChange();
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? "hidden" : "unset";
  }, [mobileMenuOpen]);

  const handleNavigation = (path: string, closeMenu = false) => {
    if (closeMenu) setMobileMenuOpen(false);
    if (path.startsWith("#")) {
      const targetId = path.replace("#", "");
      const element = document.getElementById(targetId);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
        window.history.pushState(null, "", path);
        setActiveHash(path);
      }
    } else {
      router.push(path);
      setActiveHash("");
    }
  };

  return (
    <header className="fixed top-0 left-0 w-full z-100 bg-white border-b border-gray-100 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07)] transition-all duration-300">
      <div className="container mx-auto px-4 md:px-10">
        {/* Top Row */}
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Left: Search & Mobile Menu */}
          <div className="flex items-center flex-1">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 -ml-2 text-gray-900 hover:bg-gray-50 rounded-full transition-colors"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            <form className="hidden md:flex relative group w-full max-w-[320px]">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for products..."
                className="w-full pl-11 pr-4 py-2.5 rounded-full border border-gray-200 bg-gray-50/50 text-sm focus:bg-white focus:border-[#c9a96e] focus:ring-4 focus:ring-[#c9a96e]/5 outline-none transition-all duration-300"
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-[#c9a96e] transition-colors" />
            </form>
          </div>

          {/* Logo */}
          <div
            className="flex flex-col items-center cursor-pointer group"
            onClick={() => handleNavigation("/")}
          >
            <span className="font-black text-xl md:text-2xl tracking-tighter text-gray-900 transition-transform duration-300 group-hover:scale-105">
              ABDO<span className="text-[#c9a96e]">STORE</span>
            </span>
            <div className="w-6 h-0.5 bg-[#c9a96e] rounded-full scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-center mt-0.5"></div>
          </div>

          {/* Right Icons */}
          <div className="flex items-center justify-end gap-1 md:gap-4 flex-1">
            <button className="hidden sm:flex p-2.5 text-gray-600 hover:text-[#c9a96e] hover:bg-[#c9a96e]/5 rounded-full transition-all">
              <Globe size={20} strokeWidth={1.5} />
            </button>
            {!loading && (
              isLoggedIn ? (
                <button
                  onClick={() => router.push("/profile")}
                  className="p-2.5 text-gray-600 hover:text-[#c9a96e] hover:bg-[#c9a96e]/5 rounded-full transition-all"
                >
                  <User size={20} strokeWidth={1.5} />
                </button>
              ) : (
                <button
                  onClick={() => router.push("/login")}
                  className="p-2.5 text-gray-600 hover:text-[#c9a96e] hover:bg-[#c9a96e]/5 rounded-full transition-all"
                >
                  <User size={20} strokeWidth={1.5} />
                </button>
              )
            )}
            <button className="p-2.5 text-gray-900 relative group transition-all">
              <div className="group-hover:scale-110 transition-transform duration-300">
                <ShoppingCart size={22} strokeWidth={1.5} />
              </div>
              <span className="absolute top-1 right-1 bg-[#c9a96e] text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center shadow-sm">
                0
              </span>
            </button>
          </div>
        </div>

        {/* Desktop Bottom Nav */}
        <nav className="hidden md:flex justify-center items-center gap-10 py-3 border-t border-gray-50">
          {navItems.map(({ name, path }) => {
            const isActive = path.startsWith("#") ? activeHash === path : pathname === path && activeHash === "";
            return (
              <button
                key={name}
                onClick={() => handleNavigation(path)}
                className={`group relative text-[11px] font-bold uppercase tracking-[0.2em] transition-colors duration-300 ${
                  isActive ? "text-[#c9a96e]" : "text-gray-500 hover:text-gray-900"
                }`}
              >
                {name}
                <span
                  className={`absolute -bottom-1.5 left-0 h-0.5 bg-[#c9a96e] transition-all duration-300 ${
                    isActive ? "w-full" : "w-0 group-hover:w-full"
                  }`}
                />
              </button>
            );
          })}
        </nav>
      </div>

      {/* Mobile Drawer */}
      <div
        className={`fixed inset-0 top-0 w-full h-screen bg-black/40 backdrop-blur-sm z-110 transition-opacity duration-500 md:hidden ${
          mobileMenuOpen ? "opacity-100 visible" : "opacity-0 invisible"
        }`}
        onClick={() => setMobileMenuOpen(false)}
      >
        <div
          className={`absolute left-0 top-0 w-[85%] max-w-90 h-full bg-white shadow-2xl transition-transform duration-500 ease-[cubic-bezier(0.32,0,0.07,1)] ${
            mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-8 flex flex-col h-full">
            <div className="flex justify-between items-center mb-10">
              <span className="font-black text-xl tracking-tighter">
                ABDO<span className="text-[#c9a96e]">STORE</span>
              </span>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 bg-gray-50 rounded-full"
              >
                <X size={20} />
              </button>
            </div>

            <nav className="flex flex-col gap-2">
              {navItems.map(({ name, path, icon: Icon }) => {
                const isActive = path.startsWith("#") ? activeHash === path : pathname === path && activeHash === "";
                return (
                  <button
                    key={name}
                    onClick={() => handleNavigation(path, true)}
                    className={`flex items-center gap-5 p-4 rounded-2xl font-bold uppercase tracking-widest text-xs transition-all duration-300 ${
                      isActive
                        ? "bg-[#c9a96e] text-white shadow-lg shadow-[#c9a96e]/20"
                        : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <Icon size={18} strokeWidth={isActive ? 2.5 : 1.5} />
                    {name}
                  </button>
                );
              })}
            </nav>

            <div className="mt-auto pt-8 border-t border-gray-100 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {!loading && (
                  <button
                    onClick={() => {
                      if (isLoggedIn) router.push("/profile");
                      else router.push("/login");
                      setMobileMenuOpen(false);
                    }}
                    className="flex flex-col items-center gap-2 py-5 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors"
                  >
                    <User size={20} className="text-[#c9a96e]" />
                    <span className="text-[10px] font-bold text-gray-500 uppercase">
                      {isLoggedIn ? "Profile" : "Login"}
                    </span>
                  </button>
                )}
                <button className="flex flex-col items-center gap-2 py-5 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors">
                  <Globe size={20} className="text-[#c9a96e]" />
                  <span className="text-[10px] font-bold text-gray-500 uppercase">
                    English
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}