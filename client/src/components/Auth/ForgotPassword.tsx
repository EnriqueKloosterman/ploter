import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { apiFetch } from '../../lib/api';

const ForgotPassword: React.FC = () => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      const res = await apiFetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.message || 'Error');
      }
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al enviar solicitud');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-800/50 border border-white/10 rounded-xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight text-transparent bg-clip-text bg-linear-to-r from-emerald-400 to-cyan-500 mb-2">
            PlotWeaver
          </h1>
          <p className="text-slate-400">{t('auth.forgotPasswordDesc')}</p>
        </div>

        {sent ? (
          <div className="space-y-5">
            <div className="bg-emerald-900/30 border border-emerald-700/50 text-emerald-300 text-sm rounded-xl px-4 py-3">
              {t('auth.resetLinkSent')}
            </div>
            <Link
              to="/login"
              className="block text-center text-emerald-400 hover:text-emerald-300 font-semibold underline underline-offset-4"
            >
              {t('auth.backToLogin')}
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">{t('auth.email')}</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                required
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
              />
            </div>

            {error && (
              <div className="bg-red-900/30 border border-red-700/50 text-red-300 text-sm rounded-xl px-4 py-3">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-accent hover:bg-accent-strong disabled:bg-accent-deep disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-lg shadow-accent/20 transition-all hover:-translate-y-0.5"
            >
              {isSubmitting ? t('auth.sending') : t('auth.sendResetLink')}
            </button>
          </form>
        )}

        <p className="text-center text-slate-500 text-sm mt-6">
          <Link to="/login" className="text-emerald-400 hover:text-emerald-300 font-semibold underline underline-offset-4">
            {t('auth.backToLogin')}
          </Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;
