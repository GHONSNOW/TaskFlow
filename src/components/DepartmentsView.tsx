import React from 'react';
import { 
  Code2, 
  Megaphone, 
  TrendingUp, 
  Palette, 
  Headphones, 
  User, 
  FileText, 
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { Department, Member, Task } from '../types';

interface DepartmentsViewProps {
  departments: Department[];
  members: Member[];
  tasks: Task[];
  onOpenDepartmentTasks: (deptId: string) => void;
}

export default function DepartmentsView({
  departments,
  members,
  tasks,
  onOpenDepartmentTasks
}: DepartmentsViewProps) {
  
  // Virtual Today
  const TODAY_STR = '2026-06-02';

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
    <div className="space-y-6 animate-fade-in" id="departments-view-root">
      
      {/* Title */}
      <div>
        <h2 className="text-[#F1F5F9] text-xl font-bold tracking-tight">Отделы компании</h2>
        <p className="text-xs text-[#94A3B8]">Организационная структура, руководители и общая эффективность подразделений</p>
      </div>

      {/* Grid of 2 columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" id="departments-cards-grid">
        {departments.map((dept) => {
          // Dynamic query metrics from real state
          const deptMembers = members.filter(m => m.departmentId === dept.id);
          const managerObj = members.find(m => m.id === dept.managerId);
          
          const deptTasks = tasks.filter(t => t.departmentId === dept.id);
          const totalTasks = deptTasks.length;
          const completedTasks = deptTasks.filter(t => t.status === 'done').length;
          const activeTasks = deptTasks.filter(t => t.status !== 'done').length;
          const overdueTasks = deptTasks.filter(t => t.status !== 'done' && t.deadline < TODAY_STR).length;

          // Completion percent for the circle load gauge
          const percent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

          // SVG geometry calculations
          const radius = 38;
          const circumference = 2 * Math.PI * radius;
          const strokeDashoffset = circumference - (percent / 100) * circumference;

          return (
            <div 
              key={dept.id}
              className="bg-[#1A1D27] border border-[#2E3140] rounded-xl p-6 shadow-[0_4px_24px_rgba(0,0,0,0.4)] hover:scale-[1.01] hover:brightness-[1.03] transition-all duration-200 flex flex-col sm:flex-row justify-between gap-6"
              id={`dept-expanded-card-${dept.id}`}
            >
              
              {/* Left Column: Descriptions, Staff stats */}
              <div className="flex-1 space-y-4" id={`left-column-dept-${dept.id}`}>
                
                {/* Header */}
                <div className="space-y-1.5 animate-fade-in">
                  <div className="flex items-center gap-3">
                    <div className="bg-[#252836] p-2.5 rounded-lg text-[#8B5CF6]">
                      {renderDeptIcon(dept.iconName, 'h-6 w-6')}
                    </div>
                    <h3 className="text-[#F1F5F9] text-lg font-bold tracking-wide">{dept.name}</h3>
                  </div>
                  <p className="text-xs text-[#94A3B8] leading-relaxed pr-2">
                    {dept.description}
                  </p>
                </div>

                {/* Manager section */}
                <div className="p-3 bg-[#0F1117] border border-[#2E3140]/60 rounded-xl space-y-2">
                  <p className="text-[10px] text-[#94A3B8] font-bold uppercase tracking-wider">Руководитель отдела</p>
                  
                  {managerObj ? (
                    <div className="flex items-center gap-2.5">
                      <div 
                        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shadow"
                        style={{ backgroundColor: managerObj.bgColor }}
                      >
                        {managerObj.avatar}
                      </div>
                      <div>
                        <h4 className="text-xs font-semibold text-[#F1F5F9]">{managerObj.name}</h4>
                        <p className="text-[10px] text-[#94A3B8]">{managerObj.role}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-[#EF4444] italic font-medium">Руководитель не назначен</p>
                  )}
                </div>

                {/* Staff avatars stack */}
                <div className="space-y-1.5">
                  <p className="text-[10px] text-[#94A3B8] font-bold uppercase tracking-wider">Штат сотрудников ({deptMembers.length})</p>
                  
                  <div className="flex items-center gap-3">
                    <div className="flex -space-x-2 overflow-hidden">
                      {deptMembers.map((emp) => (
                        <div 
                          key={emp.id}
                          className="w-7 h-7 rounded-full border-2 border-[#1A1D27] flex items-center justify-center text-[9px] font-bold text-white shadow-sm shrink-0"
                          style={{ backgroundColor: emp.bgColor }}
                          title={emp.name}
                        >
                          {emp.avatar}
                        </div>
                      ))}
                    </div>

                    <span className="text-xs font-semibold text-[#94A3B8]">
                      {deptMembers.length > 5 ? `и еще ${deptMembers.length - 5} сотрудников` : 'в штате отдела'}
                    </span>
                  </div>
                </div>

              </div>

              {/* Right Column: Circular SVG Progress bar & Numeric Stats block */}
              <div className="w-full sm:w-[150px] flex flex-col items-center justify-between border-t sm:border-t-0 sm:border-l border-[#2E3140]/50 pt-5 sm:pt-0 sm:pl-6 shrink-0" id="dept-stats-right">
                
                {/* SVG Circular Progress meter */}
                <div className="relative w-24 h-24" id="circular-progress-meter">
                  <svg className="w-full h-full rotate-[-90deg]">
                    
                    {/* Background track circle */}
                    <circle 
                      cx="48" 
                      cy="48" 
                      r={radius} 
                      className="stroke-[#252836] fill-none"
                      strokeWidth="7"
                    />

                    {/* Progress stroke line circle */}
                    <circle 
                      cx="48" 
                      cy="48" 
                      r={radius} 
                      className="stroke-[#6366F1] fill-none transition-all duration-700"
                      strokeWidth="7"
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                      strokeLinecap="round"
                    />

                  </svg>

                  {/* Centered text box */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center font-sans">
                    <span className="text-base font-extrabold text-white leading-none">{percent}%</span>
                    <span className="text-[8px] text-[#94A3B8] font-bold tracking-wider mt-1 uppercase">Готово</span>
                  </div>
                </div>

                {/* Vertical numerical metrics */}
                <div className="w-full space-y-1.5 text-center mt-3 font-mono">
                  <div className="flex justify-between text-[11px] text-[#94A3B8]">
                    <span>Активных:</span>
                    <span className="font-extrabold text-white">{activeTasks}</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-[#94A3B8]">
                    <span>Просрочено:</span>
                    <span className={`font-extrabold ${overdueTasks > 0 ? 'text-[#EF4444]' : 'text-[#94A3B8]'}`}>
                      {overdueTasks}
                    </span>
                  </div>
                  <div className="flex justify-between text-[11px] text-[#94A3B8]">
                    <span>Всего задач:</span>
                    <span className="font-extrabold text-[#8B5CF6]">{totalTasks}</span>
                  </div>
                </div>

                {/* Switch list action filter */}
                <button
                  onClick={() => onOpenDepartmentTasks(dept.id)}
                  className="w-full mt-4 bg-[#252836] hover:bg-[#6366F1] hover:text-white text-[#F1F5F9] rounded-lg py-2 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all text-center cursor-pointer"
                  id={`open-dept-tasks-${dept.id}`}
                >
                  Открыть отдел
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>

              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
}
