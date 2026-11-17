import React, { useState } from 'react';
import { CompanyLogo } from '../components/Common/CompanyLogo';
import { useAuth } from '../context/AuthContext';
import {
  Building2,
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  CheckCircle2,
  ShieldCheck,
  User,
  Users
} from 'lucide-react';

export function LoginPage() {
  const { login } = useAuth();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [validationErrors, setValidationErrors] = useState({});

  // Input validation
  const validateForm = () => {
    const errors = {};
    const trimmedId = identifier.trim();

    if (!trimmedId) {
      errors.identifier = 'Email address or Employee ID is required.';
    }

    if (!password) {
      errors.password = 'Password is required.';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Backend automatically checks role, rate limits, and credentials
      const res = await login(identifier.trim(), password);
      if (!res.success) {
        setErrorMessage(res.error || 'Invalid login credentials. Please try again.');
      }
    } catch (err) {
      setErrorMessage('Sign-in could not be completed. Please check connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <section className="login-brand-panel" aria-label="KNOOVIQ Workforce Attendance">
        <div className="login-brand-mark"><CompanyLogo variant="signin" /></div>
        <h1>Your workday.<br />All in one place.</h1>
        <p>Attendance, leave and team management. A clear view of your day, wherever work takes you.</p>
        <div className="login-brand-caption"><ShieldCheck size={20} /><span>Your company workspace</span></div>
      </section>
      <section className="login-form-panel">
        <div className="login-card">
          <h2>Welcome back</h2>
          <p className="login-intro">Sign in to your KNOOVIQ account to manage your workday.</p>
          {errorMessage && <div role="alert" className="sa-info mb-5"><AlertCircle size={18} /><span>{errorMessage}</span></div>}
          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            {/* Field 1: Email Address / Employee ID */}
            <div>
              <label
                htmlFor="identifier"
                className="block text-xs font-black text-black uppercase tracking-wider mb-1.5"
              >
                Email Address or Employee ID <span className="text-blue-600">*</span>
              </label>
              <div className="relative">
                <input
                  id="identifier"
                  type="text"
                  autoComplete="username"
                  required
                  value={identifier}
                  onChange={(e) => {
                    setIdentifier(e.target.value);
                    if (validationErrors.identifier) {
                      setValidationErrors(prev => ({ ...prev, identifier: '' }));
                    }
                  }}
                  placeholder="Enter your email or employee ID"
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white text-black transition-all ${
                    validationErrors.identifier
                      ? 'border-rose-400 focus:ring-rose-500'
                      : 'border-slate-300 hover:border-slate-400'
                  }`}
                  aria-invalid={!!validationErrors.identifier}
                  aria-describedby={validationErrors.identifier ? 'identifier-error' : undefined}
                />
                <Mail className="w-4 h-4 text-blue-600 absolute left-3.5 top-3" />
              </div>
              {validationErrors.identifier && (
                <p id="identifier-error" className="text-xs text-rose-600 font-bold mt-1.5 flex items-center gap-1">
                  <span>{validationErrors.identifier}</span>
                </p>
              )}
            </div>

            {/* Field 2: Password with Show/Hide Control */}
            <div>
              <label
                htmlFor="password"
                className="block text-xs font-black text-black uppercase tracking-wider mb-1.5"
              >
                Password <span className="text-blue-600">*</span>
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (validationErrors.password) {
                      setValidationErrors(prev => ({ ...prev, password: '' }));
                    }
                  }}
                  placeholder="Enter your password"
                  className={`w-full pl-10 pr-11 py-2.5 rounded-xl border text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white text-black transition-all ${
                    validationErrors.password
                      ? 'border-rose-400 focus:ring-rose-500'
                      : 'border-slate-300 hover:border-slate-400'
                  }`}
                  aria-invalid={!!validationErrors.password}
                  aria-describedby={validationErrors.password ? 'password-error' : undefined}
                />
                <Lock className="w-4 h-4 text-blue-600 absolute left-3.5 top-3" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-2.5 p-1 text-blue-600 hover:bg-slate-50 rounded-lg transition-colors focus:outline-none focus:ring-1 focus:ring-blue-600"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4 text-blue-600" />
                  ) : (
                    <Eye className="w-4 h-4 text-blue-600" />
                  )}
                </button>
              </div>
              {validationErrors.password && (
                <p id="password-error" className="text-xs text-rose-600 font-bold mt-1.5 flex items-center gap-1">
                  <span>{validationErrors.password}</span>
                </p>
              )}
            </div>

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={loading}
              className="ui-button-primary mt-6"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Sign In</span>
                </>
              )}
            </button>
          </form>
        </div>
        <footer className="login-footer">&copy; {new Date().getFullYear()} KNOOVIQ Industries Pvt Ltd.<br />Workforce attendance &amp; time management.</footer>
      </section>
    </div>
  );
}
