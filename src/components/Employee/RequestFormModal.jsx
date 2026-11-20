import React from 'react';
import { PersonalRequestForm } from '../SuperAdmin/PersonalRequestForm';

export function RequestFormModal({ isOpen, onClose, onSuccess, defaultType = 'LEAVE' }) {
  if (!isOpen) return null;
  const category = { LEAVE: 'CL', HOLIDAY: 'HOLIDAY', REGULARIZATION: 'REGULARIZATION', WFH: 'WFH', OTHER: 'OFFICIAL' }[defaultType] || 'CL';
  return <PersonalRequestForm initialCategory={category} onClose={onClose} onSuccess={message => { onSuccess(message); onClose(); }} />;
}
