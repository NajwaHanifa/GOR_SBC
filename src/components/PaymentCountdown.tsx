import React, { useState, useEffect } from 'react';
import { Clock, AlertCircle } from 'lucide-react';

interface PaymentCountdownProps {
  deadline: string;
  onExpire?: () => void;
  className?: string;
}

export const PaymentCountdown: React.FC<PaymentCountdownProps> = ({
  deadline,
  onExpire,
  className = '',
}) => {
  const [timeLeft, setTimeLeft] = useState<{
    total: number;
    minutes: number;
    seconds: number;
    isExpired: boolean;
  }>({
    total: 0,
    minutes: 0,
    seconds: 0,
    isExpired: false,
  });

  useEffect(() => {
    function calculate() {
      const target = new Date(deadline).getTime();
      const now = new Date().getTime();
      const diff = target - now;

      if (diff <= 0) {
        setTimeLeft({
          total: 0,
          minutes: 0,
          seconds: 0,
          isExpired: true,
        });
        if (onExpire) {
          onExpire();
        }
        return false;
      }

      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);

      setTimeLeft({
        total: diff,
        minutes,
        seconds,
        isExpired: false,
      });
      return true;
    }

    const hasTime = calculate();
    if (!hasTime) return;

    const timer = setInterval(() => {
      const active = calculate();
      if (!active) {
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [deadline, onExpire]);

  if (timeLeft.isExpired) {
    return (
      <div className={`flex items-center gap-2 px-3 py-2 rounded-lg bg-rose-50 text-rose-700 text-xs font-semibold border border-rose-200 ${className}`}>
        <AlertCircle className="w-4 h-4 shrink-0" />
        <span>Batas Waktu Pembayaran Telah Habis</span>
      </div>
    );
  }

  const isUrgent = timeLeft.minutes < 5;

  return (
    <div
      className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg border text-xs font-medium ${
        isUrgent
          ? 'bg-amber-50 border-amber-300 text-amber-800 animate-pulse'
          : 'bg-blue-50 border-blue-200 text-blue-900'
      } ${className}`}
    >
      <Clock className={`w-3.5 h-3.5 ${isUrgent ? 'text-amber-600' : 'text-[#0080FF]'}`} />
      <span>Sisa Waktu Pembayaran:</span>
      <span className="font-mono font-bold tracking-wider text-sm">
        {String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}
      </span>
    </div>
  );
};
