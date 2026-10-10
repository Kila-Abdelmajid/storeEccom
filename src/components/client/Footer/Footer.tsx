'use client';

import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const router = useRouter();
  const pathname = usePathname();

  const handleNavigation = (e: React.MouseEvent, href: string) => {
    e.preventDefault();

    if (href.startsWith('http')) {
      window.open(href, '_blank');
      return;
    }

    if (href.includes('#')) {
      const hashIndex = href.indexOf('#');
      const hash = href.substring(hashIndex);
      const elementId = hash.slice(1);
      const element = document.getElementById(elementId);

      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
        window.history.pushState(null, '', href);
        window.dispatchEvent(new HashChangeEvent("hashchange"));
      } else {
        router.push(href);
      }
    } else if (href === '/') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      window.history.pushState(null, '', '/');
      window.dispatchEvent(new HashChangeEvent("hashchange"));
      if (pathname !== '/') {
        router.push('/');
      }
    } else {
      router.push(href);
    }
  };

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "Shop", href: "/#shop" },
    { name: "Contact", href: "/#contact" },
    { name: "Reviews", href: "/#reviews" },
  ];

  const socialLinks = [
    { name: "Facebook", href: "https://facebook.com", icon: <FacebookIcon /> },
    { name: "Instagram", href: "https://instagram.com", icon: <InstagramIcon /> },
    { name: "Twitter", href: "https://twitter.com", icon: <TwitterIcon /> },
  ];

  return (
    <footer className="bg-white/60 backdrop-blur-sm shadow-md border-t border-slate-100/50 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-3">
          
          {/* Brand Column */}
          <div className="space-y-4">
            <div 
              onClick={(e) => handleNavigation(e, '/')}
              className="flex items-center gap-2 cursor-pointer group w-fit"
            >
              <div className="relative w-10 h-10 rounded-full overflow-hidden bg-white/20 shadow-sm ring-1 ring-amber-100/30">
                <Image
                  src="/photos/image.png"
                  alt="Fleur Marwa"
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>
              <span className="text-lg font-serif italic font-bold bg-gradient-to-r from-amber-700 to-amber-500 bg-clip-text text-transparent drop-shadow-sm whitespace-nowrap">
                Fleur Marwa
              </span>
            </div>
            <p className="text-slate-600 text-sm leading-relaxed">
              Premium quality products with elegance and style. Your trusted destination for exceptional artisanal shopping.
            </p>
            <div className="flex space-x-4 pt-2">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-400 transition-all duration-200 hover:text-amber-500 hover:scale-110"
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-display font-bold text-slate-800 uppercase tracking-wider border-l-2 border-amber-500 pl-3">
              Quick Links
            </h3>
            <ul className="mt-5 space-y-3">
              {navLinks.map((link) => (
                <li key={link.name}>
                  <button
                    onClick={(e) => handleNavigation(e, link.href)}
                    className="text-slate-600 hover:text-amber-600 transition-colors duration-200 text-sm font-medium cursor-pointer bg-transparent border-none p-0 flex items-center gap-1 group"
                  >
                    <span className="w-0 h-0.5 bg-amber-500 transition-all duration-300 group-hover:w-3 rounded-full"></span>
                    {link.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-sm font-display font-bold text-slate-800 uppercase tracking-wider border-l-2 border-amber-500 pl-3">
              Contact Info
            </h3>
            <ul className="mt-5 space-y-3">
              <li className="text-slate-600 text-sm">
                à côté de Salon AL AMIRATE, Av Mohamed Bahnini,<br/>
                 Essaouira 44000, Morocco
              </li>
              <li>
                <a href="mailto:contact@fleur-marwa.com" className="text-slate-600 hover:text-amber-600 text-sm transition-colors">
                  contact@fleur-marwa.com
                </a>
              </li>
              <li>
                <a href="tel:+212657972560" className="text-slate-600 hover:text-amber-600 text-sm transition-colors">
                  +212 6 57 97 25 60
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar – Centered copyright */}
      <div className="border-t border-slate-200/60 py-6 bg-slate-50/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-slate-500 text-sm">
            &copy; {currentYear} Fleur Marwa. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

// ---------- SVG Icons ----------
function FacebookIcon() {
  return (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M22 12c0-5.523-3.657-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 1.366.062 2.633.332 3.608 1.308.976.975 1.246 2.242 1.308 3.608.058 1.266.07 1.646.07 4.85s-.012 3.584-.07 4.85c-.062 1.366-.332 2.633-1.308 3.608-.975.976-2.242 1.246-3.608 1.308-1.266.058-1.646.07-4.85.07s-3.584-.012-4.85-.07c-1.366-.062-2.633-.332-3.608-1.308-.976-.975-1.246-2.242-1.308-3.608-.058-1.266-.07-1.646-.07-4.85s.012-3.584.07-4.85c.062-1.366.332-2.633 1.308-3.608.975-.976 2.242-1.246 3.608-1.308 1.266-.058 1.646-.07 4.85-.07zm0-2.163c-3.259 0-3.667.014-4.947.072-1.352.062-2.276.27-3.085.586-.834.324-1.541.758-2.245 1.462s-1.138 1.411-1.462 2.245c-.316.809-.524 1.733-.586 3.085-.058 1.28-.072 1.688-.072 4.947s.014 3.667.072 4.947c.062 1.352.27 2.276.586 3.085.324.834.758 1.541 1.462 2.245s1.411 1.138 2.245 1.462c.809.316 1.733.524 3.085.586 1.28.058 1.688.072 4.947.072s3.667-.014 4.947-.072c1.352-.062 2.276-.27 3.085-.586.834-.324 1.541-.758 2.245-1.462s1.138-1.411 1.462-2.245c.316-.809.524-1.733.586-3.085.058-1.28.072-1.688.072-4.947s-.014-3.667-.072-4.947c-.062-1.352-.27-2.276-.586-3.085-.324-.834-.758-1.541-1.462-2.245s-1.411-1.138-2.245-1.462c-.809-.316-1.733-.524-3.085-.586-1.28-.058-1.688-.072-4.947-.072zM12 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zM18.406 4.131a1.44 1.44 0 100 2.88 1.44 1.44 0 000-2.88z" />
    </svg>
  );
}

function TwitterIcon() {
  return (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
    </svg>
  );
}