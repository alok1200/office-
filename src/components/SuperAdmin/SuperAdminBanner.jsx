// src/components/SuperAdmin/SuperAdminBanner.jsx
import React from 'react';
import { Info } from 'lucide-react';

export default function SuperAdminBanner() {
  return (
    <div className="flex items-start gap-2 bg-[#EFF6FF] border border-[#BFDBFE] rounded-[10px] p-4">
      <Info className="w-5 h-5 text-[#0F172A] flex-shrink-0 mt-0.5" />
      <div>
        <h4 className="font-semibold text-[#0F172A]">Super Admin Controls Active</h4>
        <p className="text-sm text-[#64748B]">You have full CRUD access across the system. Use the navigation links to manage users, requests, and settings.</p>
      </div>
    </div>
  );
}
