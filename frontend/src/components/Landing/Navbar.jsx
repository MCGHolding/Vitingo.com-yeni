import React, { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setIsMobileMenuOpen(false);
    }
  };

  const navLinks = [
    { name: 'Özellikler', id: 'features' },
    { name: 'Fiyatlar', id: 'pricing' },
    { name: 'Giriş Yap', href: '/' },
    { name: 'Ultra Admin', href: '#' }
  ];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-white shadow-lg py-4'
          : 'bg-transparent py-6'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <a
              href="/landing"
              className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600"
            >
              Vitingo CRM
            </a>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link, index) => {
              if (link.id) {
                return (
                  <button
                    key={index}
                    onClick={() => scrollToSection(link.id)}
                    className={`text-base font-medium transition-colors ${
                      isScrolled
                        ? 'text-gray-700 hover:text-blue-600'
                        : 'text-gray-700 hover:text-blue-600'
                    }`}
                  >
                    {link.name}
                  </button>
                );
              } else {
                return (
                  <a
                    key={index}
                    href={link.href}
                    className={`text-base font-medium transition-colors ${
                      isScrolled
                        ? 'text-gray-700 hover:text-blue-600'
                        : 'text-gray-700 hover:text-blue-600'
                    }`}
                  >
                    {link.name}
                  </a>
                );
              }
            })}

            {/* CTA Button */}
            <a
              href="/"
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:shadow-lg hover:scale-105 transition-all duration-300"
            >
              Başlayın
            </a>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden mt-4 py-4 bg-white rounded-lg shadow-lg">
            <div className="flex flex-col space-y-4 px-4">
              {navLinks.map((link, index) => {
                if (link.id) {
                  return (
                    <button
                      key={index}
                      onClick={() => scrollToSection(link.id)}
                      className="text-left text-base font-medium text-gray-700 hover:text-blue-600 transition-colors py-2"
                    >
                      {link.name}
                    </button>
                  );
                } else {
                  return (
                    <a
                      key={index}
                      href={link.href}
                      className="text-base font-medium text-gray-700 hover:text-blue-600 transition-colors py-2"
                    >
                      {link.name}
                    </a>
                  );
                }
              })}
              <a
                href="/"
                className="text-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all duration-300"
              >
                Başlayın
              </a>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
