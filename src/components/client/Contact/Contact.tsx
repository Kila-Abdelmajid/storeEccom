'use client'
import React, { useState } from 'react';
import { FaMapMarkerAlt, FaPhone, FaEnvelope, FaClock, FaFacebook, FaInstagram, FaWhatsapp, FaTwitter, FaPaperPlane } from 'react-icons/fa';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

 const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsSubmitting(true);

  try {
    const response = await fetch('/api/contact', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      // Ila derti Authentication (bhal NextAuth), zid userId hna
      body: JSON.stringify({
        ...formData,
        // userId: session?.user?.id || null 
      }),
    });

    const data = await response.json();

    if (response.ok) {
      setIsSubmitted(true);
      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: ''
      });
    } else {
      // Hna bach t-affichi l-error li jay men l-api (bhal "Champs manquants")
      alert(data.error || "Erreur lors de l'envoi.");
    }
  } catch (error) {
    console.error("Error:", error);
    alert("Une erreur technique est survenue.");
  } finally {
    setIsSubmitting(false);
  }
};

  const contactInfo = [
    {
      icon: <FaMapMarkerAlt className="text-xl" />,
      title: "Notre adresse",
      content: "123 Rue des Fleurs, Essaouira 44000, Maroc",
      color: "bg-blue-100 text-blue-600"
    },
    {
      icon: <FaPhone className="text-xl" />,
      title: "Numéro de téléphone",
      content: "+212 6 57 97 25 60",
      color: "bg-green-100 text-green-600"
    },
    {
      icon: <FaEnvelope className="text-xl" />,
      title: "Adresse email",
      content: "contact@fleurmarwa.com",
      color: "bg-red-100 text-red-600"
    },
    {
      icon: <FaClock className="text-xl" />,
      title: "Horaires d'ouverture",
      content: "Lun - Sam: 8h00 - 20h00\nDimanche: 9h00 - 18h00",
      color: "bg-purple-100 text-purple-600"
    }
  ];

  const socialLinks = [
    { icon: <FaFacebook />, label: "Facebook", color: "bg-blue-600 hover:bg-blue-700", href: "#" },
    { icon: <FaInstagram />, label: "Instagram", color: "bg-pink-600 hover:bg-pink-700", href: "#" },
    { icon: <FaWhatsapp />, label: "WhatsApp", color: "bg-green-600 hover:bg-green-700", href: "#" },
    { icon: <FaTwitter />, label: "Twitter", color: "bg-sky-500 hover:bg-sky-600", href: "#" }
  ];

  return (
    <section id="contact" className="section-padding bg-gradient-to-b from-white to-primary-50/30">
      <div className="container-custom">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Contactez-<span className="text-primary-600">nous</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Nous sommes là pour répondre à toutes vos questions et créer des arrangements floraux personnalisés.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact Information */}
          <div>
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-8">
                Informations de contact
              </h3>

              {/* Contact Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
                {contactInfo.map((info, index) => (
                  <div
                    key={index}
                    className="bg-gray-50 rounded-xl p-6 hover:shadow-md transition-shadow"
                  >
                    <div className={`${info.color} w-12 h-12 rounded-full flex items-center justify-center mb-4`}>
                      {info.icon}
                    </div>
                    <h4 className="font-bold text-gray-900 mb-2">{info.title}</h4>
                    <p className="text-gray-600 whitespace-pre-line">{info.content}</p>
                  </div>
                ))}
              </div>

              {/* Social Links */}
              <div>
                <h4 className="font-bold text-gray-900 mb-4">Suivez-nous</h4>
                <div className="flex space-x-4">
                  {socialLinks.map((social, index) => (
                    <a
                      key={index}
                      href={social.href}
                      className={`${social.color} w-12 h-12 rounded-full flex items-center justify-center text-white transition-transform hover:scale-110`}
                      aria-label={social.label}
                    >
                      {social.icon}
                    </a>
                  ))}
                </div>
              </div>
            </div>

            {/* Map */}
            <div className="mt-8 bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="h-64">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3401.5427317871677!2d-9.755763074634952!3d31.509250447693113!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xdad9ba2a7b84525%3A0xd28e5caa485c5fd5!2z2YXYqtis2LEg2YjYsdmI2K8g2YXYsdmI2Kk!5e0!3m2!1sar!2sma!4v1762114810842!5m2!1sar!2sma"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Localisation Fleur Marwa"
                />
              </div>
              <div className="p-6">
                <h4 className="font-bold text-gray-900 mb-2">Trouvez-nous facilement</h4>
                <p className="text-gray-600">Notre boutique est située au cœur de Essaouira, facilement accessible.</p>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-8">
              Envoyez-nous un message
            </h3>

            {isSubmitted ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <FaPaperPlane className="text-3xl" />
                </div>
                <h4 className="text-2xl font-bold text-gray-900 mb-2">Message envoyé !</h4>
                <p className="text-gray-600">
                  Merci pour votre message. Nous vous répondrons dans les plus brefs délais.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="space-y-6">
                  {/* Name & Email */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Votre nom *
                      </label>
                      <input
                        type="text"
                        name="name"
                        required
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="Votre nom complet"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Votre email *
                      </label>
                      <input
                        type="email"
                        name="email"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="votre@email.com"
                      />
                    </div>
                  </div>

                  {/* Phone & Subject */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Téléphone
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="+212 6 XX XX XX XX"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Sujet *
                      </label>
                      <select
                        name="subject"
                        required
                        value={formData.subject}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      >
                        <option value="">Sélectionnez un sujet</option>
                        <option value="commande">Commande personnalisée</option>
                        <option value="livraison">Question sur la livraison</option>
                        <option value="produit">Information produit</option>
                        <option value="evenement">Événement spécial</option>
                        <option value="autre">Autre</option>
                      </select>
                    </div>
                  </div>

                  {/* Message */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Votre message *
                    </label>
                    <textarea
                      name="message"
                      required
                      value={formData.message}
                      onChange={handleChange}
                      rows={6}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                      placeholder="Décrivez-nous votre projet ou posez-nous vos questions..."
                      maxLength={1000}
                    />
                    <div className="text-right text-sm text-gray-500 mt-1">
                      {formData.message.length}/1000 caractères
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full btn-primary py-4 flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Envoi en cours...
                        </>
                      ) : (
                        <>
                          <FaPaperPlane />
                          Envoyer le message
                        </>
                      )}
                    </button>
                  </div>

                  {/* Privacy Note */}
                  <p className="text-sm text-gray-500 text-center">
                    En soumettant ce formulaire, vous acceptez notre politique de confidentialité.
                    Nous ne partagerons jamais vos informations personnelles.
                  </p>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-16 bg-white rounded-2xl shadow-lg p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            Questions fréquentes
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                question: "Quels sont les délais de livraison ?",
                answer: "Livraison express en 24h à Essaouira. Pour les autres villes, comptez 48 à 72h."
              },
              {
                question: "Puis-je personnaliser mon bouquet ?",
                answer: "Absolument ! Nos fleuristes créent des arrangements sur mesure selon vos envies."
              },
              {
                question: "Acceptez-vous les commandes en ligne ?",
                answer: "Oui, vous pouvez commander en ligne 24h/24, 7j/7. Paiement sécurisé disponible."
              },
              {
                question: "Offrez-vous un service événementiel ?",
                answer: "Nous décorons mariages, anniversaires et événements d'entreprise. Contactez-nous pour un devis."
              }
            ].map((faq, index) => (
              <div key={index} className="border border-gray-200 rounded-xl p-6 hover:border-primary-300 transition-colors">
                <h4 className="font-bold text-gray-900 mb-3">{faq.question}</h4>
                <p className="text-gray-600">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;