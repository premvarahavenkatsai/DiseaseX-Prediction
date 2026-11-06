import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import { FiLock, FiUser, FiEye, FiEyeOff, FiArrowRight, FiSun, FiMoon, FiCheck, FiMail } from 'react-icons/fi';

const LoginPage: React.FC = () => {
  const router = useRouter();
  const { theme, toggleTheme, accentColor } = useTheme();

  // Mode: 'login' or 'register'
  const [mode, setMode] = useState<'login' | 'register'>('login');

  // Login state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Register state
  const [regFullName, setRegFullName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regRole, setRegRole] = useState<'Doctor' | 'Researcher' | 'Patient'>('Doctor');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // If already logged in, redirect to /home
  useEffect(() => {
    if (typeof window !== 'undefined' && localStorage.getItem('diseaseX_auth') === 'true') {
      router.replace('/home');
    }
  }, [router]);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setErrorMessage('Please enter both username and password.');
      return;
    }

    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    setTimeout(() => {
      localStorage.setItem('diseaseX_auth', 'true');
      localStorage.setItem('diseaseX_user', username.trim());
      router.replace('/home');
    }, 600);
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regFullName.trim() || !regUsername.trim() || !regPassword.trim()) {
      setErrorMessage('Please fill in all required fields.');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    if (regPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('Registration successful! Logging you in...');

    setTimeout(() => {
      localStorage.setItem('diseaseX_auth', 'true');
      localStorage.setItem('diseaseX_user', regUsername.trim());
      localStorage.setItem('diseaseX_role', regRole);
      localStorage.setItem('diseaseX_fullname', regFullName.trim());
      router.replace('/home');
    }, 800);
  };

  const isDark = theme === 'dark';

  return (
    <>
      <Head>
        <title>{mode === 'login' ? 'Login' : 'Register'} — MedX Disease Portal</title>
        <meta name="description" content="Sign in or register to access MedX Disease Prediction Suite" />
      </Head>

      <div 
        className="min-h-screen flex items-center justify-center p-4 transition-colors duration-300 relative overflow-hidden"
        style={{
          backgroundColor: isDark ? '#0a0a0a' : '#f8f9fa',
          color: isDark ? '#ffffff' : '#121212'
        }}
      >
        {/* Subtle background glow */}
        <div 
          className="absolute w-96 h-96 rounded-full blur-[120px] opacity-25 pointer-events-none"
          style={{ 
            background: `radial-gradient(circle, ${accentColor}, transparent 70%)`,
            top: '20%',
            left: '50%',
            transform: 'translateX(-50%)'
          }}
        />

        {/* Top Right Theme Toggle */}
        <div className="absolute top-5 right-5 z-20">
          <button
            type="button"
            onClick={toggleTheme}
            className="w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-md border cursor-pointer"
            style={{
              backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
              borderColor: `${accentColor}30`
            }}
            aria-label="Toggle theme"
          >
            {isDark ? (
              <FiSun style={{ color: accentColor }} size={18} />
            ) : (
              <FiMoon style={{ color: accentColor }} size={18} />
            )}
          </button>
        </div>

        {/* Centered Login / Register Box */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="w-full max-w-md p-7 sm:p-9 rounded-2xl border shadow-2xl relative z-10 backdrop-blur-xl"
          style={{
            backgroundColor: isDark ? 'rgba(18, 18, 22, 0.88)' : 'rgba(255, 255, 255, 0.95)',
            borderColor: `${accentColor}40`,
            boxShadow: `0 20px 45px -15px ${accentColor}30, 0 0 20px ${accentColor}10`
          }}
        >
          {/* Logo & Heading */}
          <div className="flex flex-col items-center text-center mb-5">
            <div className="relative w-14 h-14 mb-2">
              <Image
                src="/logo.png"
                alt="MedX Logo"
                width={56}
                height={56}
                className="object-contain rounded-full shadow-lg"
              />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
              Med<span style={{ color: accentColor }}>X</span> Diagnostic Portal
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {mode === 'login' 
                ? 'Sign in to access disease prediction & clinical analysis' 
                : 'Create an account to begin clinical diagnostics'}
            </p>
          </div>

          {/* Mode Switcher Tabs: Sign In / Register */}
          <div 
            className="flex p-1 rounded-xl mb-5 border"
            style={{
              backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
              borderColor: `${accentColor}30`
            }}
          >
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setErrorMessage('');
                setSuccessMessage('');
              }}
              className="flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer"
              style={{
                backgroundColor: mode === 'login' ? accentColor : 'transparent',
                color: mode === 'login' ? '#ffffff' : undefined,
                boxShadow: mode === 'login' ? `0 2px 10px ${accentColor}40` : 'none'
              }}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setErrorMessage('');
                setSuccessMessage('');
              }}
              className="flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer"
              style={{
                backgroundColor: mode === 'register' ? accentColor : 'transparent',
                color: mode === 'register' ? '#ffffff' : undefined,
                boxShadow: mode === 'register' ? `0 2px 10px ${accentColor}40` : 'none'
              }}
            >
              Register
            </button>
          </div>

          {/* Feedback messages */}
          <AnimatePresence>
            {errorMessage && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-4 p-2.5 rounded-lg text-xs font-medium text-red-500 bg-red-500/10 border border-red-500/30 text-center"
              >
                {errorMessage}
              </motion.div>
            )}
            {successMessage && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-4 p-2.5 rounded-lg text-xs font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 text-center"
              >
                {successMessage}
              </motion.div>
            )}
          </AnimatePresence>

          {/* MODE 1: SIGN IN */}
          {mode === 'login' ? (
            <form onSubmit={handleLoginSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1 opacity-80">
                  Username or Email
                </label>
                <div className="relative">
                  <FiUser className="absolute left-3.5 top-1/2 -translate-y-1/2 opacity-50" size={16} />
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="admin"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm outline-none transition-all focus:ring-2"
                    style={{
                      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
                      borderColor: `${accentColor}40`
                    }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1 opacity-80">
                  Password
                </label>
                <div className="relative">
                  <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 opacity-50" size={16} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border text-sm outline-none transition-all focus:ring-2"
                    style={{
                      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
                      borderColor: `${accentColor}40`
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 opacity-50 hover:opacity-100 transition-opacity cursor-pointer"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                  </button>
                </div>
              </div>

              {/* Demo Hint */}
              <div className="pt-1 text-[11px] text-gray-500 text-center">
                <span>Demo credentials: </span>
                <span 
                  className="font-mono font-semibold cursor-pointer underline"
                  style={{ color: accentColor }}
                  onClick={() => {
                    setUsername('admin');
                    setPassword('admin123');
                  }}
                  title="Click to auto-fill"
                >
                  admin / admin123
                </span>
              </div>

              {/* Sign In Button */}
              <motion.button
                type="submit"
                disabled={loading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full mt-2 py-3 rounded-xl font-bold text-white text-sm tracking-wide shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
                style={{
                  backgroundColor: accentColor,
                  boxShadow: `0 8px 20px -6px ${accentColor}60`
                }}
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Signing In...
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <FiArrowRight size={16} />
                  </>
                )}
              </motion.button>

              <div className="text-center text-xs opacity-75 pt-2">
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('register');
                    setErrorMessage('');
                  }}
                  className="font-semibold underline cursor-pointer"
                  style={{ color: accentColor }}
                >
                  Register here
                </button>
              </div>
            </form>
          ) : (
            /* MODE 2: REGISTER */
            <form onSubmit={handleRegisterSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1 opacity-80">
                  Full Name
                </label>
                <div className="relative">
                  <FiUser className="absolute left-3.5 top-1/2 -translate-y-1/2 opacity-50" size={16} />
                  <input
                    type="text"
                    required
                    value={regFullName}
                    onChange={(e) => setRegFullName(e.target.value)}
                    placeholder="Dr. Rajesh Sharma"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm outline-none transition-all focus:ring-2"
                    style={{
                      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
                      borderColor: `${accentColor}40`
                    }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1 opacity-80">
                  Username or Work Email
                </label>
                <div className="relative">
                  <FiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 opacity-50" size={16} />
                  <input
                    type="text"
                    required
                    value={regUsername}
                    onChange={(e) => setRegUsername(e.target.value)}
                    placeholder="doctor@hospital.org"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm outline-none transition-all focus:ring-2"
                    style={{
                      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
                      borderColor: `${accentColor}40`
                    }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1 opacity-80">
                  Medical Role
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Doctor', 'Researcher', 'Patient'] as const).map((r) => {
                    const isSelected = regRole === r;
                    return (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setRegRole(r)}
                        className="py-1.5 px-2 rounded-lg text-xs font-semibold border transition-all text-center flex items-center justify-center gap-1 cursor-pointer"
                        style={{
                          borderColor: isSelected ? accentColor : `${accentColor}30`,
                          backgroundColor: isSelected ? `${accentColor}20` : 'transparent',
                          color: isSelected ? accentColor : undefined
                        }}
                      >
                        {isSelected && <FiCheck size={12} />}
                        {r}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1 opacity-80">
                  Password
                </label>
                <div className="relative">
                  <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 opacity-50" size={16} />
                  <input
                    type={showRegPassword ? 'text' : 'password'}
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border text-sm outline-none transition-all focus:ring-2"
                    style={{
                      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
                      borderColor: `${accentColor}40`
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPassword(!showRegPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 opacity-50 hover:opacity-100 transition-opacity cursor-pointer"
                    aria-label={showRegPassword ? 'Hide password' : 'Show password'}
                  >
                    {showRegPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1 opacity-80">
                  Confirm Password
                </label>
                <div className="relative">
                  <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 opacity-50" size={16} />
                  <input
                    type={showRegPassword ? 'text' : 'password'}
                    required
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    placeholder="Repeat password"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm outline-none transition-all focus:ring-2"
                    style={{
                      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
                      borderColor: `${accentColor}40`
                    }}
                  />
                </div>
              </div>

              {/* Create Account Button */}
              <motion.button
                type="submit"
                disabled={loading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full mt-3 py-3 rounded-xl font-bold text-white text-sm tracking-wide shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
                style={{
                  backgroundColor: accentColor,
                  boxShadow: `0 8px 20px -6px ${accentColor}60`
                }}
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  <>
                    <span>Create Account & Sign In</span>
                    <FiArrowRight size={16} />
                  </>
                )}
              </motion.button>

              <div className="text-center text-xs opacity-75 pt-1">
                Already registered?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setErrorMessage('');
                  }}
                  className="font-semibold underline cursor-pointer"
                  style={{ color: accentColor }}
                >
                  Sign in here
                </button>
              </div>
            </form>
          )}
        </motion.div>
      </div>
    </>
  );
};

export default LoginPage;
