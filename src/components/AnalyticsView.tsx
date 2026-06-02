import React, { useState, useMemo } from 'react';
import { 
  BarChart2, 
  TrendingUp, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  Zap, 
  ChevronDown, 
  ChevronUp, 
  Award,
  Users
} from 'lucide-react';
import { Member, Department, Task } from '../types';

interface AnalyticsViewProps {
  members: Member[];
  departments: Department[];
  tasks: Task[];
}

type PeriodType = 'week' | 'month' | 'quarter';

export default function AnalyticsView({
  members,
  departments,
  tasks
}: AnalyticsViewProps) {
  
  // State variables
  const [period, setPeriod] = useState<PeriodType>('month');
  const [sortKey, setSortKey] = useState<'completed' | 'onTime' | 'overdue'>('completed');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Hardcoded Weekday stats for Custom SVG Chart
  const weekdayStats = [
    { day: 'Пн', completed: 14, overdue: 3 },
    { day: 'Вт', completed: 18, overdue: 1 },
    { day: 'Ср', completed: 16, overdue: 4 },
    { day: 'Чт', completed: 19, overdue: 2 },
    { day: 'Пт', completed: 13, overdue: 5 },
    { day: 'Сб', completed: 6, overdue: 0 },
    { day: 'Вс', completed: 4, overdue: 0 },
  ];

  // Dynamic Department Efficiencies (computed or realistic ratios for the chart)
  const deptEfficiencies = useMemo(() => {
    return departments.map(d => {
      // realistic simulate ratio of completion in time e.g. 70% + relative to completed tasks
      const deptTasks = tasks.filter(t => t.departmentId === d.id);
      const total = deptTasks.length;
      const done = deptTasks.filter(t => t.status === 'done').length;
      
      // Calculate a realistic on-time rate
      let rate = 75; // average
      if (d.id === 'development') rate = 80;
      if (d.id === 'support') rate = 92;
      if (d.id === 'design') rate = 85;
      if (d.id === 'smm') rate = 88;
      if (d.id === 'marketing') rate = 71;

      return {
        id: d.id,
        name: d.name,
        onTimePercent: rate,
        totalTasks: total,
        completedTasks: done
      };
    });
  }, [departments, tasks]);

  // Employee rankings calculations (dynamically generated based on MEMBERS and modified slightly for ranking)
  const rankedEmployees = useMemo(() => {
    return members.map((m, idx) => {
      // Simulate realistic on-time percentage
      let onTimeRate = 85; // default fallback
      if (m.id === 'm1') onTimeRate = 95;
      if (m.id === 'm5') onTimeRate = 98;
      if (m.id === 'm6') onTimeRate = 88;
      if (m.id === 'm2') onTimeRate = 84;
      if (m.id === 'm9') onTimeRate = 90;
      if (m.id === 'm15') onTimeRate = 91;
      
      return {
        ...m,
        completed: m.completedTasks,
        onTime: onTimeRate,
        overdue: m.overdueTasks
      };
    });
  }, [members]);

  // Sort Leaderboard
  const sortedLeaderboard = useMemo(() => {
    const sorted = [...rankedEmployees];
    sorted.sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
    // Return Top 10
    return sorted.slice(0, 10);
  }, [rankedEmployees, sortKey, sortOrder]);

  const handleSortLeaderboard = (key: 'completed' | 'onTime' | 'overdue') => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('desc'); // default high to low
    }
  };

  return (
    <div className="space-y-6 animate-fade-in" id="analytics-view-root">
      
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between" id="analytics-header">
        <div>
          <h2 className="text-[#F1F5F9] text-xl font-bold tracking-tight">Аналитика эффективности</h2>
          <p className="text-xs text-[#94A3B8]">Мониторинг KPI компании, сводные графики успеваемости и рейтинг лидеров</p>
        </div>

        {/* Period button selector */}
        <div className="inline-flex p-0.5 bg-[#1A1D27] rounded-lg border border-[#2E3140]" id="period-tabs">
          {[
            { id: 'week', label: 'Неделя' },
            { id: 'month', label: 'Месяц' },
            { id: 'quarter', label: 'Квартал' }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setPeriod(item.id as PeriodType)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                period === item.id 
                  ? 'bg-[#6366F1] text-white shadow' 
                  : 'text-[#94A3B8] hover:text-[#F1F5F9]'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Stats widgets grid (4 cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="analytics-kpi-grid">
        
        {/* KPI 1: On-time completion */}
        <div className="bg-[#1A1D27] p-5 rounded-xl border border-[#2E3140] shadow-[0_4px_24px_rgba(0,0,0,0.4)] flex items-center justify-between" id="kpi-card-ontime">
          <div className="space-y-1">
            <p className="text-[#94A3B8] text-[10px] font-bold uppercase tracking-widest">Выполнено в срок</p>
            <h3 className="text-2xl font-extrabold text-[#22C55E]">84%</h3>
            <p className="text-[10px] text-emerald-400 font-medium">▲ +2.4% с прошлого периода</p>
          </div>
          <div className="bg-[#22C55E]/10 p-3 rounded-lg text-[#22C55E]">
            <CheckCircle2 className="h-5 w-5" />
          </div>
        </div>

        {/* KPI 2: Avg task time */}
        <div className="bg-[#1A1D27] p-5 rounded-xl border border-[#2E3140] shadow-[0_4px_24px_rgba(0,0,0,0.4)] flex items-center justify-between" id="kpi-card-avgtime">
          <div className="space-y-1">
            <p className="text-[#94A3B8] text-[10px] font-bold uppercase tracking-widest">Среднее время задачи</p>
            <h3 className="text-2xl font-extrabold text-[#F1F5F9]">2.4 дня</h3>
            <p className="text-[10px] text-indigo-400 font-medium">Скорость соответствует норме</p>
          </div>
          <div className="bg-[#6366F1]/10 p-3 rounded-lg text-[#6366F1]">
            <Clock className="h-5 w-5" />
          </div>
        </div>

        {/* KPI 3: Performance speed */}
        <div className="bg-[#1A1D27] p-5 rounded-xl border border-[#2E3140] shadow-[0_4px_24px_rgba(0,0,0,0.4)] flex items-center justify-between" id="kpi-card-perf">
          <div className="space-y-1">
            <p className="text-[#94A3B8] text-[10px] font-bold uppercase tracking-widest">Производительность</p>
            <h3 className="text-2xl font-extrabold text-[#8B5CF6]">+12%</h3>
            <p className="text-[10px] text-violet-400 font-medium">Рост эффективности команды</p>
          </div>
          <div className="bg-[#8B5CF6]/10 p-3 rounded-lg text-[#8B5CF6]">
            <TrendingUp className="h-5 w-5" />
          </div>
        </div>

        {/* KPI 4: Company Overall Progress */}
        <div className="bg-[#1A1D27] p-5 rounded-xl border border-[#2E3140] shadow-[0_4px_24px_rgba(0,0,0,0.4)] flex items-center justify-between" id="kpi-card-progress">
          <div className="space-y-1">
            <p className="text-[#94A3B8] text-[10px] font-bold uppercase tracking-widest">Прогресс компании</p>
            <h3 className="text-2xl font-extrabold text-[#F59E0B]">71%</h3>
            <p className="text-[10px] text-[#94A3B8]">Сводный прогресс квартала</p>
          </div>
          <div className="bg-[#F59E0B]/10 p-3 rounded-lg text-[#F59E0B]">
            <Zap className="h-5 w-5" />
          </div>
        </div>

      </div>

      {/* Grid of Two Manual SVG Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" id="analytics-charts-rows">
        
        {/* CHART 1: Columns bar chart weekday stats */}
        <div className="bg-[#1A1D27] border border-[#2E3140] rounded-xl p-5 shadow-md flex flex-col" id="chart-weekdays-card">
          <div className="mb-4">
            <h3 className="text-[#F1F5F9] text-sm font-bold tracking-wide">Задачи по дням недели</h3>
            <p className="text-[11px] text-[#94A3B8]">Статистика выполненных и просроченных задач по дням</p>
          </div>

          {/* Manual SVG chart */}
          <div className="relative flex-1 min-h-[220px] flex items-center justify-center pt-2" id="svg-weekdays-container">
            <svg 
              viewBox="0 0 460 210" 
              className="w-full h-full text-xs font-semibold"
            >
              {/* Y Axis Grid lines */}
              <line x1="40" y1="20" x2="440" y2="20" stroke="#2E3140" strokeWidth="1" strokeDasharray="3 3" />
              <line x1="40" y1="60" x2="440" y2="60" stroke="#2E3140" strokeWidth="1" strokeDasharray="3 3" />
              <line x1="40" y1="100" x2="440" y2="100" stroke="#2E3140" strokeWidth="1" strokeDasharray="3 3" />
              <line x1="40" y1="140" x2="440" y2="140" stroke="#2E3140" strokeWidth="1" strokeDasharray="3 3" />
              <line x1="40" y1="170" x2="440" y2="170" stroke="#2E3140" strokeWidth="1" />

              {/* Y Axis scale text labels */}
              <text x="15" y="24" fill="#94A3B8" fontSize="9">20</text>
              <text x="15" y="64" fill="#94A3B8" fontSize="9">15</text>
              <text x="15" y="104" fill="#94A3B8" fontSize="9">10</text>
              <text x="15" y="144" fill="#94A3B8" fontSize="9">5</text>
              <text x="15" y="174" fill="#94A3B8" fontSize="9">0</text>

              {/* Loop and draw columns */}
              {weekdayStats.map((item, idx) => {
                const xOffset = 40 + idx * 56;
                
                // Calculate scale multipliers (Y range goes from y=20 (val=20) to y=170 (val=0))
                // Each unit represents (170 - 20) / 20 = 7.5 pixels
                const doneHeight = item.completed * 6.5;
                const doneY = 170 - doneHeight;

                const overdueHeight = item.overdue * 6.5;
                const overdueY = 170 - overdueHeight;

                return (
                  <g key={item.day}>
                    {/* Done Column (Green-500) */}
                    <rect 
                      x={xOffset + 10} 
                      y={doneY} 
                      width="14" 
                      height={doneHeight} 
                      fill="#22C55E" 
                      rx="3"
                      className="transition-all duration-300 hover:brightness-110"
                    />
                    
                    {/* Overdue Column (Red-500) */}
                    <rect 
                      x={xOffset + 27} 
                      y={overdueY} 
                      width="14" 
                      height={overdueHeight} 
                      fill="#EF4444" 
                      rx="3"
                      className="transition-all duration-300 hover:brightness-110"
                    />

                    {/* Weekday label text description */}
                    <text 
                      x={xOffset + 25} 
                      y="190" 
                      fill="#F1F5F9" 
                      fontSize="10" 
                      textAnchor="middle"
                      fontWeight="600"
                    >
                      {item.day}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Legend and stats indicators */}
          <div className="flex justify-center gap-6 mt-4 text-[10px] font-semibold uppercase tracking-wider text-[#94A3B8]" id="chart-legend-week">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-[#22C55E] rounded-xs" />
              <span>Выполнено</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-[#EF4444] rounded-xs" />
              <span>Просрочено</span>
            </div>
          </div>
        </div>

        {/* CHART 2: Efficiency by departments (Horizontal bars) */}
        <div className="bg-[#1A1D27] border border-[#2E3140] rounded-xl p-5 shadow-md flex flex-col" id="chart-depts-efficiency-card">
          <div className="mb-4">
            <h3 className="text-[#F1F5F9] text-sm font-bold tracking-wide">Эффективность по отделам</h3>
            <p className="text-[11px] text-[#94A3B8]">Процент выполнения задач строго в срок (SLA)</p>
          </div>

          <div className="flex-1 space-y-4" id="depts-efficiency-stack">
            {deptEfficiencies.map((dept) => {
              // Decide metric colors
              const barColor = dept.onTimePercent > 85 ? 'bg-[#22C55E]' :
                               dept.onTimePercent > 75 ? 'bg-[#6366F1]' : 'bg-[#EF4444]';

              return (
                <div key={dept.id} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-[#F1F5F9]">{dept.name}</span>
                    <span className="text-[#94A3B8]">{dept.onTimePercent}% в срок</span>
                  </div>

                  {/* Horizontal Bar progress track */}
                  <div className="w-full h-3.5 bg-[#0F1117] rounded-full overflow-hidden border border-[#2E3140]/40 p-0.5">
                    <div 
                      className={`h-full rounded-full transition-all duration-700 ${barColor}`} 
                      style={{ width: `${dept.onTimePercent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Extra SLA warning alert footer */}
          <div className="mt-4 p-2.5 bg-yellow-500/5 rounded-lg border border-yellow-500/25 flex items-center gap-2 text-[10px] text-amber-500">
            <span>⚠️</span>
            <p className="leading-snug">Минимальный согласованный уровень SLA компании: 75%. Отдел "Маркетинг" находится в желтой зоне риска.</p>
          </div>
        </div>

      </div>

      {/* RATING LEADERS LIST TABLE (TOP 10) */}
      <div className="bg-[#1A1D27] border border-[#2E3140] rounded-xl overflow-hidden shadow-md" id="leaderboard-table-card">
        <div className="p-4 bg-[#12151E] border-b border-[#2E3140] flex items-center justify-between">
          <h3 className="text-sm font-bold text-[#F1F5F9] flex items-center gap-2">
            <Award className="h-4.5 w-4.5 text-[#6366F1]" />
            Рейтинг результативности сотрудников (Топ-10)
          </h3>
          <span className="text-xs text-[#94A3B8] font-mono">Сортируемость колонок активна</span>
        </div>

        <table className="w-full text-left border-collapse table-auto text-xs" id="leaderboard-table">
          <thead>
            <tr className="border-b border-[#2E3140] text-[#94A3B8] bg-[#0F1117]/50 font-semibold select-none">
              <th className="p-3 text-center w-[60px]">Место</th>
              <th className="p-3">Сотрудник</th>
              <th className="p-3 text-center">Отдел</th>
              
              <th 
                onClick={() => handleSortLeaderboard('completed')}
                className="p-3 text-center hover:text-[#F1F5F9] cursor-pointer"
              >
                <div className="flex items-center justify-center gap-1">
                  Выполнено <ChevronsUpDown className="h-3.5 w-3.5" />
                </div>
              </th>

              <th 
                onClick={() => handleSortLeaderboard('onTime')}
                className="p-3 text-center hover:text-[#F1F5F9] cursor-pointer"
              >
                <div className="flex items-center justify-center gap-1">
                  В срок% <ChevronsUpDown className="h-3.5 w-3.5" />
                </div>
              </th>

              <th 
                onClick={() => handleSortLeaderboard('overdue')}
                className="p-3 text-center hover:text-[#F1F5F9] cursor-pointer"
              >
                <div className="flex items-center justify-center gap-1">
                  Просрочено <ChevronsUpDown className="h-3.5 w-3.5" />
                </div>
              </th>

              <th className="p-3 text-center">Загруженность</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-[#2E3140]/45 text-[#F1F5F9]" id="leaderboard-body">
            {sortedLeaderboard.map((member, idx) => {
              const dept = departments.find(d => d.id === member.departmentId);
              
              return (
                <tr 
                  key={member.id}
                  className="hover:bg-[#252836]/35 transition-colors duration-150"
                  id={`leaderboard-row-${member.id}`}
                >
                  
                  {/* Medal place */}
                  <td className="p-3 text-center font-bold">
                    <span className={`inline-flex items-center justify-center w-5.5 h-5.5 rounded-full ${
                      idx === 0 ? 'bg-amber-600/25 text-[#F59E0B] border border-amber-600/50' :
                      idx === 1 ? 'bg-slate-500/25 text-slate-300 border border-slate-500/50' :
                      idx === 2 ? 'bg-amber-800/25 text-amber-700 border border-amber-800/50' :
                      'text-[#94A3B8]/80'
                    }`}>
                      {idx + 1}
                    </span>
                  </td>

                  {/* Profile Name & role */}
                  <td className="p-3 font-semibold">
                    <div className="flex items-center gap-2.5">
                      <div 
                        className="w-6.5 h-6.5 rounded-full flex items-center justify-center text-[9px] font-bold text-white shadow-sm"
                        style={{ backgroundColor: member.bgColor }}
                      >
                        {member.avatar}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-[#F1F5F9] leading-none mb-0.5">{member.name}</p>
                        <p className="text-[10px] text-[#94A3B8]">{member.role}</p>
                      </div>
                    </div>
                  </td>

                  {/* Division */}
                  <td className="p-3 text-center font-semibold text-[#94A3B8]">
                    {dept?.name || member.departmentId}
                  </td>

                  {/* Done tasks */}
                  <td className="p-3 text-center font-mono font-bold text-[#22C55E]">
                    {member.completed}
                  </td>

                  {/* On time rate % */}
                  <td className="p-3 text-center font-mono font-bold tracking-wide">
                    <span className={`${
                      member.onTime > 90 ? 'text-[#22C55E]' :
                      member.onTime > 80 ? 'text-[#6366F1]' : 'text-[#EF4444]'
                    }`}>{member.onTime}%</span>
                  </td>

                  {/* Overdue tasks */}
                  <td className="p-3 text-center font-mono font-bold text-[#EF4444]">
                    {member.overdue}
                  </td>

                  {/* Load bar representation */}
                  <td className="p-3">
                    <div className="flex items-center gap-2 max-w-[100px] mx-auto">
                      <div className="flex-1 bg-[#12151E] h-1.5 rounded-full overflow-hidden border border-[#2E3140]/30">
                        <div 
                          className="h-full bg-gradient-to-r from-[#6366F1] to-[#8B5CF6]" 
                          style={{ width: `${member.workload}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-mono text-[#94A3B8] font-semibold shrink-0">{member.workload}%</span>
                    </div>
                  </td>

                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

    </div>
  );
}

// Helper icons mapping inside component
function ChevronsUpDown(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m21 16-4 4-4-4" />
      <path d="M17 20V4" />
      <path d="m3 8 4-4 4 4" />
      <path d="M7 4v16" />
    </svg>
  );
}
