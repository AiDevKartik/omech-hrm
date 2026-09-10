/**
 * Authentication & Login View
 * Industrial Factory terminal design with 1-click persona switchers for rapid prototype testing
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useTheme } from '../../context/ThemeContext';
import { STRINGS } from '../../constants/strings';
import {
  Factory,
  Shield,
  HardHat,
  Users,
  LogIn,
  KeyRound,
  ArrowRight,
  Sun,
  Moon,
} from 'lucide-react';

export function LoginView() {
  const { login, switchUser, session } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { error, success } = useToast();
  const navigate = useNavigate();

  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [isLoading, setIsLoading] = useState(false);

  // If already authenticated or just switched, redirect to dashboard
  useEffect(() => {
    if (session) {
      navigate('/', { replace: true });
    }
  }, [session, navigate]);

  const handleCustomLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await login(username, true);
      success(`Logged in as ${username}`);
      navigate('/', { replace: true });
    } catch (err: any) {
      error(err.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickPersona = async (roleName: 'admin' | 'supervisor' | 'worker') => {
    setIsLoading(true);
    try {
      if (roleName === 'admin') {
        await switchUser(1, 'admin');
      } else if (roleName === 'supervisor') {
        await switchUser(2, 'supervisor');
      } else {
        await switchUser(7, 'worker');
      }
      success(`Switched role to ${roleName.toUpperCase()}`);
      navigate('/', { replace: true });
    } catch (err: any) {
      error(err.message || 'Failed to switch persona');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-950 flex flex-col items-center justify-center p-4 relative">
      {/* Light / Dark Mode Toggle on Login Screen */}
      <div className="absolute top-4 right-4">
        <button
          onClick={toggleTheme}
          type="button"
          className="flex items-center gap-2 px-3 py-1.5 bg-stone-900 hover:bg-stone-800 border border-stone-800 text-xs text-stone-300 transition-colors shadow-md"
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          aria-label="Toggle Theme"
        >
          {theme === 'dark' ? (
            <>
              <Sun className="w-3.5 h-3.5 text-amber-400" />
              <span className="font-mono text-xs">Light Mode</span>
            </>
          ) : (
            <>
              <Moon className="w-3.5 h-3.5 text-blue-500" />
              <span className="font-mono text-xs">Dark Mode</span>
            </>
          )}
        </button>
      </div>

      {/* Industrial Brand Frame */}
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-amber-500 text-stone-950 font-bold mb-2 shadow-lg">
            <Factory className="w-7 h-7" />
          </div>
          <h1 className="font-display font-bold text-2xl text-stone-100 uppercase tracking-tight">
            {STRINGS.APP_NAME}
          </h1>
          <p className="text-xs text-stone-400 font-mono">
            {STRINGS.COMPANY_NAME} • Factory Terminal
          </p>
        </div>

        {/* 1-Click Quick Access Persona Switcher */}
        <div className="bg-stone-900 border border-stone-800 p-4 space-y-3">
          <div className="text-[11px] font-mono text-amber-400 uppercase tracking-wider font-semibold flex items-center gap-1.5">
            <KeyRound className="w-3.5 h-3.5" />
            <span>1-Click Persona Demo Access</span>
          </div>

          <div className="grid grid-cols-1 gap-2">
            <button
              onClick={() => handleQuickPersona('admin')}
              className="p-2.5 bg-stone-950 hover:bg-stone-800 border border-stone-800 hover:border-amber-500/50 flex items-center justify-between text-left transition group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/30">
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-stone-200 group-hover:text-amber-400">
                    Plant HR & Operations Admin
                  </div>
                  <div className="text-[10px] text-stone-500 font-mono">Full Payroll, Rules, & Reports</div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-stone-600 group-hover:text-amber-400" />
            </button>

            <button
              onClick={() => handleQuickPersona('supervisor')}
              className="p-2.5 bg-stone-950 hover:bg-stone-800 border border-stone-800 hover:border-blue-500/50 flex items-center justify-between text-left transition group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/30">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-stone-200 group-hover:text-blue-400">
                    Shop-Floor Supervisor
                  </div>
                  <div className="text-[10px] text-stone-500 font-mono">Extrusion & Welding Shifts</div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-stone-600 group-hover:text-blue-400" />
            </button>

            <button
              onClick={() => handleQuickPersona('worker')}
              className="p-2.5 bg-stone-950 hover:bg-stone-800 border border-stone-800 hover:border-stone-600 flex items-center justify-between text-left transition group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-stone-800 text-stone-300 flex items-center justify-center border border-stone-700">
                  <HardHat className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-stone-200 group-hover:text-stone-100">
                    Contractual Floor Worker
                  </div>
                  <div className="text-[10px] text-stone-500 font-mono">Ramesh Yadav (OM-2001) Self-Service</div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-stone-600 group-hover:text-stone-300" />
            </button>
          </div>
        </div>

        {/* Standard Credentials Form */}
        <form
          onSubmit={handleCustomLogin}
          className="bg-stone-900 border border-stone-800 p-5 space-y-4 text-xs shadow-2xl"
        >
          <div className="text-[11px] font-mono text-stone-400 uppercase tracking-wider font-semibold border-b border-stone-800 pb-2 flex items-center justify-between">
            <span>Terminal Operator Sign-In</span>
            <span className="text-amber-500 text-[10px] lowercase font-normal">username: admin / pass: admin123</span>
          </div>

          <div>
            <label className="block text-[11px] font-mono text-stone-400 uppercase mb-1">
              Username / Badge ID / Role
            </label>
            <input
              type="text"
              required
              placeholder="e.g. admin, supervisor, worker, or OM-1001"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-stone-950 border border-stone-700 p-2 text-stone-200 font-mono focus:border-amber-500 outline-none"
            />
            <div className="text-[10px] text-stone-500 mt-1">
              Quick logins: <span className="text-amber-400">admin</span> (Operations GM), <span className="text-blue-400">supervisor</span> (Shift Supt), <span className="text-stone-300">worker</span> (Welder)
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-mono text-stone-400 uppercase mb-1">Security PIN / Password</label>
            <input
              type="password"
              required
              placeholder="Enter password..."
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-stone-950 border border-stone-700 p-2 text-stone-200 font-mono focus:border-amber-500 outline-none"
            />
            <div className="text-[10px] text-stone-500 mt-1">Demo password: <span className="text-amber-400 font-mono">admin123</span> (or any value)</div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-semibold uppercase tracking-wider text-xs flex items-center justify-center gap-2"
          >
            <LogIn className="w-4 h-4" />
            <span>{isLoading ? 'Authorizing...' : 'Authorize Terminal'}</span>
          </button>
        </form>

        {/* Legal & Compliance Footer */}
        <div className="text-center text-[10px] font-mono text-stone-500">
          <div>{STRINGS.FACTORY_LOCATION} • Maharashtra Factory Inspectorate</div>
          <div>All access is logged for statutory audit compliance.</div>
        </div>
      </div>
    </div>
  );
}
