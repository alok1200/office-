import React, { useEffect, useState } from 'react';
import { Sidebar } from './Sidebar';
import { useAuth } from '../../context/AuthContext';
import { Header } from './Header';

export function Layout({ currentTab, setTab, children }) {
  const { isSuperAdmin } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const handleEscape = (event) => { if (event.key === 'Escape') setMobileMenuOpen(false); };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleEscape);
    return () => { window.removeEventListener('keydown', handleEscape); document.body.style.overflow = previousOverflow; };
  }, [mobileMenuOpen]);

  return (
    <div className={`${isSuperAdmin ? 'sa-portal' : ''} app-shell`}>
      {/* Desktop Sidebar */}
      <div className="hidden md:flex shrink-0">
        <Sidebar currentTab={currentTab} setTab={setTab} />
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <button
            type="button"
            aria-label="Close navigation menu"
            className="fixed inset-0 bg-black/40 backdrop-blur-xs"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative z-10">
            <Sidebar
              currentTab={currentTab}
              setTab={(tab) => {
                setTab(tab);
                setMobileMenuOpen(false);
              }}
            />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="app-main flex flex-col min-h-screen">
        <Header
          onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)}
          setTab={setTab}
        />
        <main className="app-content flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}
