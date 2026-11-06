import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { HexColorPicker } from 'react-colorful';
import { FiHome, FiHeart, FiDroplet, FiCrosshair, FiThermometer, FiSun, FiMenu, FiX, FiSettings, FiInfo, FiMoon, FiGlobe } from 'react-icons/fi';
import { RiVirusFill, RiDoorOpenLine } from 'react-icons/ri';
import { useRouter } from 'next/router';

const navItems = [
  { name: 'Home', href: '/home', icon: <FiHome /> },
  { name: 'Symptoms', href: '/symptom', icon: <RiVirusFill /> },
  { name: 'Heart', href: '/heart', icon: <FiHeart /> },
  { name: 'Liver', href: '/liver', icon: <FiDroplet /> },
  { name: 'Diabetes', href: '/diabetes', icon: <FiThermometer /> },
  { name: 'Skin', href: '/skin', icon: <FiSun /> },
  { name: 'Breast', href: '/breast', icon: <FiCrosshair /> },
  { name: 'About', href: '/about', icon: <FiInfo /> },
];

const LANGUAGES = [
  { code: 'en', label: 'English',   native: 'English' },
  { code: 'te', label: 'Telugu',    native: 'తెలుగు' },
  { code: 'hi', label: 'Hindi',     native: 'हिंदी' },
  { code: 'ta', label: 'Tamil',     native: 'தமிழ்' },
  { code: 'kn', label: 'Kannada',   native: 'ಕನ್ನಡ' },
  { code: 'mr', label: 'Marathi',   native: 'मराठी' },
  { code: 'bn', label: 'Bengali',   native: 'বাংলা' },
  { code: 'ur', label: 'Urdu',      native: 'اردو' },
  { code: 'ml', label: 'Malayalam', native: 'മലയാളം' },
  { code: 'gu', label: 'Gujarati',  native: 'ગુજરાતી' },
];

const Navbar: React.FC = () => {
  const { theme, toggleTheme, accentColor, setAccentColor } = useTheme();
  const [scrolled, setScrolled] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [visible, setVisible] = useState(true);
  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [language, setLanguage] = useState('en');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const colorPickerRef = useRef<HTMLDivElement>(null);
  const langMenuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('diseaseX_auth');
      localStorage.removeItem('diseaseX_user');
      router.replace('/login');
    }
  };

  const selectedLang = LANGUAGES.find(l => l.code === language) || LANGUAGES[0];

  // Predefined color options
  const colorOptions = [
    '#FF8C00', // Vivid Orange
    '#FFD700', // Bold Yellow (Gold)
    '#1E90FF', // Vivid Blue
    '#8A2BE2', // Electric Purple
    '#39FF14', // Neon Green
    '#FF1493', // Hot Pink
    '#00FFEF', // Cyan Glow
    '#FF0000'  // Vibrant Orange
  ];
  

  // Handle scroll events to show/hide navbar
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Show navbar when scrolling up, hide when scrolling down
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setVisible(false);
      } else {
        setVisible(true);
      }
      
      // Add background when scrolled
      if (currentScrollY > 50) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
      
      setLastScrollY(currentScrollY);
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  // Close mobile menu when changing routes
  useEffect(() => {
    const handleRouteChange = () => {
      setMobileMenuOpen(false);
    };
    
    // Listen for route changes
    window.addEventListener('popstate', handleRouteChange);
    
    return () => {
      window.removeEventListener('popstate', handleRouteChange);
    };
  }, []);
  
  // Load saved language from localStorage on mount and apply Google Translate cookie
  useEffect(() => {
    const saved = localStorage.getItem('dx-language');
    if (saved && LANGUAGES.find(l => l.code === saved)) {
      setLanguage(saved);
      if (saved !== 'en') {
        const hostname = window.location.hostname;
        document.cookie = `googtrans=/en/${saved}; path=/;`;
        document.cookie = `googtrans=/en/${saved}; path=/; domain=${hostname};`;
        setTimeout(() => {
          const select = document.querySelector('.goog-te-combo') as HTMLSelectElement | null;
          if (select) {
            select.value = saved;
            select.dispatchEvent(new Event('change', { bubbles: true }));
          }
        }, 500);
      }
    }
  }, []);

  const handleLanguageChange = (langCode: string) => {
    setLanguage(langCode);
    setLangMenuOpen(false);
    localStorage.setItem('dx-language', langCode);

    // Set Google Translate cookies
    const hostname = window.location.hostname;
    const cookieVal = langCode === 'en' ? '/en/en' : `/en/${langCode}`;
    document.cookie = `googtrans=${cookieVal}; path=/;`;
    document.cookie = `googtrans=${cookieVal}; path=/; domain=${hostname};`;
    if (langCode === 'en') {
      document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${hostname};`;
    }

    // Trigger Google Translate combo element with proper selectedIndex
    const select = document.querySelector('.goog-te-combo') as HTMLSelectElement | null;
    if (select) {
      let matched = false;
      for (let i = 0; i < select.options.length; i++) {
        if (select.options[i].value.toLowerCase() === langCode.toLowerCase()) {
          select.selectedIndex = i;
          select.value = select.options[i].value;
          matched = true;
          break;
        }
      }
      select.dispatchEvent(new Event('change', { bubbles: true }));
      if (typeof (select as any).onchange === 'function') {
        (select as any).onchange();
      }
      if (!matched) {
        window.location.reload();
      }
    } else {
      setTimeout(() => {
        window.location.reload();
      }, 150);
    }
  };

  // Persist language to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('dx-language', language);
    // Set html lang attribute for accessibility
    document.documentElement.lang = language;
  }, [language]);

  // Close color picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (colorPickerRef.current && !colorPickerRef.current.contains(event.target as Node)) {
        setColorPickerOpen(false);
      }
    };
    
    // Close color picker on scroll
    const handleScroll = () => {
      if (colorPickerOpen) {
        setColorPickerOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [colorPickerOpen]);

  // Close language menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (langMenuRef.current && !langMenuRef.current.contains(event.target as Node)) {
        setLangMenuOpen(false);
      }
    };
    const handleScroll = () => { if (langMenuOpen) setLangMenuOpen(false); };
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [langMenuOpen]);

  return (
    <motion.header
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
        scrolled 
          ? theme === 'dark' 
            ? 'bg-black/90 backdrop-blur-md shadow-lg' 
            : 'bg-white/90 backdrop-blur-md shadow-lg'
          : theme === 'dark' ? 'bg-black/50 backdrop-blur-sm' : 'bg-white/50 backdrop-blur-sm'
      }`}
      initial={{ y: -100 }}
      animate={{ y: visible ? 0 : -100 }}
      transition={{ duration: 0.3 }}
      style={{ borderBottom: `1px solid ${accentColor}30` }}
    >
      <style jsx global>{`
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .navbar-container {
          max-width: 100%;
          overflow-x: hidden;
        }
        .mobile-menu {
          background: ${theme === 'dark' ? 'rgba(25, 25, 35, 0.1)' : 'rgba(245, 245, 250, 0.1)'} !important;
          -webkit-backdrop-filter: blur(12px) saturate(120%) !important;
          backdrop-filter: blur(12px) saturate(120%) !important;
          box-shadow: 0 8px 32px 0 ${theme === 'dark' ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.05)'} !important;
          border: 1px solid ${theme === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)'} !important;
          color: ${theme === 'dark' ? 'rgba(255, 255, 255, 0.95)' : 'rgba(0, 0, 0, 0.95)'} !important;
          position: relative;
          z-index: 1000;
          transform: translateZ(0);
          -webkit-transform: translateZ(0);
          will-change: transform, backdrop-filter, -webkit-backdrop-filter;
        }
      `}</style>
      <div className="container mx-auto px-1 sm:px-2 md:px-4 py-2 flex justify-between items-center navbar-container">
        {/* Logo */}
        <motion.div 
          className="flex items-center shrink-0"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Link href="/" passHref>
            <div 
              className="relative font-medium cursor-pointer flex items-center gap-1"
              style={{ color: accentColor }}
            >
              <div className="relative w-16 h-16">
                <Image
                  src="/logo.png"
                  alt="MedX Logo"
                  width={164}
                  height={164}
                  className="object-contain mt-3 ml-2 rounded-full"
                />
              </div>
              <span className="text-base sm:text-lg md:text-xl font-bold">Med</span>
              <div 
                className="h-1.5 w-1.5 rounded-full animate-pulse"
                style={{ backgroundColor: accentColor }}
              />
            </div>
          </Link>
        </motion.div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-3 lg:space-x-6 overflow-x-auto no-scrollbar">
          {navItems.map((item) => (
            <motion.div
              key={item.name}
              whileHover={{ y: -2 }}
              transition={{ type: 'spring', stiffness: 300 }}
              className="shrink-0"
            >
              <Link href={item.href} passHref>
                <div className={`relative text-xs lg:text-sm font-medium group cursor-pointer flex items-center gap-1 lg:gap-2 ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
                  <div 
                    className="w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ 
                      backgroundColor: `${accentColor}15`,
                      border: `1px solid ${accentColor}30`
                    }}
                  >
                    <span className="text-xl" style={{ color: accentColor }}>{item.icon}</span>
                  </div>
                  <span className="hidden lg:inline">{item.name}</span>
                  <span 
                    className="absolute -bottom-1 left-0 w-0 h-0.5 group-hover:w-full transition-all duration-300"
                    style={{ backgroundColor: accentColor }}
                  />
                </div>
              </Link>
            </motion.div>
          ))}
        </nav>

        {/* Control Buttons */}
        <div className="flex items-center space-x-1.5 sm:space-x-2 md:space-x-3">
          {/* Small Open Door Logout Button */}
          <motion.button
            onClick={handleLogout}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            className="flex items-center justify-center transition-all cursor-pointer"
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: theme === 'dark' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              boxShadow: '0 0 10px rgba(239, 68, 68, 0.15)'
            }}
            aria-label="Logout"
            title="Log Out"
          >
            <RiDoorOpenLine size={18} className="text-red-400 hover:text-red-300 transition-colors" />
          </motion.button>

          <div className="flex items-center gap-1 sm:gap-2">
            <motion.button
              onClick={toggleTheme}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="md:flex items-center justify-center"
              style={{ 
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                border: `1px solid ${accentColor}30`
              }}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <FiSun style={{ color: accentColor }} size={18} />
              ) : (
                <FiMoon style={{ color: accentColor }} size={18} />
              )}
            </motion.button>

          {/* Language Selector */}
            <div className="relative" style={{ zIndex: 60 }} ref={langMenuRef}>
              <motion.button
                onClick={() => { setLangMenuOpen(!langMenuOpen); setColorPickerOpen(false); }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center justify-center"
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  backgroundColor: langMenuOpen
                    ? `${accentColor}20`
                    : theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
                  border: `1px solid ${langMenuOpen ? accentColor : `${accentColor}50`}`,
                  boxShadow: langMenuOpen ? `0 0 8px ${accentColor}40` : `0 0 8px ${accentColor}20`
                }}
                aria-label="Select language"
                title={selectedLang.native}
              >
                <FiGlobe style={{ color: accentColor }} size={16} />
              </motion.button>

              <AnimatePresence>
                {langMenuOpen && (
                  <motion.div
                    className="fixed rounded-xl shadow-2xl z-[100] overflow-hidden"
                    initial={{ opacity: 0, scale: 0.95, y: -8 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -8 }}
                    transition={{ duration: 0.2 }}
                    style={{
                      backdropFilter: 'blur(14px)',
                      backgroundColor: theme === 'dark' ? 'rgba(10,10,18,0.85)' : 'rgba(255,255,255,0.88)',
                      boxShadow: `0 12px 32px rgba(0,0,0,0.25), 0 0 12px ${accentColor}20`,
                      border: `1px solid ${accentColor}30`,
                      width: '185px',
                      top: '60px',
                      right: '54px'
                    }}
                  >
                    <div className="px-3 py-2 border-b" style={{ borderColor: `${accentColor}20` }}>
                      <p className="text-xs font-semibold uppercase tracking-widest"
                        style={{ color: accentColor }}>
                        🌐 Language
                      </p>
                    </div>
                    <ul className="py-1 max-h-72 overflow-y-auto">
                      {LANGUAGES.map((lang) => (
                        <li key={lang.code}>
                          <button
                            onClick={() => handleLanguageChange(lang.code)}
                            className="w-full flex items-center justify-between px-3 py-2 text-sm transition-colors duration-150"
                            style={{
                              color: language === lang.code
                                ? accentColor
                                : theme === 'dark' ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.85)',
                              backgroundColor: language === lang.code
                                ? `${accentColor}15`
                                : 'transparent'
                            }}
                            onMouseEnter={e => {
                              (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                                language === lang.code ? `${accentColor}20` : (theme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)');
                            }}
                            onMouseLeave={e => {
                              (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                                language === lang.code ? `${accentColor}15` : 'transparent';
                            }}
                          >
                            <span>{lang.native}</span>
                            {language === lang.code && (
                              <span className="text-xs" style={{ color: accentColor }}>✓</span>
                            )}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Color / Theme Picker */}
            <div className="relative" style={{ zIndex: 60 }}>
              <motion.button
                onClick={() => setColorPickerOpen(!colorPickerOpen)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center justify-center md:flex hidden"
                style={{ 
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  backgroundColor: colorPickerOpen 
                    ? `${accentColor}20` 
                    : theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                  border: `1px solid ${colorPickerOpen ? accentColor : `${accentColor}50`}`,
                  boxShadow: colorPickerOpen ? `0 0 8px ${accentColor}40` : `0 0 8px ${accentColor}30`
                }}
                aria-label="Change accent color"
              >
                <motion.div
                  animate={{ rotate: colorPickerOpen ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <FiSettings style={{ color: accentColor }} size={16} />
                </motion.div>
              </motion.button>
              <motion.button
                onClick={() => setColorPickerOpen(!colorPickerOpen)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center justify-center md:hidden flex"
                style={{ 
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: colorPickerOpen 
                    ? `${accentColor}20` 
                    : theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                  border: `1px solid ${colorPickerOpen ? accentColor : `${accentColor}50`}`,
                  boxShadow: colorPickerOpen ? `0 0 8px ${accentColor}40` : `0 0 8px ${accentColor}30`
                }}
                aria-label="Change accent color"
              >
                <motion.div
                  animate={{ rotate: colorPickerOpen ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <FiSettings style={{ color: accentColor }} size={14} />
                </motion.div>
              </motion.button>
              <AnimatePresence>
                {colorPickerOpen && (
                  <motion.div 
                    ref={colorPickerRef}
                    className="fixed p-4 rounded-lg shadow-xl z-[100]"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3 }}
                    style={{ 
                      backdropFilter: 'blur(10px)',
                      backgroundColor: theme === 'dark' ? 'rgba(10, 10, 15, 0.8)' : 'rgba(255, 255, 255, 0.8)',
                      boxShadow: `0 10px 25px rgba(0,0,0,0.2), 0 0 10px ${accentColor}20`,
                      border: `1px solid ${accentColor}30`,
                      width: '220px',
                      top: '60px',
                      right: '10px'
                    }}
                  >
                    <div className="mb-4">
                      <HexColorPicker color={accentColor} onChange={setAccentColor} />
                    </div>
                    <div className="flex flex-wrap gap-2 justify-center">
                      <p className="text-xs w-full text-center mb-1" style={{ color: theme === 'dark' ? 'white' : 'black' }}>
                        Choose a color
                      </p>
                      {colorOptions.map((color) => (
                        <motion.button
                          key={color}
                          className="w-8 h-8 rounded-full border-2"
                          style={{ 
                            backgroundColor: color,
                            borderColor: color === accentColor ? 'white' : 'transparent',
                            boxShadow: color === accentColor ? `0 0 10px ${color}` : 'none'
                          }}
                          onClick={() => {
                            setAccentColor(color);
                            setColorPickerOpen(false);
                          }}
                          whileHover={{ scale: 1.2, boxShadow: `0 0 15px ${color}` }}
                          whileTap={{ scale: 0.9 }}
                        />
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </motion.header>
  );
};

export default Navbar;
