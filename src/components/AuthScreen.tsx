import React, { useState } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendEmailVerification, 
  signInWithPopup, 
  GoogleAuthProvider,
  signOut
} from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, getDoc, setDoc, getDocs, collection } from 'firebase/firestore';
import { Mail, Lock, User, LogIn, UserPlus, FileCheck } from 'lucide-react';

interface AuthScreenProps {
  onAuthSuccess: () => void;
  triggerToast: (msg: string) => void;
}

export default function AuthScreen({ onAuthSuccess, triggerToast }: AuthScreenProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  
  // Pending email verification screen state
  const [verificationSent, setVerificationSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      // Google sign-in guarantees email is verified, so we can directly initialize profile
      await handleUserDataAndRedirect(user.uid, user.displayName || user.email?.split('@')[0] || 'Пользователь', user.email || '');
    } catch (error: any) {
      console.error(error);
      triggerToast(`Ошибка входа Google: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);

    try {
      if (isSignUp) {
        if (!name.trim()) {
          triggerToast("Пожалуйста, введите ваше имя");
          setLoading(false);
          return;
        }
        
        // Form sign up
        const credential = await createUserWithEmailAndPassword(auth, email, password);
        const user = credential.user;

        // Send email verification
        await sendEmailVerification(user);
        setVerificationSent(true);
        triggerToast("Ссылка для подтверждения отправлена на вашу почту!");
        
        // Pre-create basic profile as guest
        await createInitialUserProfile(user.uid, name, email);
      } else {
        // Sign In
        const credential = await signInWithEmailAndPassword(auth, email, password);
        const user = credential.user;

        if (!user.emailVerified) {
          setVerificationSent(true);
          triggerToast("Ваш e-mail не подтвержден! Пожалуйста, подтвердите его.");
        } else {
          // Check/create user document
          await handleUserDataAndRedirect(user.uid, name || user.displayName || user.email?.split('@')[0] || 'Сотрудник', user.email || '');
        }
      }
    } catch (error: any) {
      console.error(error);
      let translated = error.message;
      if (error.code === 'auth/email-already-in-use') {
        translated = "Этот e-mail уже зарегистрирован.";
      } else if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        translated = "Неверный e-mail или пароль.";
      } else if (error.code === 'auth/weak-password') {
        translated = "Пароль слишком простой (минимум 6 символов).";
      }
      triggerToast(`Ошибка: ${translated}`);
    } finally {
      setLoading(false);
    }
  };

  const createInitialUserProfile = async (uid: string, displayName: string, userEmail: string) => {
    const userRef = doc(db, 'users', uid);
    
    // Check if there are any users in the system to decide if first user is Owner
    let isSystemEmpty = false;
    try {
      const usersSnap = await getDocs(collection(db, 'users'));
      if (usersSnap.empty) {
        isSystemEmpty = true;
      }
    } catch (e) {
      // Ignore reading checks if rules restrict, default to false or email check
      console.warn("Failed checking collection size, defaulting first owner flow", e);
    }

    // Explicit bootstrapped owner email from prompt
    const isBootstrappedOwner = userEmail.toLowerCase() === 'halilovramazan394@gmail.com';
    const finalRole = (isSystemEmpty || isBootstrappedOwner) ? 'owner' : 'guest';

    // Random colorful avatar bgcolor selection
    const colors = ['#EF4444', '#EC4899', '#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#06B6D4', '#14B8A6'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    
    // Initials format
    const names = displayName.trim().split(' ');
    let avatarInitimals = 'С';
    if (names.length >= 2) {
      avatarInitimals = `${names[0][0]}${names[1][0]}`.toUpperCase();
    } else if (names.length === 1 && names[0].length > 0) {
      avatarInitimals = names[0].substring(0, 2).toUpperCase();
    }

    const initialProfile = {
      id: uid,
      name: displayName,
      email: userEmail,
      avatar: avatarInitimals,
      bgColor: randomColor,
      role: finalRole,
      departmentId: (finalRole === 'owner') ? 'development' : '',
      isOnline: true,
      activeTasks: 0,
      completedTasks: 0,
      overdueTasks: 0,
      workload: (finalRole === 'owner') ? 15 : 0
    };

    await setDoc(userRef, initialProfile);
  };

  const handleUserDataAndRedirect = async (uid: string, displayName: string, userEmail: string) => {
    const userRef = doc(db, 'users', uid);
    const existingSnap = await getDoc(userRef);

    if (!existingSnap.exists()) {
      await createInitialUserProfile(uid, displayName, userEmail);
    } else {
      // User profile exists, make sure status is set to online
      await setDoc(userRef, { isOnline: true }, { merge: true });
    }
    
    onAuthSuccess();
  };

  const checkVerification = async () => {
    setLoading(true);
    if (auth.currentUser) {
      try {
        await auth.currentUser.reload();
        if (auth.currentUser.emailVerified) {
          triggerToast("Почта подтверждена!");
          setVerificationSent(false);
          
          const uid = auth.currentUser.uid;
          const userEmail = auth.currentUser.email || '';
          const snap = await getDoc(doc(db, 'users', uid));
          
          let profileName = 'Сотрудник';
          if (snap.exists()) {
            profileName = snap.data().name;
          }

          await handleUserDataAndRedirect(uid, profileName, userEmail);
        } else {
          triggerToast("Подтверждение еще не получено. Пожалуйста, откройте ссылку в письме.");
        }
      } catch (error: any) {
        triggerToast(`Ошибка проверки: ${error.message}`);
      }
    }
    setLoading(false);
  };

  const resendVerificationMail = async () => {
    if (auth.currentUser) {
      try {
        await sendEmailVerification(auth.currentUser);
        triggerToast("Повторное письмо отправлено!");
      } catch (error: any) {
        triggerToast(`Ошибка повторной отправки: ${error.message}`);
      }
    }
  };

  const handleCancelVerification = async () => {
    await signOut(auth);
    setVerificationSent(false);
  };

  if (verificationSent) {
    return (
      <div className="min-h-screen bg-[#0F1117] flex items-center justify-center p-4 select-none">
        <div className="w-full max-w-md bg-[#1A1D27] border border-[#2E3140] rounded-2xl p-8 text-center space-y-6 shadow-2xl relative">
          
          <div className="mx-auto w-16 h-16 bg-indigo-500/10 rounded-full flex items-center justify-center text-indigo-400">
            <FileCheck className="h-8 w-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-[#F1F5F9] text-xl font-bold font-sans tracking-tight">Подтвердите адрес почты</h2>
            <p className="text-xs text-[#94A3B8] leading-relaxed">
              Мы отправили проверочную ссылку на <span className="text-[#F1F5F9] font-semibold">{auth.currentUser?.email}</span>. 
              Пожалуйста, перейдите по ней, чтобы активировать аккаунт у нас в системе.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <button
              onClick={checkVerification}
              disabled={loading}
              className="w-full bg-[#6366F1] hover:bg-[#5053DC] disabled:bg-indigo-700 text-white font-semibold text-xs py-3 rounded-lg cursor-pointer transition flex items-center justify-center gap-1.5 shadow-[0_4px_12px_rgba(99,102,241,0.2)]"
            >
              Я подтвердил почту (Войти)
            </button>

            <button
              onClick={resendVerificationMail}
              className="w-full bg-[#252836] hover:bg-[#2E3140] text-[#94A3B8] hover:text-[#F1F5F9] font-medium text-xs py-3 rounded-lg cursor-pointer transition"
            >
              Выслать подтверждение заново
            </button>

            <button
              onClick={handleCancelVerification}
              className="w-full hover:bg-red-500/10 text-red-400 font-semibold text-xs py-2 rounded-lg cursor-pointer transition"
            >
              Вернуться к авторизации
            </button>
          </div>

          <p className="text-[10px] text-gray-500">
            После подтверждения почты, система запишет вас и вы сможете продолжить.
          </p>

        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F1117] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#1A1D27] border border-[#2E3140] rounded-2xl p-8 shadow-2xl space-y-7 relative">
        
        {/* Core Heading Header */}
        <div className="text-center space-y-2">
          <h2 className="text-[#F1F5F9] text-2xl font-black tracking-wider uppercase font-mono">
            TASKFLOW BOARD
          </h2>
          <p className="text-xs text-[#94A3B8]">
            {isSignUp ? 'Создайте учетную запись сотрудника' : 'Войдите в сингл-апп пространство'}
          </p>
        </div>

        {/* Action Form */}
        <form onSubmit={handleEmailAuth} className="space-y-4">
          
          {isSignUp && (
            <div className="space-y-1">
              <label className="text-[10px] text-[#94A3B8] font-bold uppercase tracking-wider block">Ваше ФИО / Никнейм</label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-[#94A3B8]">
                  <User className="h-4 w-4" />
                </span>
                <input
                  type="text"
                  required
                  placeholder="Роман Чернов"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#0F1117] border border-[#2E3140] text-xs px-3.5 py-2.5 pl-10 rounded-lg placeholder-[#94A3B8]/35 text-[#F1F5F9] focus:outline-none focus:ring-1 focus:ring-[#6366F1] focus:border-[#6366F1]"
                />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[10px] text-[#94A3B8] font-bold uppercase tracking-wider block">Электронная почта</label>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-[#94A3B8]">
                <Mail className="h-4 w-4" />
              </span>
              <input
                type="email"
                required
                placeholder="example@corp.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#0F1117] border border-[#2E3140] text-xs px-3.5 py-2.5 pl-10 rounded-lg placeholder-[#94A3B8]/35 text-[#F1F5F9] focus:outline-none focus:ring-1 focus:ring-[#6366F1] focus:border-[#6366F1]"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] text-[#94A3B8] font-bold uppercase tracking-wider block">Пароль</label>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-[#94A3B8]">
                <Lock className="h-4 w-4" />
              </span>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#0F1117] border border-[#2E3140] text-xs px-3.5 py-2.5 pl-10 rounded-lg placeholder-[#94A3B8]/35 text-[#F1F5F9] focus:outline-none focus:ring-1 focus:ring-[#6366F1] focus:border-[#6366F1]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#6366F1] hover:bg-[#5053DC] text-white text-xs font-semibold py-3 rounded-lg cursor-pointer transition duration-150 flex items-center justify-center gap-2 shadow-[0_4px_12px_rgba(99,102,241,0.2)] mt-5"
          >
            {isSignUp ? (
              <>
                <UserPlus className="h-4 w-4" /> Зарегистрироваться
              </>
            ) : (
              <>
                <LogIn className="h-4 w-4" /> Войти в систему
              </>
            )}
          </button>

        </form>

        {/* Divider separator */}
        <div className="relative flex py-2 items-center">
          <div className="flex-grow border-t border-[#2E3140]/60"></div>
          <span className="flex-shrink mx-4 text-[10px] text-gray-500 uppercase font-bold tracking-widest">ИЛИ</span>
          <div className="flex-grow border-t border-[#2E3140]/60"></div>
        </div>

        {/* Google sign-in */}
        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full bg-[#252836] hover:bg-[#2E3140] text-[#F1F5F9] border border-[#2E3140] text-xs font-bold py-3 rounded-lg cursor-pointer transition duration-150 flex items-center justify-center gap-2"
        >
          <svg className="h-4 w-4 mr-1.5" viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
          </svg>
          Войти через Google
        </button>

        {/* Switch mode */}
        <div className="text-center pt-2">
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-xs text-[#6366F1] hover:text-[#5053DC] font-semibold underline underline-offset-4 cursor-pointer"
          >
            {isSignUp ? 'Есть аккаунт? Войти' : 'Нет аккаунта? Зарегистрироваться'}
          </button>
        </div>

      </div>
    </div>
  );
}
