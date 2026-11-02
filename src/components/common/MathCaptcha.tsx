import React, { useState, useEffect, useCallback } from 'react';
import { RotateCw, CheckCircle2, AlertCircle } from 'lucide-react';

interface MathCaptchaProps {
  onValidate: (isValid: boolean) => void;
  className?: string;
}

export const MathCaptcha: React.FC<MathCaptchaProps> = ({ onValidate, className = '' }) => {
  const [num1, setNum1] = useState<number>(0);
  const [num2, setNum2] = useState<number>(0);
  const [userAnswer, setUserAnswer] = useState<string>('');
  const [isTouched, setIsTouched] = useState<boolean>(false);

  const generateCaptcha = useCallback(() => {
    const a = Math.floor(Math.random() * 12) + 1; // 1 to 12
    const b = Math.floor(Math.random() * 9) + 1;  // 1 to 9
    setNum1(a);
    setNum2(b);
    setUserAnswer('');
    setIsTouched(false);
    onValidate(false);
  }, [onValidate]);

  useEffect(() => {
    generateCaptcha();
  }, [generateCaptcha]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.trim();
    setUserAnswer(val);
    setIsTouched(true);
    const parsed = parseInt(val, 10);
    const correct = parsed === num1 + num2;
    onValidate(correct);
  };

  const isCorrect = isTouched && parseInt(userAnswer, 10) === num1 + num2;
  const isWrong = isTouched && userAnswer.length > 0 && !isCorrect;

  return (
    <div className={`space-y-2 ${className}`}>
      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
        Human Verification Captcha <span className="text-rose-500">*</span>
      </label>
      
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        {/* Math Question Pill */}
        <div className="flex items-center justify-between gap-3 px-4 py-2.5 bg-slate-100 border border-slate-300/80 rounded-xl shadow-2xs">
          <span className="font-mono text-base font-black text-navy select-none tracking-wider">
            {num1} + {num2} = ?
          </span>
          <button
            type="button"
            onClick={generateCaptcha}
            title="Refresh math captcha"
            className="p-1 rounded-lg text-slate-500 hover:text-[#A44101] hover:bg-slate-200/80 transition-colors cursor-pointer"
          >
            <RotateCw className="w-4 h-4" />
          </button>
        </div>

        {/* Input answer */}
        <div className="relative flex-1">
          <input
            type="number"
            value={userAnswer}
            onChange={handleChange}
            placeholder="Enter answer"
            className={`w-full px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all focus:outline-none ${
              isCorrect
                ? 'border-emerald-500 bg-emerald-50/40 text-emerald-900 focus:ring-2 focus:ring-emerald-400'
                : isWrong
                ? 'border-rose-400 bg-rose-50/40 text-rose-900 focus:ring-2 focus:ring-rose-400'
                : 'border-slate-300 bg-white text-slate-900 focus:border-[#A44101] focus:ring-2 focus:ring-[#A44101]/20'
            }`}
          />
          {isCorrect && (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 absolute right-3 top-1/2 -translate-y-1/2" />
          )}
          {isWrong && (
            <AlertCircle className="w-4 h-4 text-rose-500 absolute right-3 top-1/2 -translate-y-1/2" />
          )}
        </div>
      </div>
      {isWrong && (
        <p className="text-[11px] text-rose-500 font-medium">Incorrect answer, please try again.</p>
      )}
    </div>
  );
};

