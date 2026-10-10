'use client';

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import SearchBar from '@/components/ui/SearchBar';
import * as cartStorage from '@/lib/cartStorage';

import {
  User,
  ShoppingCart,
  Menu,
  X,
  Home,
  ShoppingBag,
  Mail,
  Info,
} from "lucide-react";
import { useAuth } from '@/hooks/useAuth';
import CartDrawer from "@/components/client/Cart/CartDrawer";

const navItems = [
  { name: "Home", path: "/", hash: "", icon: Home },
  { name: "Shop", path: "/#shop", hash: "shop", icon: ShoppingBag },
    { name: "Reviews", path: "/#reviews", hash: "reviews", icon: Info },
  { name: "Contact", path: "/#contact", hash: "contact", icon: Mail },
];

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const { session, loading } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeHash, setActiveHash] = useState("");
  const [cartCount, setCartCount] = useState(0);
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isNavigatingRef = useRef(false);

  const isLoggedIn = !!session;

  const updateActiveHashOnScroll = useCallback(() => {
    if (isNavigatingRef.current) return;

    if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    scrollTimeoutRef.current = setTimeout(() => {
      const sections = navItems
        .filter(item => item.hash)
        .map(item => ({ id: item.hash, path: item.path }));
      
      if (window.scrollY < 80) {
        setActiveHash("");
        return;
      }

      for (let i = sections.length - 1; i >= 0; i--) {
        const section = document.getElementById(sections[i].id);
        if (section) {
          const rect = section.getBoundingClientRect();
          if (rect.top <= 120) {
            // ✅ التعديل 1: نحفظو غير الـ Hash باش يطابق مع URL
            setActiveHash(`#${sections[i].id}`);
            return;
          }
        }
      }
    }, 50);
  }, []);

  const handleNavigation = (path: string, closeMenu = false) => {
    if (closeMenu) setMobileMenuOpen(false);
    isNavigatingRef.current = true;
    
    // ✅ التعديل 2: نقلبو بـ includes حيت الـ path كيبدا بـ /
    if (path.includes("#")) {
      const hashIndex = path.indexOf("#");
      const hash = path.substring(hashIndex); // كتعطينا "#shop"
      const elementId = hash.slice(1); // كتعطينا "shop"
      const element = document.getElementById(elementId);
      
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
        window.history.pushState(null, "", path);
        setActiveHash(hash);
        setTimeout(() => {
          isNavigatingRef.current = false;
        }, 600);
      } else {
        // يلا كنا ف صفحة أخرى وبغينا نمشيو للـ home عاد نهبطو لـ shop
        router.push(path);
        setActiveHash(hash);
        setTimeout(() => {
          isNavigatingRef.current = false;
        }, 600);
      }
    } else if (path === "/") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      window.history.pushState(null, "", "/");
      setActiveHash("");
      if (pathname !== "/") router.push("/");
      setTimeout(() => {
        isNavigatingRef.current = false;
      }, 600);
    } else {
      router.push(path);
      setActiveHash("");
      setTimeout(() => {
        isNavigatingRef.current = false;
      }, 300);
    }
  };

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    window.addEventListener("scroll", updateActiveHashOnScroll);
    updateActiveHashOnScroll();
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("scroll", updateActiveHashOnScroll);
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    };
  }, [updateActiveHashOnScroll]);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash) setActiveHash(hash);
      else setActiveHash("");
      isNavigatingRef.current = false;
    };
    window.addEventListener("hashchange", handleHashChange);
    // ✅ قراءة الـ Hash ف الـ Load الأول باش يلا دخل لـ الرابط نيشان يتعلم
    handleHashChange();
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileMenuOpen]);

  const fetchCartCount = async () => {
    if (session) {
      try {
        const res = await fetch('/api/ClientApi/cart');
        if (res.ok) {
          const items = await res.json();
          const total = items.reduce((sum: number, item: any) => sum + item.quantity, 0);
          setCartCount(total);
        }
      } catch (err) {
        console.error(err);
      }
    } else {
      const guestCount = cartStorage.getGuestCartCount();
      setCartCount(guestCount);
    }
  };

  useEffect(() => {
    fetchCartCount();
    window.addEventListener('cart-updated', fetchCartCount);
    return () => window.removeEventListener('cart-updated', fetchCartCount);
  }, [session]);

  // ✅ التعديل 3: إصلاح دالة isActive باش تخدم مزيان مع الروابط لي فيهم #
  const isActive = (path: string) => {
    if (path === "/") {
      return pathname === "/" && (!activeHash || activeHash === "");
    }
    if (path.includes("#")) {
      const hash = path.substring(path.indexOf("#"));
      return activeHash === hash;
    }
    return pathname === path;
  };

  return (
    <header
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-500 ${
        scrolled
          ? "bg-white/80 backdrop-blur-lg shadow-xl border-b border-white/20"
          : "bg-white/60 backdrop-blur-sm shadow-md border-b border-slate-100/50"
      }`}
    >
      <div className="container mx-auto px-4 md:px-8 lg:px-12">
        <div className="flex items-center justify-between h-16 md:h-20">
          <div className="flex items-center gap-3 md:gap-6 lg:gap-10">
            <div className="flex items-center gap-2 cursor-pointer group" onClick={() => handleNavigation("/")}>
              <div className="relative w-9 h-9 md:w-12 md:h-12 rounded-full overflow-hidden bg-white/20 shadow-sm ring-1 ring-amber-100/30">
                <Image
                  src="/photos/image.png"
                  alt="Fleur Marwa"
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                  priority
                />
              </div>
              <span className="text-sm sm:text-base md:text-lg font-serif italic font-bold bg-gradient-to-r from-amber-700 to-amber-500 bg-clip-text text-transparent drop-shadow-sm whitespace-nowrap">
                Fleur Marwa
              </span>
            </div>

            <nav className="hidden md:flex items-center gap-5 lg:gap-8">
              {navItems.map(({ name, path, icon: Icon }) => {
                const active = isActive(path);
                return (
                  <button
                    key={name}
                    onClick={() => handleNavigation(path)}
                    className={`group relative text-sm font-display font-semibold uppercase tracking-wider transition-all duration-300 flex items-center gap-1.5 ${
                      active
                        ? "text-amber-600 drop-shadow-sm"
                        : "text-slate-600 hover:text-amber-500"
                    }`}
                  >
                    <Icon size={16} strokeWidth={active ? 2.2 : 1.5} className="transition-transform duration-200 group-hover:scale-110" />
                    {name}
                    <span className={`absolute -bottom-2 left-0 h-0.5 bg-gradient-to-r from-amber-400 to-amber-500 transition-all duration-300 rounded-full ${
                      active ? "w-full opacity-100" : "w-0 opacity-0 group-hover:w-full group-hover:opacity-100"
                    }`} />
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-3 md:gap-5">
            <div className="hidden md:block w-96">
              <SearchBar />
            </div>

            <div className="flex items-center gap-2 md:gap-3">
              {!loading && (
                <button
                  onClick={() => router.push(isLoggedIn ? "/profile" : "/login")}
                  className="p-2 text-slate-600 transition-all duration-200 rounded-full hover:bg-white/60 hover:text-amber-600 hover:scale-110 active:scale-95"
                  aria-label="Account"
                >
                  <User size={20} strokeWidth={1.5} />
                </button>
              )}
              <button
                onClick={() => setCartDrawerOpen(true)}
                className="relative p-2 text-slate-700 transition-all duration-200 rounded-full hover:bg-white/60 hover:text-amber-600 hover:scale-110 active:scale-95"
                aria-label="Shopping cart"
              >
                <ShoppingCart size={22} strokeWidth={1.5} />
                <span className="absolute -top-1 -right-1 bg-amber-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-lg ring-2 ring-white/80">
                  {cartCount > 0 ? (cartCount > 9 ? '9+' : cartCount) : 0}
                </span>
              </button>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 text-slate-700 rounded-full hover:bg-white/60 active:scale-95 transition-all"
                aria-label="Menu"
              >
                {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div
        className={`fixed inset-0 w-full h-screen bg-black/40 backdrop-blur-md z-50 transition-all duration-500 md:hidden ${
          mobileMenuOpen ? "opacity-100 visible" : "opacity-0 invisible pointer-events-none"
        }`}
        onClick={() => setMobileMenuOpen(false)}
      >
        <div
          className={`absolute left-0 top-0 w-[85%] max-w-sm h-full bg-white/95 backdrop-blur-sm shadow-2xl transition-transform duration-500 ease-out ${
            mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex flex-col h-full">
            <div className="flex justify-between items-center p-5 border-b border-slate-100">
              <div className="flex items-center gap-2 cursor-pointer" onClick={() => handleNavigation("/", true)}>
                <div className="relative w-8 h-8 rounded-full overflow-hidden ring-1 ring-amber-200">
                  <Image src="/photos/image.png" alt="Fleur Marwa" fill className="object-cover" />
                </div>
                <span className="font-serif italic font-bold bg-gradient-to-r from-amber-600 to-amber-500 bg-clip-text text-transparent">
                  Fleur Marwa
                </span>
              </div>
              <button onClick={() => setMobileMenuOpen(false)} className="p-2 bg-slate-50 rounded-full hover:bg-slate-100 transition">
                <X size={20} />
              </button>
            </div>

            <div className="p-4">
              <SearchBar />
            </div>

            <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
              {navItems.map(({ name, path, icon: Icon }) => {
                const active = isActive(path);
                return (
                  <button
                    key={name}
                    onClick={() => handleNavigation(path, true)}
                    className={`flex items-center gap-4 w-full p-4 rounded-xl font-display font-bold uppercase tracking-wide text-sm transition-all duration-200 ${
                      active
                        ? "bg-amber-500 text-white shadow-md"
                        : "text-slate-700 hover:bg-slate-100 hover:translate-x-1"
                    }`}
                  >
                    <Icon size={18} strokeWidth={active ? 2.5 : 1.5} />
                    {name}
                  </button>
                );
              })}
            </nav>

            <div className="p-5 border-t border-slate-100 space-y-3">
              <button
                onClick={() => {
                  if (isLoggedIn) router.push("/profile");
                  else router.push("/login");
                  setMobileMenuOpen(false);
                }}
                className="flex items-center justify-center gap-2 w-full py-2.5 bg-slate-50 rounded-xl hover:bg-slate-100 transition-all"
              >
                <User size={18} className="text-amber-600" />
                <span className="text-sm font-medium text-slate-700">{isLoggedIn ? "Profile" : "Login"}</span>
              </button>
              <button
                onClick={() => {
                  setCartDrawerOpen(true);
                  setMobileMenuOpen(false);
                }}
                className="flex items-center justify-center gap-2 w-full py-2.5 bg-slate-50 rounded-xl hover:bg-slate-100 transition-all"
              >
                <ShoppingCart size={18} className="text-amber-600" />
                <span className="text-sm font-medium text-slate-700">
                  Cart {cartCount > 0 && `(${cartCount})`}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <CartDrawer isOpen={cartDrawerOpen} onClose={() => setCartDrawerOpen(false)} />
    </header>
  );
}