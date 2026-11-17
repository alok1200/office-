import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { useAuth } from '../../context/AuthContext';
import { Header } from './Header';

export function Layout({ currentTab, setTab, children }) {
  const { isSuperAdmin } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className={`${isSuperAdmin ? 'sa-portal' : ''} min-h-screen flex bg-white text-black`}>
      {/* Desktop Sidebar */}
      <div className="hidden md:flex shrink-0">
        <Sidebar currentTab={currentTab} setTab={setTab} />
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
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
      <div className="flex-1 flex flex-col min-w-0 min-h-screen bg-white">
        <Header
          onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)}
          setTab={setTab}
        />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto bg-white text-black animate-in fade-in duration-150">
          {children}
        </main>
      </div>
    </div>
  );
}
