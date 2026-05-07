'use client';

import { useRouter } from "next/navigation";

/**
 * E-commerce Footer Component
 * Optimized for Mobile Navigation and Smooth Scrolling
 */
export default function Footer() {
  const currentYear = new Date().getFullYear();
  const router = useRouter();

  // Logic dyal navigation bach t-solve l-mouchkil f mobile
  const handleNavigation = (e: React.MouseEvent, href: string) => {
    // Ila kan link khariji (bhal Facebook), khallih i-kheddem 3adi
    if (href.startsWith('http')) return;

    e.preventDefault();

    // Ila kanti f l-Home page w bghiti t-scroller l-chi section (#)
    if (href.startsWith('/#')) {
      const id = href.replace('/#', '');
      const element = document.getElementById(id);
      
      if (element) {
        // Ila l-element dejà f l-paja, scroll lih smooth
        element.scrollIntoView({ behavior: 'smooth' });
      } else {
        // Ila kanti f paja khera, sir l-home page + l-anchor
        router.push(href);
      }
    } else {
      // Navigation l-pajat khrin (Home, Privacy, etc.)
      router.push(href);
    }
  };

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "Shop", href: "/#shop" },
    { name: "Contact", href: "/#contact" },
    { name: "About", href: "/#about" },
    { name: "Our Team", href: "/#our-team" },
  ];

  const socialLinks = [
    { name: "Facebook", href: "https://facebook.com", icon: <FacebookIcon /> },
    { name: "Twitter", href: "https://twitter.com", icon: <TwitterIcon /> },
    { name: "Instagram", href: "https://instagram.com", icon: <InstagramIcon /> },
    { name: "LinkedIn", href: "https://linkedin.com", icon: <LinkedInIcon /> },
  ];

  return (
    <footer className="bg-white border-t border-neutral-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          
          {/* Brand Column */}
          <div className="space-y-4">
            <button onClick={(e) => handleNavigation(e, '/')} className="inline-block bg-transparent border-none p-0 cursor-pointer">
              <span className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                ShopEase
              </span>
            </button>
            <p className="text-neutral-600 text-sm leading-relaxed">
              Your one-stop destination for quality products and exceptional shopping experience.
            </p>
            <div className="flex space-x-4">
              {socialLinks.map((social) => (
                <a key={social.name} href={social.href} target="_blank" rel="noopener noreferrer" className="text-neutral-400 hover:text-indigo-600 transition-colors duration-200">
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links Column - UPDATED FOR MOBILE */}
          <div>
            <h3 className="text-sm font-semibold text-neutral-900 uppercase tracking-wider">
              Quick Links
            </h3>
            <ul className="mt-4 space-y-3">
              {navLinks.map((link) => (
                <li key={link.name}>
                  <button
                    onClick={(e) => handleNavigation(e, link.href)}
                    className="text-neutral-600 hover:text-indigo-600 transition-colors duration-200 text-sm cursor-pointer border-none bg-transparent p-0 text-left w-full block py-1"
                  >
                    {link.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info Column */}
          <div>
            <h3 className="text-sm font-semibold text-neutral-900 uppercase tracking-wider">
              Contact Info
            </h3>
            <ul className="mt-4 space-y-3">
              <li className="flex items-start space-x-3 text-neutral-600 text-sm">
                <span>123 E-commerce Street, NY 10001</span>
              </li>
              <li>
                <a href="mailto:hello@ecomstore.com" className="text-neutral-600 hover:text-indigo-600 text-sm transition-colors">
                  hello@ecomstore.com
                </a>
              </li>
            </ul>
          </div>

          {/* Newsletter Section */}
          <div>
            <h3 className="text-sm font-semibold text-neutral-900 uppercase tracking-wider">
              Stay Updated
            </h3>
            <form className="mt-4 flex flex-col gap-2" onSubmit={(e) => e.preventDefault()}>
              <input
                type="email"
                placeholder="Enter your email"
                className="px-4 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              />
              <button className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors">
                Subscribe
              </button>
            </form>
          </div>

        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-neutral-200 py-6">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-neutral-500 text-sm">
            &copy; {currentYear} ShopEase. All rights reserved.
          </p>
          <div className="flex space-x-6">
            <button onClick={(e) => handleNavigation(e, '/privacy')} className="text-neutral-500 hover:text-indigo-600 text-sm">Privacy</button>
            <button onClick={(e) => handleNavigation(e, '/terms')} className="text-neutral-500 hover:text-indigo-600 text-sm">Terms</button>
          </div>
        </div>
      </div>
    </footer>
  );
}

// Icons (Ghir Icons li kanti m-st3mel f code dyalk)
function FacebookIcon() { return <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"/></svg>; }
function TwitterIcon() { return <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84"/></svg>; }
function InstagramIcon() { return <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 1.366.062 2.633.332 3.608 1.308 1.366.062 2.633.332 3.608 1.308.976.975 1.246 2.242 1.308 3.608.058 1.266.07 1.646.07 4.85s-.012 3.584-.07 4.85c-.062 1.366-.332 2.633-1.308 3.608-.975.976-2.242 1.246-3.608 1.308-1.266.058-1.646.07-4.85.07s-3.584-.012-4.85-.07c-1.366-.062-2.633-.332-3.608-1.308-.976-.975-1.246-2.242-1.308-3.608-.058-1.266-.07-1.646-.07-4.85s.012-3.584.07-4.85c.062-1.366.332-2.633 1.308-3.608.975-.976 2.242-1.246 3.608-1.308 1.266-.058 1.646-.07 4.85-.07zm0-2.163c-3.259 0-3.667.014-4.947.072-1.352.062-2.276.27-3.085.586-.834.324-1.541.758-2.245 1.462s-1.138 1.411-1.462 2.245c-.316.809-.524 1.733-.586 3.085-.058 1.28-.072 1.688-.072 4.947s.014 3.667.072 4.947c.062 1.352.27 2.276.586 3.085.324.834.758 1.541 1.462 2.245s1.411 1.138 2.245 1.462c.809.316 1.733.524 3.085.586 1.28.058 1.688.072 4.947.072s3.667-.014 4.947-.072c1.352-.062 2.276-.27 3.085-.586.834-.324 1.541-.758 2.245-1.462s1.138-1.411 1.462-2.245c.316-.809.524-1.733.586-3.085.058-1.28.072-1.688.072-4.947s-.014-3.667-.072-4.947c-.062-1.352-.27-2.276-.586-3.085-.324-.834-.758-1.541-1.462-2.245s-1.411-1.138-2.245-1.462c-.809-.316-1.733-.524-3.085-.586-1.28-.058-1.688-.072-4.947-.072zM12 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zM18.406 4.131a1.44 1.44 0 100 2.88 1.44 1.44 0 000-2.88z"/></svg>; }
function LinkedInIcon() { return <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>; }