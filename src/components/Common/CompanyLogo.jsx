import React, { useState } from 'react';

export const COMPANY_NAME = 'KNOOVIQ Industries Pvt Ltd';
export const COMPANY_LOGO_PATH = '/branding/knooviq-logo.png';

export function CompanyLogo({ variant = 'sidebar', className = '' }) {
  const [unavailable, setUnavailable] = useState(false);
  const setFavicon = () => {
    let icon = document.querySelector('link[data-company-favicon]');
    if (!icon) {
      icon = document.createElement('link');
      icon.rel = 'icon';
      icon.type = 'image/png';
      icon.dataset.companyFavicon = 'true';
      document.head.appendChild(icon);
    }
    icon.href = COMPANY_LOGO_PATH;
  };
  return <div className={`company-logo company-logo--${variant} ${className}`}>
    {unavailable ? <span className="company-logo-fallback"><strong>KNOOVIQ</strong><span>INDUSTRIES PVT LTD</span></span> : <img src={COMPANY_LOGO_PATH} alt={COMPANY_NAME} onLoad={setFavicon} onError={() => setUnavailable(true)} decoding="async" />}
  </div>;
}
