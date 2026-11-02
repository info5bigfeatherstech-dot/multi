import React from 'react';
import { CheckCircle2, Clock, XCircle, AlertTriangle, ShieldCheck, RefreshCw } from 'lucide-react';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const norm = (status || '').toLowerCase().trim();

  let label = status;
  let bgClass = 'bg-slate-100 text-slate-700 border-slate-200';
  let Icon = Clock;

  switch (norm) {
    case 'active':
    case 'approved':
    case 'paid':
    case 'delivered':
      label = norm === 'active' ? 'Active' : norm === 'approved' ? 'Approved' : norm === 'paid' ? 'Paid' : 'Delivered';
      bgClass = 'bg-emerald-50 text-emerald-800 border-emerald-200';
      Icon = CheckCircle2;
      break;

    case 'pending':
    case 'pending_admin':
      label = norm === 'pending_admin' ? 'Pending Admin Review' : 'Pending';
      bgClass = 'bg-amber-50 text-amber-900 border-amber-200';
      Icon = Clock;
      break;

    case 'pending_otp':
      label = 'Pending Activation';
      bgClass = 'bg-sky-50 text-sky-800 border-sky-200';
      Icon = ShieldCheck;
      break;

    case 'expired':
      label = 'Expired';
      bgClass = 'bg-rose-50 text-rose-800 border-rose-200';
      Icon = AlertTriangle;
      break;

    case 'rejected':
    case 'cancelled':
    case 'failed':
      label = norm === 'rejected' ? 'Rejected' : norm === 'cancelled' ? 'Cancelled' : 'Failed';
      bgClass = 'bg-rose-100/80 text-rose-900 border-rose-300';
      Icon = XCircle;
      break;

    case 'suspended':
      label = 'Suspended';
      bgClass = 'bg-purple-50 text-purple-800 border-purple-200';
      Icon = AlertTriangle;
      break;

    case 'confirmed':
    case 'processing':
    case 'ready_to_ship':
      label = norm === 'confirmed' ? 'Confirmed' : norm === 'processing' ? 'Processing' : 'Ready to Ship';
      bgClass = 'bg-blue-50 text-blue-800 border-blue-200';
      Icon = RefreshCw;
      break;

    case 'in_transit':
      label = 'In Transit';
      bgClass = 'bg-indigo-50 text-indigo-800 border-indigo-200';
      Icon = RefreshCw;
      break;

    default:
      label = status;
      bgClass = 'bg-slate-100 text-slate-700 border-slate-200';
      Icon = Clock;
  }

  const pxPy = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-bold border ${bgClass} ${pxPy} tracking-wide select-none`}
    >
      <Icon className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
      <span>{label}</span>
    </span>
  );
};

