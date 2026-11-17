import React, { useState } from 'react';
import { BriefcaseMedical, House, Loader2, Palmtree, PlaneTakeoff, Plus } from 'lucide-react';
import { PersonalRequestForm, todayInIndia, useRequestOptions } from './PersonalRequestForm';
const icons = { CL: Palmtree, SL: BriefcaseMedical, EL: PlaneTakeoff, WFH: House };
export function LeaveAllowances({ onSubmitted }) {
  const options = useRequestOptions(Number(todayInIndia().slice(0, 4)));
  const [category, setCategory] = useState(null);
  const [notice, setNotice] = useState('');
  return <section className="sa-allowances" aria-labelledby="sa-allowances-heading"><div className="sa-allowances-heading"><h2 id="sa-allowances-heading">Allowances</h2><button className="sa-request-primary" disabled={!options.data} onClick={() => setCategory('CL')}>Apply Leave / WFH</button></div>
    {notice && <p className="sa-request-notice" role="status">{notice}</p>}
    {options.loading ? <div className="sa-empty" role="status"><Loader2 size={18} className="animate-spin" /> Loading allowances…</div> : options.error ? <div className="sa-request-error" role="alert">{options.error} <button onClick={options.refresh}>Retry</button></div> : <><div className="sa-allowance-grid">{options.data.balances.map(balance => { const Icon = icons[balance.category]; return <article className="sa-allowance-card" key={balance.category}><h3><span><Icon size={20} /></span>{balance.label} ({balance.category})</h3><p className="sa-allowance-value"><strong>{balance.remaining}</strong> / {balance.allowance} days</p><div className="sa-allowance-track" role="meter" aria-label={`${balance.label} available`} aria-valuemin={0} aria-valuemax={balance.allowance} aria-valuenow={balance.remaining}><span style={{ width: `${Math.max(0, Math.min(100, balance.remaining / balance.allowance * 100))}%` }} /></div><p className="sa-allowance-used">{balance.used} day(s) used this year{balance.pending > 0 && ` · ${balance.pending} pending`}</p><button className="sa-allowance-apply" onClick={() => setCategory(balance.category)}><Plus size={18} /> Apply</button></article>; })}</div><p className="sa-allowance-policy">{options.data.policy}</p></>}
    {category && <PersonalRequestForm initialCategory={category} onClose={() => setCategory(null)} onSuccess={message => { setCategory(null); setNotice(message); options.refresh(); onSubmitted?.(); }} />}
  </section>;
}
