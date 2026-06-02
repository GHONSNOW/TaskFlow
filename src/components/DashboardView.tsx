import React from 'react';
import { 
  Activity, 
  AlertCircle, 
  CheckCircle, 
  Users, 
  Code2, 
  Megaphone, 
  TrendingUp, 
  Palette, 
  Headphones,
  ArrowRight
} from 'lucide-react';
import { Task, Member, Department, ActivityEvent } from '../types';

interface DashboardViewProps {
  tasks: Task[];
  members: Member[];
  departments: Department[];
  activityEvents: ActivityEvent[];
  onNavigate: (page: string) => void;
  onSelectTask: (task: Task) => void;
}

export default function DashboardView({
  tasks,
  members,
  departments,
  activityEvents,
  onNavigate,
  onSelectTask
}: DashboardViewProps) {
  
  // System's virtual "today" is 2026-06-02
  const TODAY_STR = '2026-06-02';

  // Calculations for KPI Cards
  const activeTasksCount = tasks.filter(t => t.status !== 'done').length;
  
  const overdueTasksCount = tasks.filter(t => {
    return t.status !== 'done' && t.deadline < TODAY_STR;
  }).length;

  const completedTodayCount = tasks.filter(t => t.status === 'done').length; // dynamically using done as completed
  const onlineMembersCount = members.filter(m => m.isOnline).length;

  // Helper for Department Icons
  const renderDeptIcon = (iconName: string, className: string) => {
    switch (iconName) {
      case 'Code2': return <Code2 className={className} />;
      case 'Megaphone': return <Megaphone className={className} />;
      case 'TrendingUp': return <TrendingUp className={className} />;
      case 'Palette': return <Palette className={className} />;
      case 'Headphones': return <Headphones className={className} />;
      default: return <Code2 className={className} />;
    }
  };

  return (
    <div className="space-y-8 animate-fade-in" id="dashboard-view-container">
      {/* 4 Block Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5" id="metric-cards-grid">
        
        {/* Metric 1 */}
        <div 
          className="bg-[#1A1D27] rounded-xl border-l-4 border-l-[#6366F1] border border-[#2E3140] p-5 shadow-[0_4px_24px_rgba(0,0,0,0.4)] hover:scale-[1.01] hover:brightness-[1.03] transition-all duration-200 cursor-pointer"
          onClick={() => onNavigate('tasks')}
          id="metric-card-active"
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[#94A3B8] text-sm font-medium uppercase tracking-wider mb-1">Активных задач</p>
              <h3 className="text-[#F1F5F9] text-3xl font-bold" id="metric-count-active">{activeTasksCount}</h3>
            </div>
            <div className="bg-[#6366F1]/10 p-2.5 rounded-lg text-[#6366F1]">
              <Activity className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-xs text-[#94A3B8]">
            <span className="text-indigo-400 mr-1.5 font-semibold">В работе у команды</span>
            <span>прямо сейчас</span>
          </div>
        </div>

        {/* Metric 2 */}
        <div 
          className="bg-[#1A1D27] rounded-xl border-l-4 border-l-[#EF4444] border border-[#2E3140] p-5 shadow-[0_4px_24px_rgba(0,0,0,0.4)] hover:scale-[1.01] hover:brightness-[1.03] transition-all duration-200 cursor-pointer"
          onClick={() => onNavigate('tasks')}
          id="metric-card-overdue"
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[#94A3B8] text-sm font-medium uppercase tracking-wider mb-1">Просрочено</p>
              <h3 className="text-[#F1F5F9] text-3xl font-bold text-[#EF4444]" id="metric-count-overdue">
                {overdueTasksCount}
              </h3>
            </div>
            <div className="bg-[#EF4444]/10 p-2.5 rounded-lg text-[#EF4444]">
              <AlertCircle className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-xs text-[#94A3B8]">
            <span className="text-[#EF4444] mr-1.5 font-semibold">Требуют внимания</span>
            <span>истек дедлайн</span>
          </div>
        </div>

        {/* Metric 3 */}
        <div 
          className="bg-[#1A1D27] rounded-xl border-l-4 border-l-[#22C55E] border border-[#2E3140] p-5 shadow-[0_4px_24px_rgba(0,0,0,0.4)] hover:scale-[1.01] hover:brightness-[1.03] transition-all duration-200 cursor-pointer"
          onClick={() => onNavigate('tasks')}
          id="metric-card-completed"
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[#94A3B8] text-sm font-medium uppercase tracking-wider mb-1">Выполнено сегодня</p>
              <h3 className="text-[#F1F5F9] text-3xl font-bold text-[#22C55E]" id="metric-count-completed">
                {completedTodayCount}
              </h3>
            </div>
            <div className="bg-[#22C55E]/10 p-2.5 rounded-lg text-[#22C55E]">
              <CheckCircle className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-xs text-[#94A3B8]">
            <span className="text-[#22C55E] mr-1.5 font-semibold">+15% притока</span>
            <span>закрыто успешно</span>
          </div>
        </div>

        {/* Metric 4 */}
        <div 
          className="bg-[#1A1D27] rounded-xl border-l-4 border-l-[#8B5CF6] border border-[#2E3140] p-5 shadow-[0_4px_24px_rgba(0,0,0,0.4)] hover:scale-[1.01] hover:brightness-[1.03] transition-all duration-200 cursor-pointer"
          onClick={() => onNavigate('team')}
          id="metric-card-online"
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[#94A3B8] text-sm font-medium uppercase tracking-wider mb-1">Сотрудников онлайн</p>
              <h3 className="text-[#F1F5F9] text-3xl font-bold text-[#8B5CF6]" id="metric-count-online">
                {onlineMembersCount}
              </h3>
            </div>
            <div className="bg-[#8B5CF6]/10 p-2.5 rounded-lg text-[#8B5CF6]">
              <Users className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-xs text-[#94A3B8]">
            <span className="text-[#8B5CF6] mr-1.5 font-semibold">{members.length - onlineMembersCount} офлайн</span>
            <span>на связи</span>
          </div>
        </div>

      </div>

      {/* Main Grid: Departments Heatmap & Activity Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8" id="dashboard-content-grid">
        
        {/* Department Heatmap (Left, 2 Columns size in 3 Column Grid) */}
        <div className="lg:col-span-2 space-y-5" id="dashboard-departments-section">
          <div className="flex items-center justify-between">
            <h2 className="text-[#F1F5F9] text-xl font-bold tracking-tight">Тепловая карта отделов</h2>
            <button 
              onClick={() => onNavigate('departments')}
              className="text-[#6366F1] text-sm font-semibold hover:underline flex items-center gap-1.5 transition-all"
            >
              Все отделы <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5" id="departments-heatmap-grid">
            {departments.map((dept) => {
              // Dynamic stats from real tasks
              const deptTasks = tasks.filter(t => t.departmentId === dept.id);
              const total = deptTasks.length;
              const completed = deptTasks.filter(t => t.status === 'done').length;
              const active = deptTasks.filter(t => t.status !== 'done' && t.status !== 'new').length;
              const overdue = deptTasks.filter(t => t.status !== 'done' && t.deadline < TODAY_STR).length;
              
              const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
              const managerName = members.find(m => m.id === dept.managerId)?.name || 'Не назначен';

              return (
                <div 
                  key={dept.id}
                  className="bg-[#1A1D27] rounded-xl p-5 border border-[#2E3140] shadow-[0_4px_24px_rgba(0,0,0,0.4)] hover:scale-[1.01] hover:brightness-[1.03] transition-all duration-200"
                  id={`heatmap-dept-${dept.id}`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="bg-[#252836] p-2 rounded-lg text-[#8B5CF6]" id={`dept-icon-${dept.id}`}>
                        {renderDeptIcon(dept.iconName, 'h-5 w-5')}
                      </div>
                      <div>
                        <h4 className="text-[#F1F5F9] font-bold text-base">{dept.name}</h4>
                        <p className="text-xs text-[#94A3B8]">Руководитель: {managerName}</p>
                      </div>
                    </div>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#252836] text-[#F1F5F9]">
                      {completed}/{total}
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="space-y-1.5 mb-4">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-[#94A3B8]">Выполнение задач</span>
                      <span className="text-[#6366F1]">{percent}%</span>
                    </div>
                    <div className="w-full h-2 bg-[#252836] rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] rounded-full transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* 3 mini-badges */}
                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#2E3140]/50">
                    <div className="text-center py-1 rounded-lg bg-indigo-500/5 border border-indigo-500/20">
                      <div className="text-xs text-[#94A3B8]">Активных</div>
                      <div className="text-sm font-bold text-[#6366F1]">{active}</div>
                    </div>
                    <div className="text-center py-1 rounded-lg bg-amber-500/5 border border-amber-500/20">
                      <div className="text-xs text-[#94A3B8]">На проверке</div>
                      <div className="text-sm font-bold text-[#F59E0B]">
                        {deptTasks.filter(t => t.status === 'review').length}
                      </div>
                    </div>
                    <div className="text-center py-1 rounded-lg bg-red-500/5 border border-red-500/20">
                      <div className="text-xs text-[#94A3B8]">Просрочено</div>
                      <div className="text-sm font-bold text-[#EF4444]">{overdue}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Activity Feed (Right, 1 Column size) */}
        <div className="space-y-5" id="dashboard-activity-section">
          <div className="flex items-center justify-between">
            <h2 className="text-[#F1F5F9] text-xl font-bold tracking-tight">Лента активности</h2>
            <span className="text-xs text-[#94A3B8] font-normal">В реальном времени</span>
          </div>

          <div className="bg-[#1A1D27] rounded-xl border border-[#2E3140] shadow-[0_4px_24px_rgba(0,0,0,0.4)] p-4 max-h-[460px] overflow-y-auto space-y-4" id="activity-feed-scroll">
            {activityEvents.slice(0, 8).map((event) => {
              // Get color dot by type
              let dotColor = 'bg-[#6366F1]'; // info
              switch (event.type) {
                case 'success': dotColor = 'bg-[#22C55E]'; break;
                case 'warning': dotColor = 'bg-[#F59E0B]'; break;
                case 'error': dotColor = 'bg-[#EF4444]'; break;
              }

              // Try to find the associated member's background color
              const memberObj = members.find(m => m.id === event.memberId);
              const avatarBg = memberObj?.bgColor || '#6366F1';

              return (
                <div 
                  key={event.id}
                  className="flex items-start gap-3 p-2 rounded-lg hover:bg-[#252836]/40 transition-colors duration-150 relative group"
                  id={`activity-event-${event.id}`}
                >
                  {/* Status indicator dot */}
                  <span className={`absolute left-1 top-4 w-2 h-2 rounded-full ${dotColor}`} />
                  
                  {/* Avatar bubble */}
                  <div 
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 ml-2"
                    style={{ backgroundColor: avatarBg }}
                  >
                    {event.memberAvatar}
                  </div>

                  <div className="flex-1 space-y-0.5 text-xs min-w-0">
                    <div className="flex justify-between items-baseline gap-2">
                      <span className="font-semibold text-[#F1F5F9] hover:underline cursor-pointer">
                        {event.memberName}
                      </span>
                      <span className="text-[10px] text-[#94A3B8] shrink-0 font-mono">
                        {event.time}
                      </span>
                    </div>
                    <p className="text-[#94A3B8] leading-relaxed break-words pr-2">
                      {event.action}
                    </p>
                  </div>
                </div>
              );
            })}

            {activityEvents.length === 0 && (
              <div className="text-center py-10" id="activity-empty-state">
                <p className="text-[#94A3B8] text-sm">Событий пока не зарегистрировано</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
