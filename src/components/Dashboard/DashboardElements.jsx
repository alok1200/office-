import React from 'react';
import { ArrowUpRight, CalendarDays } from 'lucide-react';
import './dashboard.css';

export function dashboardDate() {
  return new Intl.DateTimeFormat('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Asia/Kolkata'
  }).format(new Date());
}

export function DashboardHeader({ title, description, context, icon: Icon = CalendarDays, children }) {
  return (
    <header className="dashboard-hero">
      <div className="dashboard-hero-copy">
        {context && <p className="dashboard-hero-context"><Icon size={16} aria-hidden="true" />{context}</p>}
        <h1>{title}</h1>
        {description && <p className="dashboard-hero-description">{description}</p>}
      </div>
      {children && <div className="dashboard-hero-actions">{children}</div>}
    </header>
  );
}

export function DashboardMetric({ label, value, detail, tone = 'blue', icon: Icon, onClick, active = false }) {
  const Element = onClick ? 'button' : 'div';
  return (
    <Element className={`dashboard-metric tone-${tone}`} {...(onClick ? { type: 'button', onClick } : {})}>
      <div className="dashboard-metric-heading">
        <span className="dashboard-symbol"><Icon size={19} aria-hidden="true" /></span>
        {onClick && <ArrowUpRight size={15} className="dashboard-card-arrow" aria-hidden="true" />}
      </div>
      <p className="dashboard-metric-label">{label}{active && <span className="dashboard-live-dot" aria-label="Active" />}</p>
      <p className="dashboard-metric-value">{value}</p>
      {detail && <p className="dashboard-metric-detail">{detail}</p>}
    </Element>
  );
}

export function DashboardShortcut({ title, description, icon: Icon, tone = 'blue', onClick }) {
  return (
    <button type="button" className={`dashboard-shortcut tone-${tone}`} onClick={onClick}>
      <span className="dashboard-symbol"><Icon size={19} aria-hidden="true" /></span>
      <span className="dashboard-shortcut-copy">
        <strong>{title}</strong>
        {description && <small>{description}</small>}
      </span>
      <ArrowUpRight size={16} className="dashboard-card-arrow" aria-hidden="true" />
    </button>
  );
}
