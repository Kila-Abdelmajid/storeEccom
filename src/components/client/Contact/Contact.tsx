'use client';

import React, { useState } from 'react';
import { FaMapMarkerAlt, FaPhone, FaEnvelope, FaClock, FaFacebook, FaInstagram, FaWhatsapp, FaTwitter, FaPaperPlane, FaCheckCircle, FaExclamationCircle } from 'react-icons/fa';

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setToast(null);

    try {
      const res = await fetch('/api/ClientApi/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send');

      setToast({ type: 'success', message: 'Message sent successfully! We’ll reply soon.' });
      setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
    } catch (err: any) {
      setToast({ type: 'error', message: err.message || 'Something went wrong. Please try again.' });
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setToast(null), 5000);
    }
  };

  const contactInfo = [
    { icon: <FaMapMarkerAlt />, title: 'Our Address', content: 'à côté de Salon AL AMIRATE, Av Mohamed Bahnini, Essaouira 44000, Morocco', color: 'from-blue-500 to-blue-600' },
    { icon: <FaPhone />, title: 'Phone', content: '+212 6 57 97 25 60', color: 'from-green-500 to-green-600' },
    { icon: <FaEnvelope />, title: 'Email', content: 'fleurMarwa@gmail.com', color: 'from-red-500 to-red-600' },
    { icon: <FaClock />, title: 'Opening Hours', content: 'Mon - Sat: 8am – 8pm\nSunday: 9am – 6pm', color: 'from-purple-500 to-purple-600' },
  ];

  return (
    <section className="py-20 bg-gradient-to-br from-slate-50 via-white to-slate-100/60 overflow-hidden">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header – same style as product section */}
        <div className="text-center mb-16">
          <span className="inline-block px-5 py-1.5 mb-6 text-[11px] font-bold tracking-[0.3em] uppercase bg-white/80 text-amber-600 rounded-full border border-amber-200/50 shadow-sm backdrop-blur-sm">
            Get in Touch
          </span>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-light text-gray-900 mb-4 tracking-tight">
            Contact{' '}
            <span className="font-serif italic bg-gradient-to-r from-amber-600 to-amber-500 bg-clip-text text-transparent">
              Us
            </span>
          </h2>
          <div className="w-20 h-px bg-gradient-to-r from-transparent via-amber-400 to-transparent mx-auto" />
          <p className="text-gray-500 mt-6 max-w-md mx-auto text-sm">
            We’re here to answer your questions and create bespoke floral arrangements.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Left Side – Info & Map */}
          <div>
            {/* Contact Information – glass cards */}
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 border border-white/50 p-6 md:p-8">
              <h3 className="text-2xl font-light text-gray-800 mb-6">Contact Information</h3>
              <div className="grid sm:grid-cols-2 gap-6 mb-8">
                {contactInfo.map((item, idx) => (
                  <div key={idx} className="flex gap-4 items-start p-4 rounded-xl bg-white/50 hover:shadow-md transition border border-white/50">
                    <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${item.color} flex items-center justify-center text-white text-xl shadow-md`}>
                      {item.icon}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800">{item.title}</h4>
                      <p className="text-gray-600 text-sm whitespace-pre-line">{item.content}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div>
                <h4 className="font-semibold text-gray-800 mb-3">Follow Us</h4>
                <div className="flex gap-3">
                  {[
                    { icon: <FaFacebook />, href: '#', bg: 'bg-blue-700' },
                    { icon: <FaInstagram />, href: '#', bg: 'bg-pink-600' },
                    { icon: <FaWhatsapp />, href: '#', bg: 'bg-green-600' },
                    { icon: <FaTwitter />, href: '#', bg: 'bg-sky-500' },
                  ].map((social, i) => (
                    <a
                      key={i}
                      href={social.href}
                      className={`w-10 h-10 rounded-full ${social.bg} flex items-center justify-center text-white hover:scale-110 transition duration-300 shadow-md`}
                    >
                      {social.icon}
                    </a>
                  ))}
                </div>
              </div>
            </div>

            {/* Map – glass card */}
            <div className="mt-8 bg-white/60 backdrop-blur-sm rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 border border-white/50 overflow-hidden">
              <div className="h-64 w-full">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3401.5427317871677!2d-9.755763074634952!3d31.509250447693113!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xdad9ba2a7b84525%3A0xd28e5caa485c5fd5!2z2YXYqtis2LEg2YjYsdmI2K8g2YXYsdmI2Kk!5e0!3m2!1sar!2sma!4v1762114810842!5m2!1sar!2sma"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  title="Location"
                />
              </div>
              <div className="p-5">
                <h4 className="font-semibold text-gray-800">Find us easily</h4>
                <p className="text-gray-600 text-sm">Our shop is centrally located in Essaouira, easy to reach.</p>
              </div>
            </div>
          </div>

          {/* Right Side – Contact Form (glass card) */}
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 border border-white/50 p-6 md:p-8">
            <h3 className="text-2xl font-light text-gray-800 mb-6">Send us a message</h3>
            {toast && (
              <div
                className={`mb-6 p-4 rounded-xl flex items-center gap-3 ${
                  toast.type === 'success'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                }`}
              >
                {toast.type === 'success' ? <FaCheckCircle className="w-5 h-5" /> : <FaExclamationCircle className="w-5 h-5" />}
                <span className="text-sm">{toast.message}</span>
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full name *</label>
                  <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-300 focus:border-amber-300 transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-300 focus:border-amber-300 transition"
                  />
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-300 focus:border-amber-300 transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subject *</label>
                  <select
                    name="subject"
                    required
                    value={formData.subject}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-300 focus:border-amber-300 transition"
                  >
                    <option value="">Select a subject</option>
                    <option value="Custom Order">Custom Order</option>
                    <option value="Delivery Question">Delivery Question</option>
                    <option value="Product Info">Product Info</option>
                    <option value="Special Event">Special Event</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message *</label>
                <textarea
                  name="message"
                  rows={5}
                  required
                  value={formData.message}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-white/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-300 focus:border-amber-300 transition resize-none"
                  placeholder="Tell us about your project or any questions..."
                  maxLength={1000}
                />
                <div className="text-right text-xs text-gray-400 mt-1">{formData.message.length}/1000</div>
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-white font-bold text-lg shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <FaPaperPlane />
                )}
                {isSubmitting ? 'Sending...' : 'Send Message'}
              </button>
              <p className="text-xs text-gray-400 text-center">By submitting, you accept our privacy policy. We never share your data.</p>
            </form>
          </div>
        </div>

        {/* FAQ Section – glass cards */}
        <div className="mt-16 bg-white/60 backdrop-blur-sm rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 border border-white/50 p-8">
          <h3 className="text-2xl font-light text-gray-800 text-center mb-8">Frequently Asked Questions</h3>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              { q: 'What are delivery times?', a: 'Express delivery within 24h in Essaouira. Other cities: 48–72h.' },
              { q: 'Can I personalize my bouquet?', a: 'Absolutely! Our florists create custom arrangements based on your wishes.' },
              { q: 'Do you accept online orders?', a: 'Yes, online orders 24/7.' },
              { q: 'Do you offer event services?', a: 'We decorate weddings, birthdays, and corporate events. Contact us for a quote.' },
            ].map((faq, i) => (
              <div key={i} className="border border-white/50 rounded-xl p-5 hover:shadow-md transition bg-white/30">
                <h4 className="font-semibold text-gray-800 mb-2">{faq.q}</h4>
                <p className="text-gray-600 text-sm">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}