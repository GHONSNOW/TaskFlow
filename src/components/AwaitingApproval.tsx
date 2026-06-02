import React from 'react';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import { CircleAlert, LogOut, Clock, ShieldCheck } from 'lucide-react';

interface AwaitingApprovalProps {
  userName: string;
  userEmail: string;
  triggerToast: (msg: string) => void;
}

export default function AwaitingApproval({ userName, userEmail, triggerToast }: AwaitingApprovalProps) {
  
  const handleSignOut = async () => {
    try {
      await signOut(auth);
      triggerToast("Вы успешно вышли из системы.");
    } catch (e: any) {
      triggerToast(`Ошибка выхода: ${e.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F1117] flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-[#1A1D27] border border-[#2E3140] rounded-2xl p-8 text-center space-y-7 shadow-2xl relative">
        
        {/* Verification Alert Indicator */}
        <div className="mx-auto w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center text-amber-500 animate-pulse">
          <Clock className="h-8 w-8" />
        </div>

        {/* Informational Message */}
        <div className="space-y-3">
          <span className="text-[10px] px-3 py-1 rounded-full font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20 uppercase tracking-widest">
            Регистрация успешна
          </span>
          <h2 className="text-[#F1F5F9] text-xl font-bold font-sans tracking-tight">
            Ожидайте подтверждения администратора
          </h2>
          <p className="text-xs text-[#94A3B8] leading-relaxed max-w-sm mx-auto">
            Здравствуйте, <span className="text-[#F1F5F9] font-semibold">{userName}</span> ({userEmail}). Наш главный администратор назначит вам рабочую роль (например, оператор, разработчик, SMM и т.д.) и отдел.
          </p>
        </div>

        {/* Real-time Status Card */}
        <div className="bg-[#0F1117] border border-[#2E3140] rounded-xl p-4 text-left space-y-3.5">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-[#94A3B8]">Текущий статус:</span>
            <span className="text-amber-500 font-bold uppercase tracking-wider flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping"></span>
              На рассмотрении
            </span>
          </div>

          <div className="flex items-center justify-between text-xs font-mono border-t border-[#2E3140]/60 pt-3">
            <span className="text-[#94A3B8]">Рабочая роль:</span>
            <span className="text-gray-500 uppercase tracking-wider">Не назначена</span>
          </div>

          <div className="flex items-center justify-between text-xs font-mono border-t border-[#2E3140]/60 pt-3">
            <span className="text-[#94A3B8]">Оповещение:</span>
            <span className="text-indigo-400 text-[11px]">Доступ откроется автоматически</span>
          </div>
        </div>

        {/* Sign out options */}
        <div className="space-y-3.5 pt-2">
          <div className="p-3 bg-indigo-500/5 rounded-lg border border-indigo-500/10 text-[11px] text-[#94A3B8] leading-normal flex items-start gap-2.5 text-left">
            <ShieldCheck className="h-5 w-5 text-indigo-400 shrink-0 mt-0.5" />
            <span>
              Вам не нужно обновлять страницу. Как только администратор выдаст вам права, данный экран автоматически обновится и откроет доступ к рабочему интерфейсу.
            </span>
          </div>

          <button
            onClick={handleSignOut}
            className="w-full bg-[#252836] hover:bg-[#2E3140] text-red-400 hover:text-red-500 font-bold text-xs py-3 rounded-lg cursor-pointer transition flex items-center justify-center gap-2 border border-[#2E3140]/80"
          >
            <LogOut className="h-4 w-4" /> Выйти из аккаунта
          </button>
        </div>

      </div>
    </div>
  );
}
