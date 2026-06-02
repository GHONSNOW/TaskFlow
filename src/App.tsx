import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  CheckSquare, 
  Users as TeamIcon, 
  Layers as DeptIcon, 
  BarChart2 as AnalyticsIcon, 
  Settings as SettingsIcon, 
  Menu, 
  Search, 
  Bell, 
  LogOut,
  Sliders,
  Check,
  CheckSquare as DoneIcon,
  CircleAlert,
  SlidersHorizontal,
  Briefcase,
  Sliders as TuningIcon,
  X as CloseIcon,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, onSnapshot, collection, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';

import { auth, db } from './firebase';
import { Task, TaskStatus, TaskPriority, Member, Department, ActivityEvent } from './types';
import { DEPARTMENTS } from './data';

import DashboardView from './components/DashboardView';
import TasksView from './components/TasksView';
import TeamView from './components/TeamView';
import DepartmentsView from './components/DepartmentsView';
import AnalyticsView from './components/AnalyticsView';
import TaskModal from './components/TaskModal';
import CreateTaskModal from './components/CreateTaskModal';
import AuthScreen from './components/AuthScreen';
import AwaitingApproval from './components/AwaitingApproval';

export default function App() {
  // Authentication & Session States
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<Member | null>(null);
  const [authReady, setAuthReady] = useState<boolean>(false);

  // Global Core Firestore States
  const [tasks, setTasks] = useState<Task[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [departments, setDepartments] = useState<Department[]>(DEPARTMENTS);
  const [activityEvents, setActivityEvents] = useState<ActivityEvent[]>([]);
  
  // Navigation states
  const [currentPage, setCurrentPage] = useState<string>('dashboard');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);
  
  // Custom workspace setting
  const [workspaceName, setWorkspaceName] = useState<string>('TASKFLOW');
  const [enableLimitWarnings, setEnableLimitWarnings] = useState<boolean>(true);
  
  // Filters lifted up for cross-navigation triggers
  const [viewMode, setViewMode] = useState<'kanban' | 'list' | 'calendar'>('kanban');

  // Interactive Single Task Modal selected target reference
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);

  // Notifications drop-down toggle state
  const [isNotifOpen, setIsNotifOpen] = useState<boolean>(false);
  const [notifications, setNotifications] = useState<{ id: string; text: string; time: string; unread: boolean }[]>([]);

  // Profile dropdown state
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);

  // Toast System states
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
  };

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => {
        setToastMessage(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Escape key support to dismiss dropdowns & modals
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsNotifOpen(false);
        setIsProfileOpen(false);
        setSelectedTask(null);
        setIsCreateModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  // 1. Monitor Firebase Auth State changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setCurrentUser(firebaseUser);
        
        // Listen to active user's custom database profile
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const unsubProfile = onSnapshot(userDocRef, (snap) => {
          if (snap.exists()) {
            setUserProfile(snap.data() as Member);
          } else {
            setUserProfile(null);
          }
          setAuthReady(true);
        }, (err) => {
          console.error("Error reading user data snapshot", err);
          setAuthReady(true);
        });

        return () => unsubProfile();
      } else {
        setCurrentUser(null);
        setUserProfile(null);
        setAuthReady(true);
      }
    });

    return () => unsubscribe();
  }, []);

  // 2. Hydrate full workspace data if user has an active, approved role
  useEffect(() => {
    if (!currentUser || !userProfile || userProfile.role === 'guest') {
      setTasks([]);
      setMembers([]);
      setActivityEvents([]);
      return;
    }

    // A. Sync tasks list in real-time
    const unsubTasks = onSnapshot(collection(db, 'tasks'), (snap) => {
      const loaded: Task[] = [];
      snap.forEach(doc => {
        loaded.push(doc.data() as Task);
      });
      // Sort: critical first, then newer
      loaded.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      setTasks(loaded);
    }, (err) => {
      console.error("Error reading tasks snapshots", err);
    });

    // B. Sync users list (members) in real-time
    const unsubUsers = onSnapshot(collection(db, 'users'), (snap) => {
      const loaded: Member[] = [];
      snap.forEach(doc => {
        loaded.push(doc.data() as Member);
      });
      setMembers(loaded);
    }, (err) => {
      console.warn("Unable to load full users list", err);
    });

    // C. Sync activity log events in real-time
    const unsubEvents = onSnapshot(collection(db, 'activityEvents'), (snap) => {
      const loaded: ActivityEvent[] = [];
      snap.forEach(doc => {
        loaded.push(doc.data() as ActivityEvent);
      });
      // Order items by timestamp descending
      loaded.sort((a, b) => b.id.localeCompare(a.id));
      setActivityEvents(loaded.slice(0, 50)); // cap list
    }, (err) => {
      console.warn("Unable to load activity logs", err);
    });

    return () => {
      unsubTasks();
      unsubUsers();
      unsubEvents();
    };
  }, [currentUser, userProfile]);

  // 3. Automatically sync workload metrics upon structural changes in tasks
  useEffect(() => {
    if (members.length === 0 || tasks.length === 0) return;
    
    // Recount active, completed, overdue tasks per member
    const TODAY_STR = '2026-06-02';
    const updatedMembersState = members.map(m => {
      const userTasks = tasks.filter(t => t.assigneeIds.includes(m.id));
      const active = userTasks.filter(t => t.status !== 'done').length;
      const completed = userTasks.filter(t => t.status === 'done').length;
      const overdue = userTasks.filter(t => t.status !== 'done' && t.deadline < TODAY_STR).length;
      
      let workloadScore = active * 20;
      if (userTasks.some(t => t.priority === 'critical')) workloadScore += 15;
      const workload = Math.min(100, Math.max(15, workloadScore));

      return {
        ...m,
        activeTasks: active,
        completedTasks: completed,
        overdueTasks: overdue,
        workload
      };
    });

    // Check workload warnings if enabled
    if (enableLimitWarnings) {
      const overloaded = updatedMembersState.find(m => m.workload >= 90);
      if (overloaded && !activityEvents.some(e => e.action.includes('превысил норму нагрузки'))) {
        const freshEvId = `ev-auto-${Date.now()}`;
        const newEv: ActivityEvent = {
          id: freshEvId,
          memberId: overloaded.id,
          memberName: overloaded.name,
          memberAvatar: overloaded.avatar,
          action: `превысил норму нагрузки (загруженность ${overloaded.workload}%)`,
          time: 'Только что',
          type: 'warning'
        };
        setDoc(doc(db, 'activityEvents', freshEvId), newEv).catch(err => console.warn(err));
      }
    }
  }, [tasks, enableLimitWarnings]);

  // Mutation HANDLERS

  // 1. Create task
  const handleCreateTask = async (taskData: Omit<Task, 'id' | 'createdAt' | 'creatorId' | 'history' | 'comments' | 'attachments' | 'loggedTime'>) => {
    try {
      const freshId = `task-${Math.random().toString(36).substring(2, 9)}`;
      const assigneeNameOrSelf = taskData.assigneeIds.length > 0 
        ? (members.find(m => m.id === taskData.assigneeIds[0])?.name || 'разработчику')
        : 'команде';

      const newTask: Task = {
        ...taskData,
        id: freshId,
        createdAt: new Date().toISOString(),
        creatorId: currentUser?.uid || 'unknown',
        history: [
          { 
            id: 'log-1', 
            text: `${userProfile?.name} создал задачу и назначил её на ${assigneeNameOrSelf}`, 
            time: new Date().toLocaleString('ru-RU', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }) 
          }
        ],
        comments: [
          {
            id: 'cm-init',
            memberId: currentUser?.uid || 'unknown',
            memberName: userProfile?.name || 'Администратор',
            memberAvatar: userProfile?.avatar || 'А',
            text: 'Задача запущена в работу. Пожалуйста, двигайте по колонкам канбана по мере прогресса.',
            createdAt: 'Только что'
          }
        ],
        attachments: [],
        loggedTime: '0ч 0м'
      };

      await setDoc(doc(db, 'tasks', freshId), newTask);
      
      // Add activity timeline node
      const freshEvId = `ev-new-${Date.now()}`;
      const newEvent: ActivityEvent = {
        id: freshEvId,
        memberId: currentUser?.uid || 'unknown',
        memberName: userProfile?.name || 'Руководитель',
        memberAvatar: userProfile?.avatar || 'А',
        action: `создал задачу "${newTask.title}"`,
        time: '1 мин назад',
        type: 'success'
      };
      await setDoc(doc(db, 'activityEvents', freshEvId), newEvent);

      triggerToast(`Задача успешно создана!`);
    } catch (e: any) {
      console.error(e);
      triggerToast(`Ошибка сохранения задачи: ${e.message}`);
    }
  };

  // 2. Update status click / Kanban Drop transition
  const handleUpdateTaskStatus = async (taskId: string, nextStatus: TaskStatus) => {
    try {
      const target = tasks.find(t => t.id === taskId);
      if (!target) return;

      const statuses: Record<TaskStatus, string> = {
        new: 'Новая',
        in_progress: 'В работе',
        review: 'На проверке',
        changes: 'Нужны правки',
        done: 'Выполнена'
      };
      
      const logEntry = {
        id: `log-${Date.now()}`,
        text: `Статус изменен на "${statuses[nextStatus]}" в Канбане`,
        time: new Date().toLocaleString('ru-RU', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })
      };

      await updateDoc(doc(db, 'tasks', taskId), {
        status: nextStatus,
        history: [logEntry, ...target.history]
      });
      
      const freshEvId = `ev-[#status-change]-${Date.now()}`;
      const ev: ActivityEvent = {
        id: freshEvId,
        memberId: currentUser?.uid || 'unknown',
        memberName: userProfile?.name || 'Сотрудник',
        memberAvatar: userProfile?.avatar || 'А',
        action: `сменил статус задачи "${target.title}"`,
        time: 'Только что',
        type: nextStatus === 'done' ? 'success' : 'info'
      };
      await setDoc(doc(db, 'activityEvents', freshEvId), ev);

      triggerToast(`Статус задачи обновлен!`);
    } catch (e: any) {
      console.error(e);
      triggerToast(`Ошибка изменения статуса: ${e.message}`);
    }
  };

  // 3. Update full task metadata inside Detail Modal
  const handleUpdateTask = async (updatedTask: Task) => {
    try {
      await setDoc(doc(db, 'tasks', updatedTask.id), updatedTask);
      
      if (selectedTask?.id === updatedTask.id) {
        setSelectedTask(updatedTask);
      }
      
      triggerToast(`Параметры задачи надежно зафиксированы!`);
    } catch (e: any) {
      console.error(e);
      triggerToast(`Ошибка обновления задачи: ${e.message}`);
    }
  };

  // 4. Create Member manual profile fallback
  const handleAddMember = async (newM: Member) => {
    try {
      // Manual member added by administrator gets mapped/created as a standard profile
      await setDoc(doc(db, 'users', newM.id), {
        ...newM,
        role: 'developer', // Default role for manual creations
        email: `${newM.name.toLowerCase().replace(/\s+/g, '')}@example.com`
      });

      const freshEvId = `ev-madd-${Date.now()}`;
      const ev: ActivityEvent = {
        id: freshEvId,
        memberId: currentUser?.uid || 'unknown',
        memberName: userProfile?.name || 'Администратор',
        memberAvatar: userProfile?.avatar || 'А',
        action: `добавил сотрудника "${newM.name}" в систему`,
        time: 'Только что',
        type: 'success'
      };
      await setDoc(doc(db, 'activityEvents', freshEvId), ev);

      triggerToast(`Сотрудник ${newM.name} присоединен!`);
    } catch (e: any) {
      console.error(e);
      triggerToast(`Ошибка сохранения сотрудника: ${e.message}`);
    }
  };

  // 5. Assign Role and Dept by Admin
  const handleUpdateMemberRoleAndDepartment = async (memberId: string, role: string, departmentId: string) => {
    try {
      await updateDoc(doc(db, 'users', memberId), { role, departmentId });
      
      const freshEvId = `ev-role-${Date.now()}`;
      const ev: ActivityEvent = {
        id: freshEvId,
        memberId: currentUser?.uid || 'unknown',
        memberName: userProfile?.name || 'Администратор',
        memberAvatar: userProfile?.avatar || 'А',
        action: `обновил роль / отдел сотрудника #${memberId.substring(0, 5)}`,
        time: 'Только что',
        type: 'info'
      };
      await setDoc(doc(db, 'activityEvents', freshEvId), ev);
      
      triggerToast("Статус и роль успешно обновлены!");
    } catch (e: any) {
      console.error(e);
      triggerToast(`Ошибка правки ролей: ${e.message}`);
    }
  };

  // 6. Delete Candidate/User
  const handleDeleteMember = async (memberId: string) => {
    try {
      await deleteDoc(doc(db, 'users', memberId));
      triggerToast("Пользователь удален из системы.");
    } catch (e: any) {
      console.error(e);
      triggerToast(`Ошибка удаления: ${e.message}`);
    }
  };

  // 7. Cross Links triggers
  const handleSelectMemberForTasks = (memberId: string) => {
    setCurrentPage('tasks');
    const mObj = members.find(m => m.id === memberId);
    if (mObj) {
      setSearchQuery(mObj.name);
    }
    triggerToast(`Показываем задачи сотрудника: ${mObj?.name}`);
  };

  const handleOpenDepartmentTasks = (deptId: string) => {
    setCurrentPage('tasks');
    const deptObj = departments.find(d => d.id === deptId);
    if (deptObj) {
      setSearchQuery(deptObj.name);
    }
    triggerToast(`Фильтр по отделу: ${deptObj?.name}`);
  };

  // Clear search field Helper
  const handleClearQuery = () => {
    setSearchQuery('');
  };

  // Sign out handler
  const handleSignOut = async () => {
    try {
      // Set offline before logging out
      if (currentUser?.uid) {
        await updateDoc(doc(db, 'users', currentUser.uid), { isOnline: false });
      }
      setIsProfileOpen(false);
      await signOut(auth);
      triggerToast("Вы вышли из системы.");
    } catch (e: any) {
      triggerToast(`Ошибка выхода: ${e.message}`);
    }
  };

  // Count unread notifications
  const unreadCount = notifications.filter(n => n.unread).length;

  const handleReadNotifications = () => {
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
  };

  // Global Spinner while Auth loads
  if (!authReady) {
    return (
      <div className="min-h-screen bg-[#0F1117] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="h-10 w-10 text-[#6366F1] animate-spin" />
        <p className="text-xs text-indigo-400 tracking-wider uppercase font-mono">Синхронизация Workspace...</p>
      </div>
    );
  }

  // Secure Sign In & registration panel
  if (!currentUser) {
    return <AuthScreen onAuthSuccess={() => {}} triggerToast={triggerToast} />;
  }

  // Intermediary screen: authenticated but awaiting role setup
  if (userProfile?.role === 'guest') {
    return (
      <AwaitingApproval 
        userName={userProfile?.name || currentUser?.displayName || 'Сотрудник'}
        userEmail={currentUser?.email || ''}
        triggerToast={triggerToast}
      />
    );
  }

  return (
    <div className="flex h-screen bg-[#0F1117] text-[#F1F5F9] font-sans antialiased overflow-hidden" id="app-root">
      
      {/* 1. RESPONSIVE SIDEBAR DRAWER WITH OVERLAY */}
      <AnimatePresence>
        {isMobileSidebarOpen && (
          <div 
            onClick={() => setIsMobileSidebarOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs z-45 md:hidden"
            id="sidebar-overlay"
          />
        )}
      </AnimatePresence>

      <aside 
        className={`fixed md:static inset-y-0 left-0 w-[240px] shrink-0 bg-[#0D0F18] border-r border-[#2E3140] flex flex-col justify-between z-50 transform transition-transform duration-300 ease-in-out md:translate-x-0 ${
          isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
        id="app-sidebar"
      >
        
        {/* Brand Header */}
        <div>
          <div className="h-16 flex items-center justify-between px-6 border-b border-[#2E3140]/60">
            <span className="text-[#F1F5F9] font-black text-lg tracking-wider font-mono">{workspaceName}</span>
            {/* Close drawer button for mobile */}
            <button
              onClick={() => setIsMobileSidebarOpen(false)}
              className="p-1.5 rounded-lg bg-[#252836] hover:bg-[#2E3140]/80 text-[#94A3B8] hover:text-[#F1F5F9] md:hidden cursor-pointer"
              title="Закрыть меню"
            >
              ✕
            </button>
          </div>

          {/* Navigation nodes */}
          <nav className="p-4 space-y-1.5" id="sidebar-navigation">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
              { id: 'tasks', label: 'Задачи', icon: CheckSquare },
              { id: 'team', label: 'Команда', icon: TeamIcon },
              { id: 'departments', label: 'Отделы', icon: DeptIcon },
              { id: 'analytics', label: 'Аналитика', icon: AnalyticsIcon },
              { id: 'settings', label: 'Настройки', icon: SettingsIcon }
            ].map((node) => {
              const IconComp = node.icon;
              const isActive = currentPage === node.id;

              return (
                <button
                  key={node.id}
                  onClick={() => {
                    setCurrentPage(node.id);
                    setIsNotifOpen(false);
                    setIsProfileOpen(false);
                    setIsMobileSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-lg text-xs font-bold tracking-wide transition-all relative cursor-pointer group ${
                    isActive 
                      ? 'bg-[#252836] text-white' 
                      : 'text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-[#252836]/30'
                  }`}
                  id={`nav-link-${node.id}`}
                >
                  {/* Left Active Line indicator on active node */}
                  {isActive && (
                    <span className="absolute left-0 top-2 bottom-2 w-0.5 bg-[#6366F1] rounded-r-md" />
                  )}
                  <IconComp className={`h-4.5 w-4.5 transition-colors ${isActive ? 'text-[#6366F1]' : 'text-[#94A3B8] group-hover:text-[#F1F5F9]'}`} />
                  {node.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Current Profile panel footer */}
        <div className="p-4 border-t border-[#2E3140]/60 bg-[#090B12]/45 space-y-3" id="sidebar-footer">
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <div 
              className="w-9 h-9 rounded-full text-white flex items-center justify-center font-bold text-xs shrink-0 shadow"
              style={{ backgroundColor: userProfile?.bgColor || '#EF4444' }}
            >
              {userProfile?.avatar || 'А'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-[#F1F5F9] truncate leading-none">{userProfile?.name || 'Сотрудник'}</p>
              <span className="inline-block bg-[#6366F1]/15 text-[#6366F1] border border-[#6366F1]/10 text-[9px] font-bold px-1.5 py-0.2 rounded-full mt-1">
                {userProfile?.role === 'owner' ? 'Главный Owner' : userProfile?.role === 'administrator' ? 'Админ' : userProfile?.role}
              </span>
            </div>
          </div>
          
          <button 
            onClick={handleSignOut}
            className="w-full text-left text-[11px] font-semibold text-[#94A3B8] hover:text-[#EF4444] py-1 flex items-center gap-2 transition cursor-pointer"
            id="logout-btn"
          >
            <LogOut className="h-3.5 w-3.5" />
            Выйти из сессии
          </button>
        </div>

      </aside>

      {/* RIGHT FLEX PANEL (HEADER + DYNAMIC MAIN CONTAINER) */}
      <div className="flex-1 flex flex-col min-w-0" id="right-viewport">
        
        {/* UPPER FIXED HEADER */}
        <header className="h-16 bg-[#0D0F18]/80 backdrop-blur-md border-b border-[#2E3140] flex items-center justify-between px-4 sm:px-6 shrink-0 relative z-40" id="app-header">
          
          {/* Header left: dynamic screen label display */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="p-2 -ml-1 rounded-lg text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-[#252836]/50 md:hidden cursor-pointer flex items-center justify-center"
              id="mobile-menu-toggle"
              title="Открыть меню"
            >
              <Menu className="h-5 w-5" />
            </button>

            <h1 className="text-[#F1F5F9] text-sm sm:text-base font-bold tracking-tight uppercase" id="header-page-title">
              {currentPage === 'dashboard' ? 'Рабочее пространство' :
               currentPage === 'tasks' ? 'Задачи и Спринты' :
               currentPage === 'team' ? 'Штат сотрудников' :
               currentPage === 'departments' ? 'Реестр отделов' :
               currentPage === 'analytics' ? 'Служба аналитики' : 'Настройки системы'}
            </h1>
          </div>

          {/* Center search bar */}
          <div className="w-[110px] sm:w-[220px] md:w-[320px] relative transition-all duration-200" id="header-search-box">
            <input 
              type="text"
              placeholder="Поиск..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#0F1117] border border-[#2E3140] text-xs px-3.5 py-2 pl-9 pr-8 rounded-lg placeholder-[#94A3B8]/35 text-[#F1F5F9] transition-all focus:outline-none focus:ring-1 focus:ring-[#6366F1] focus:border-[#6366F1]"
              id="global-search-input"
            />
            <Search className="absolute left-3 top-3 h-3.5 w-3.5 text-[#94A3B8]/40" />
            {searchQuery && (
              <button 
                type="button"
                onClick={handleClearQuery}
                className="absolute right-2.5 top-2.5 text-[#94A3B8] hover:text-[#F1F5F9] p-0.5 rounded-full hover:bg-[#252836]"
              >
                <CloseIcon className="h-3 w-3" />
              </button>
            )}
          </div>

          {/* Right utility elements (bell, profile picker) */}
          <div className="flex items-center gap-3" id="header-utilities-box">
            
            {/* Notifications toggle button */}
            <div className="relative">
              <button 
                onClick={() => {
                  setIsNotifOpen(!isNotifOpen);
                  setIsProfileOpen(false);
                  if (!isNotifOpen) handleReadNotifications();
                }}
                className={`p-2 rounded-lg bg-[#1A1D27] text-[#94A3B8] border hover:text-[#F1F5F9] hover:bg-[#252836] transition relative cursor-pointer ${
                  isNotifOpen ? 'border-[#6366F1] text-white' : 'border-[#2E3140]'
                }`}
                id="bell-btn"
              >
                <Bell className="h-4.5 w-4.5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1.5 w-4 h-4 rounded-full bg-[#EF4444] text-[9px] font-bold text-white flex items-center justify-center animate-bounce">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notifications panel dynamic overlay menu */}
              {isNotifOpen && (
                <div 
                  className="absolute right-0 mt-2 w-[300px] bg-[#1A1D27] border border-[#2E3140] shadow-[0_12px_32px_rgba(0,0,0,0.6)] rounded-xl overflow-hidden p-3 space-y-2 animate-scale-in"
                  id="notifications-overlay"
                >
                  <div className="flex items-center justify-between border-b border-[#2E3140] pb-2">
                    <span className="text-xs font-bold text-white uppercase">Уведомления</span>
                    <span className="text-[10px] text-[#94A3B8] font-mono">Все прочитано</span>
                  </div>

                  <div className="space-y-2.5 divide-y divide-[#2E3140]/40" id="notifications-stack-list">
                    {notifications.length === 0 ? (
                      <p className="text-xs text-gray-400 py-3 text-center">Оповещений пока нет</p>
                    ) : (
                      notifications.map((item) => (
                        <div key={item.id} className="pt-2 text-xs flex flex-col space-y-1">
                          <div className="flex justify-between items-start gap-1">
                            <p className={`leading-normal ${item.unread ? 'text-white font-bold' : 'text-[#94A3B8]'}`}>{item.text}</p>
                            {item.unread && <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0 mt-1" />}
                          </div>
                          <span className="text-[9px] text-[#94A3B8]/60 font-mono text-right font-medium">{item.time}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Profile trigger button */}
            <div className="relative">
              <button 
                onClick={() => {
                  setIsProfileOpen(!isProfileOpen);
                  setIsNotifOpen(false);
                }}
                className="flex items-center gap-2 p-1 bg-[#1A1D27] border border-[#2E3140] hover:border-[#6366F1] rounded-lg cursor-pointer max-w-[124px]"
                id="profile-dropdown-btn"
              >
                <div 
                  className="w-6.5 h-6.5 rounded-full flex items-center justify-center text-white font-bold text-xs uppercase"
                  style={{ backgroundColor: userProfile?.bgColor || '#EF4444' }}
                >
                  {userProfile?.avatar || 'А'}
                </div>
                <span className="text-[10px] font-bold text-[#F1F5F9] hidden sm:block truncate pr-1">
                  {userProfile?.name.split(' ')[0] || 'Профиль'}
                </span>
              </button>

              {/* Profile dropdown menu */}
              {isProfileOpen && (
                <div 
                  className="absolute right-0 mt-2 w-[180px] bg-[#1A1D27] border border-[#2E3140] shadow-[0_8px_24px_rgba(0,0,0,0.5)] rounded-xl overflow-hidden p-2 text-xs space-y-1.5 animate-scale-in"
                  id="profile-dropdown-overlay"
                >
                  <div className="p-2 border-b border-[#2E3140]/60 space-y-0.5">
                    <p className="font-bold text-white truncate">{userProfile?.name || 'Сотрудник'}</p>
                    <p className="text-[10px] text-[#94A3B8] truncate">{currentUser?.email}</p>
                  </div>
                  <button 
                    onClick={() => {
                      setCurrentPage('settings');
                      setIsProfileOpen(false);
                    }}
                    className="w-full text-left p-2 rounded hover:bg-[#252836] hover:text-white transition flex items-center gap-2 cursor-pointer text-[#94A3B8]"
                    id="profile-menu-settings"
                  >
                    <span>⚙️</span> Настройки системы
                  </button>
                  <button 
                    onClick={handleSignOut}
                    className="w-full text-left p-2 rounded hover:bg-red-500/10 hover:text-red-400 transition flex items-center gap-2 cursor-pointer text-red-500 font-bold"
                    id="profile-menu-logout"
                  >
                    <span>🚪</span> Выйти из системы
                  </button>
                </div>
              )}
            </div>

          </div>

        </header>

        {/* MAIN DISPLAY SCROLLABLE AREA */}
        <main className="flex-1 overflow-y-auto p-6 space-y-6 progress-bar-styling" id="main-content-scroll">
          
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPage}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
              className="h-full"
            >
              
              {currentPage === 'dashboard' && (
                <DashboardView 
                  tasks={tasks}
                  members={members}
                  departments={departments}
                  activityEvents={activityEvents}
                  onNavigate={(nodeId) => setCurrentPage(nodeId)}
                  onSelectTask={(taskObj) => setSelectedTask(taskObj)}
                />
              )}

              {currentPage === 'tasks' && (
                <TasksView 
                  tasks={tasks}
                  departments={departments}
                  members={members}
                  searchQuery={searchQuery}
                  onSelectTask={(taskObj) => setSelectedTask(taskObj)}
                  onOpenCreateModal={() => setIsCreateModalOpen(true)}
                  onUpdateTaskStatus={handleUpdateTaskStatus}
                  onUpdateTask={handleUpdateTask}
                />
              )}

              {currentPage === 'team' && (
                <TeamView 
                  members={members}
                  departments={departments}
                  onAddMember={handleAddMember}
                  onSelectMemberForTasks={handleSelectMemberForTasks}
                  currentUserRole={userProfile?.role || 'guest'}
                  onUpdateMemberRoleAndDepartment={handleUpdateMemberRoleAndDepartment}
                  onDeleteMember={handleDeleteMember}
                />
              )}

              {currentPage === 'departments' && (
                <DepartmentsView 
                  departments={departments}
                  members={members}
                  tasks={tasks}
                  onOpenDepartmentTasks={handleOpenDepartmentTasks}
                />
              )}

              {currentPage === 'analytics' && (
                <AnalyticsView 
                  members={members}
                  departments={departments}
                  tasks={tasks}
                />
              )}

              {currentPage === 'settings' && (
                <div className="space-y-6" id="settings-view-root">
                  
                  {/* Settings Title */}
                  <div>
                    <h2 className="text-[#F1F5F9] text-xl font-bold tracking-tight">Настройки системы</h2>
                    <p className="text-xs text-[#94A3B8]">Управление корпоративным брендингом, пороговыми предупреждениями и базой SLA</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="settings-cards-grid">
                    
                    {/* Settings 1: Workspace title and styling config */}
                    <div className="bg-[#1A1D27] rounded-xl border border-[#2E3140] p-6 shadow-md space-y-4" id="settings-workspace-card">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-[#6366F1]/10 text-[#6366F1] rounded-lg">
                          <SlidersHorizontal className="h-5 w-5" />
                        </div>
                        <h3 className="text-sm font-bold text-[#F1F5F9]">Корпоративный брендинг</h3>
                      </div>

                      <div className="space-y-4 pt-2">
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-[#94A3B8] uppercase">Бренд-код системы (Заголовок в сайдбаре)</label>
                          <input 
                            type="text"
                            value={workspaceName}
                            onChange={(e) => setWorkspaceName(e.target.value.toUpperCase())}
                            className="w-full bg-[#0F1117] border border-[#2E3140] text-sm px-3 py-2 rounded-lg text-white font-mono uppercase"
                            id="input-workspace-name"
                          />
                        </div>

                        <div className="space-y-1 flex items-center justify-between">
                          <div>
                            <p className="text-xs font-bold text-[#94A3B8] uppercase">Уведомления о перегрузке сотрудников</p>
                            <span className="text-[10px] text-[#94A3B8]/60 leading-tight block">Сигнал в ленту при загрузке свыше 90%</span>
                          </div>
                          <input 
                            type="checkbox"
                            checked={enableLimitWarnings}
                            onChange={(e) => setEnableLimitWarnings(e.target.checked)}
                            className="w-9 h-5 rounded-full appearance-none bg-[#0F1117] checked:bg-[#6366F1] border border-[#2E3140] cursor-pointer transition relative"
                            style={{
                              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20'%3E%3Cpath fill='%2394A3B8' d='M10 18a8 8 0 100-16 8 8 0 000 16z'/%3E%3C/svg%3E")`,
                              backgroundSize: '16px',
                              backgroundPosition: 'left 2px center',
                              backgroundRepeat: 'no-repeat',
                            }}
                            id="check-limit-warnings"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Settings 2: SLA configurations info */}
                    <div className="bg-[#1A1D27] rounded-xl border border-[#2E3140] p-6 shadow-md space-y-4" id="settings-sla-card">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-[#8B5CF6]/10 text-[#8B5CF6] rounded-lg">
                          <Briefcase className="h-5 w-5" />
                        </div>
                        <h3 className="text-sm font-bold text-[#F1F5F9]">База SLA Компании</h3>
                      </div>

                      <p className="text-xs text-[#94A3B8] leading-relaxed">
                        Управление нормативами скорости решения задач. Значения используются во всех автоматических расчетах эффективности тепловой карты отделов.
                      </p>

                      <div className="grid grid-cols-2 gap-3 font-mono pt-2" id="settings-sla-rates font-mono">
                        <div className="p-3 bg-[#0F1117] rounded-lg border border-[#2E3140] text-center">
                          <p className="text-[10px] text-[#94A3B8] mb-1">Срок SLA</p>
                          <span className="text-xs font-extrabold text-white">48 часов</span>
                        </div>
                        <div className="p-3 bg-[#0F1117] rounded-lg border border-[#2E3140] text-center">
                          <p className="text-[10px] text-[#94A3B8] mb-1">Критич. задачи</p>
                          <span className="text-xs font-extrabold text-[#EF4444]">4 часа</span>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              )}

            </motion.div>
          </AnimatePresence>

        </main>

      </div>

      {/* 2. TASK CREATION MODAL FORM */}
      <CreateTaskModal 
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        departments={departments}
        members={members}
        onCreateTask={handleCreateTask}
      />

      {/* 3. TASK DETAILED EDIT/VIEW MODAL */}
      <TaskModal 
        task={selectedTask}
        isOpen={selectedTask !== null}
        onClose={() => setSelectedTask(null)}
        departments={departments}
        members={members}
        onUpdateTask={handleUpdateTask}
        currentUserId={currentUser?.uid || ''}
      />

      {/* 4. FLOATING FEEDBACK TOAST COMPONENT */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-6 right-6 z-50 bg-[#1A1D27] border border-[#22C55E]/40 text-[#F1F5F9] rounded-xl px-4.5 py-3.5 shadow-[0_8px_32px_rgba(0,0,0,0.6)] flex items-center gap-3"
            id="floating-toast"
          >
            <div className="w-5.5 h-5.5 rounded-full bg-[#22C55E]/15 text-[#22C55E] flex items-center justify-center font-bold">
              ✓
            </div>
            <p className="text-xs font-semibold tracking-wide text-white/95">{toastMessage}</p>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
