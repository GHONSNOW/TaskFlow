import React, { useState } from 'react';
import { Users, UserPlus, Mail, ShieldAlert, Award, Radio, CheckSquare, Briefcase, Plus, X, ShieldCheck, Check, Trash2 } from 'lucide-react';
import { Member, Department } from '../types';

interface TeamViewProps {
  members: Member[];
  departments: Department[];
  onAddMember: (newMember: Member) => void;
  onSelectMemberForTasks: (memberId: string) => void;
  currentUserRole: string;
  onUpdateMemberRoleAndDepartment: (memberId: string, role: string, departmentId: string) => void;
  onDeleteMember: (memberId: string) => void;
}

const ROLE_LABELS: Record<string, string> = {
  owner: 'Владелец / Директор',
  administrator: 'Администратор',
  developer: 'Разработчик',
  smm: 'SMM специалист',
  marketing: 'Маркетолог',
  designer: 'Дизайнер',
  operator: 'Оператор техподдержки',
  guest: 'Новый (Без роли)'
};

const ROLE_COLORS: Record<string, string> = {
  owner: 'text-red-400 bg-red-500/10 border-red-500/20',
  administrator: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
  developer: 'text-[#6366F1] bg-[#6366F1]/10 border-[#6366F1]/20',
  smm: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  marketing: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  designer: 'text-fuchsia-400 bg-fuchsia-500/10 border-fuchsia-500/20',
  operator: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
  guest: 'text-gray-400 bg-gray-500/10 border-gray-500/20'
};

export default function TeamView({
  members,
  departments,
  onAddMember,
  onSelectMemberForTasks,
  currentUserRole,
  onUpdateMemberRoleAndDepartment,
  onDeleteMember
}: TeamViewProps) {
  
  // Local state for "Add Employee" modal dialog
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [name, setName] = useState('');
  const [roleInput, setRoleInput] = useState('');
  const [departmentId, setDepartmentId] = useState(departments[0]?.id || 'development');
  const [workload, setWorkload] = useState(50);
  const [isOnline, setIsOnline] = useState(true);

  // Editing state for active users roles
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [editRole, setEditRole] = useState('developer');
  const [editDept, setEditDept] = useState('development');

  // Separating registered guest candidates vs active staff
  const pendingCandidates = members.filter(m => m.role === 'guest');
  const approvedStaff = members.filter(m => m.role !== 'guest');

  const isAdmin = currentUserRole === 'owner' || currentUserRole === 'administrator';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !roleInput.trim()) return;

    // Generate Initials
    const names = name.trim().split(' ');
    let init = 'С';
    if (names.length >= 2) {
      init = `${names[0][0]}${names[1][0]}`.toUpperCase();
    } else if (names.length === 1 && names[0].length > 1) {
      init = `${names[0][0]}${names[0][1]}`.toUpperCase();
    }

    // Array of beautiful distinct colors for avatars
    const colors = ['#EF4444', '#EC4899', '#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#06B6D4', '#14B8A6'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    const created: Member = {
      id: `m-${Math.random().toString(36).substring(2, 9)}`,
      name: name.trim(),
      avatar: init,
      bgColor: randomColor,
      role: 'developer', // Default assign
      departmentId,
      isOnline,
      activeTasks: 0,
      completedTasks: 0,
      overdueTasks: 0,
      workload: Math.min(100, Math.max(0, workload))
    };

    onAddMember(created);
    
    // Reset Form
    setName('');
    setRoleInput('');
    setWorkload(50);
    setIsAddOpen(false);
  };

  const handleUpdateRoleAndDept = (id: string, selectRole: string, selectDept: string) => {
    onUpdateMemberRoleAndDepartment(id, selectRole, selectDept);
    setEditingMemberId(null);
  };

  return (
    <div className="space-y-8 animate-fade-in" id="team-view-root">
      
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between" id="team-header">
        <div>
          <h2 className="text-[#F1F5F9] text-xl font-bold tracking-tight">Команда компании</h2>
          <p className="text-xs text-[#94A3B8]">Список сотрудников и кандидатов в приложении ({approvedStaff.length} сотрудников)</p>
        </div>

        {isAdmin && (
          <button
            onClick={() => setIsAddOpen(true)}
            className="bg-[#6366F1] hover:bg-[#5053DC] text-white font-semibold text-xs px-4 py-2.5 rounded-lg flex items-center justify-center gap-2 shadow-[0_4px_12px_rgba(99,102,241,0.25)] transition duration-150 cursor-pointer"
            id="btn-add-employee"
          >
            <UserPlus className="h-4 w-4" />
            Добавить сотрудника
          </button>
        )}
      </div>

      {/* 1. ADMINISTRATION GATEWAY - Candidates awaiting approvals */}
      {isAdmin && pendingCandidates.length > 0 && (
        <div className="bg-[#1F2232] border-2 border-dashed border-[#2E3140] rounded-xl p-5 space-y-4" id="pending-approvals-panel">
          <div className="flex items-center gap-2.5">
            <Radio className="h-5 w-5 text-amber-500 animate-pulse" />
            <div>
              <h3 className="text-sm font-bold text-[#F1F5F9]">Ожидают подтверждения ({pendingCandidates.length})</h3>
              <p className="text-[11px] text-[#94A3B8]">Пользователи зарегистрировались и ждут назначения рабочей роли</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#94A3B8] border-collapse min-w-[500px]">
              <thead>
                <tr className="border-b border-[#2E3140] text-gray-400 uppercase tracking-widest text-[9px]">
                  <th className="py-2.5 px-3">Кандидат</th>
                  <th className="py-2.5 px-3">E-mail</th>
                  <th className="py-2.5 px-3">Отдел компании</th>
                  <th className="py-2.5 px-3">Рабочая роль</th>
                  <th className="py-2.5 px-3 text-right">Управление</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2E3140]/60">
                {pendingCandidates.map((candidate) => (
                  <PendingRow 
                    key={candidate.id}
                    candidate={candidate}
                    departments={departments}
                    onApprove={(role, dept) => onUpdateMemberRoleAndDepartment(candidate.id, role, dept)}
                    onReject={() => onDeleteMember(candidate.id)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. TEAM STAFF GRID LIST */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-widest text-[#94A3B8]">Утвержденные сотрудники</h3>
        {approvedStaff.length === 0 ? (
          <div className="text-center py-10 bg-[#1A1D27] rounded-xl border border-[#2E3140] text-sm text-[#94A3B8]">
            Нет утвержденных сотрудников. Зарегистрируйтесь или одобрите новых пользователей.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5" id="team-grid">
            {approvedStaff.map((member) => {
              const dept = departments.find(d => d.id === member.departmentId);
              const isEditing = editingMemberId === member.id;
              
              return (
                <div 
                  key={member.id}
                  className="bg-[#1A1D27] border border-[#2E3140] rounded-xl p-5 shadow-[0_4px_24px_rgba(0,0,0,0.4)] flex flex-col justify-between"
                  id={`team-card-${member.id}`}
                >
                  {/* Top section with status isOnline and edits */}
                  <div>
                    <div className="flex items-start justify-between mb-4">
                      {/* Avatar */}
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div 
                            className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-md"
                            style={{ backgroundColor: member.bgColor }}
                          >
                            {member.avatar}
                          </div>
                          {/* Online sphere indicator */}
                          <span className={`absolute right-0 bottom-0 w-3 h-3 rounded-full border-2 border-[#1A1D27] ${
                            member.isOnline ? 'bg-[#22C55E]' : 'bg-gray-500'
                          }`} />
                        </div>

                        <div>
                          <h4 className="text-[#F1F5F9] font-bold text-sm tracking-wide line-clamp-1">{member.name}</h4>
                          <span className="text-[10px] text-[#94A3B8]">
                            {member.email || 'Нет e-mail'}
                          </span>
                        </div>
                      </div>

                      {/* Display tag of dept */}
                      <span className="text-[9px] px-2 py-0.5 rounded-full font-bold bg-[#12151E] text-indigo-400 border border-[#2E3140] shrink-0">
                        {dept?.name || 'Вне отделов'}
                      </span>
                    </div>

                    {/* Role Tag label */}
                    <div className="flex justify-between items-center mb-4">
                      <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold border ${ROLE_COLORS[member.role] || ROLE_COLORS.guest}`}>
                        {ROLE_LABELS[member.role] || member.role}
                      </span>
                      
                      {/* Admin edit controls trigger */}
                      {isAdmin && member.role !== 'owner' && !isEditing && (
                        <button 
                          onClick={() => {
                            setEditingMemberId(member.id);
                            setEditRole(member.role);
                            setEditDept(member.departmentId || 'development');
                          }}
                          className="text-[10px] text-[#6366F1] hover:text-[#5053DC] font-bold"
                        >
                          Редактировать
                        </button>
                      )}
                    </div>

                    {/* Editor Form for changing roles and departments */}
                    {isEditing && (
                      <div className="p-3.5 bg-[#12151E] rounded-lg border border-[#2E3140] space-y-3 mb-4">
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-[#94A3B8] uppercase">Роль/Доступ</label>
                          <select 
                            value={editRole}
                            onChange={(e) => setEditRole(e.target.value)}
                            className="w-full bg-[#0F1117] border border-[#2E3140] rounded-md px-2 py-1 text-xs text-[#F1F5F9]"
                          >
                            <option value="administrator">Администратор</option>
                            <option value="developer">Разработчик</option>
                            <option value="smm">SMM специалист</option>
                            <option value="marketing">Маркетолог</option>
                            <option value="designer">Дизайнер</option>
                            <option value="operator">Оператор техподдержки</option>
                            <option value="guest">Новый (Ограничить доступ)</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-[#94A3B8] uppercase">Отдел компании</label>
                          <select 
                            value={editDept}
                            onChange={(e) => setEditDept(e.target.value)}
                            className="w-full bg-[#0F1117] border border-[#2E3140] rounded-md px-2 py-1 text-xs text-[#F1F5F9]"
                          >
                            {departments.map(d => (
                              <option key={d.id} value={d.id}>{d.name}</option>
                            ))}
                          </select>
                        </div>

                        <div className="flex items-center justify-end gap-1.5 pt-2">
                          <button 
                            type="button"
                            onClick={() => setEditingMemberId(null)}
                            className="px-2.5 py-1 text-[10px] uppercase font-bold text-[#94A3B8] bg-[#252836] rounded"
                          >
                            Отмена
                          </button>
                          <button 
                            type="button"
                            onClick={() => handleUpdateRoleAndDept(member.id, editRole, editDept)}
                            className="px-2.5 py-1 text-[10px] uppercase font-bold text-white bg-indigo-500 rounded hover:bg-indigo-600"
                          >
                            ОК
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Metrics values block */}
                    <div className="my-4 border-t border-b border-[#2E3140]/60 py-3.5 grid grid-cols-3 gap-1 text-center font-mono">
                      <div className="px-1.5 py-1 bg-[#12151E] rounded border border-[#2E3140]/55">
                        <p className="text-[9px] text-gray-500">В работе</p>
                        <p className="text-sm font-bold text-[#6366F1]">{member.activeTasks}</p>
                      </div>

                      <div className="px-1.5 py-1 bg-[#12151E] rounded border border-[#2E3140]/55">
                        <p className="text-[9px] text-gray-500">Закрыто</p>
                        <p className="text-sm font-bold text-[#22C55E]">{member.completedTasks}</p>
                      </div>

                      <div className="px-1.5 py-1 bg-[#12151E] rounded border border-[#2E3140]/55">
                        <p className="text-[9px] text-gray-500">Истекло</p>
                        <p className="text-sm font-bold text-[#EF4444]">{member.overdueTasks}</p>
                      </div>
                    </div>
                  </div>

                  {/* Buttons controls */}
                  <div className="space-y-2">
                    <button
                      onClick={() => onSelectMemberForTasks(member.id)}
                      className="w-full bg-[#252836] hover:bg-[#6366F1] text-[#94A3B8] hover:text-white transition duration-200 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <CheckSquare className="h-4 w-4" />
                      Смотреть задачи
                    </button>

                    {isAdmin && member.role !== 'owner' && (
                      <button
                        onClick={() => {
                          if (confirm(`Вы действительно хотите удалить профиль ${member.name}?`)) {
                            onDeleteMember(member.id);
                          }
                        }}
                        className="w-full text-red-500 hover:text-red-400 hover:bg-red-500/5 transition py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Trash2 className="h-4 w-4" />
                        Удалить сотрудника
                      </button>
                    )}
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* QUICK ADD EMPLOYEE DIALOG MODAL */}
      {isAddOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
          onClick={() => setIsAddOpen(false)}
          id="add-team-modal-overlay"
        >
          <div 
            className="bg-[#1A1D27] border border-[#2E3140] w-full max-w-md rounded-xl shadow-[0_4px_24px_rgba(0,0,0,0.5)] p-5 space-y-4 relative text-[#F1F5F9]"
            onClick={(e) => e.stopPropagation()}
            id="add-team-modal-card"
          >
            <div className="flex items-center justify-between border-b border-[#2E3140] pb-3" id="add-team-modal-head">
              <h3 className="text-base font-bold flex items-center gap-1.5">
                <UserPlus className="h-5 w-5 text-[#6366F1]" />
                Новый сотрудник
              </h3>
              <button onClick={() => setIsAddOpen(false)} className="text-[#94A3B8] hover:text-[#F1F5F9]">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs text-[#94A3B8] font-bold uppercase tracking-wider">ФИО сотрудника</label>
                <input 
                  type="text"
                  required
                  placeholder="Роман Чернов"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#0F1117] border border-[#2E3140] rounded-lg px-3 py-2 text-sm text-[#F1F5F9] focus:outline-none focus:border-[#6366F1]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-[#94A3B8] font-bold uppercase tracking-wider">Должность (Отображаемая)</label>
                <input 
                  type="text"
                  required
                  placeholder="Например: Frontend Developer"
                  value={roleInput}
                  onChange={(e) => setRoleInput(e.target.value)}
                  className="w-full bg-[#0F1117] border border-[#2E3140] rounded-lg px-3 py-2 text-sm text-[#F1F5F9] focus:outline-none focus:border-[#6366F1]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-[#94A3B8] font-bold uppercase tracking-wider">Отдел</label>
                <select 
                  value={departmentId}
                  onChange={(e) => setDepartmentId(e.target.value)}
                  className="w-full bg-[#0F1117] border border-[#2E3140] rounded-lg px-3 py-2 text-sm text-[#F1F5F9] focus:outline-none focus:border-[#6366F1]"
                >
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-[#94A3B8]">
                  <span>Запланированная нагрузка</span>
                  <span className="text-indigo-400">{workload}%</span>
                </div>
                <input 
                  type="range"
                  min="10"
                  max="100"
                  value={workload}
                  onChange={(e) => setWorkload(Number(e.target.value))}
                  className="w-full h-1.5 bg-[#0F1117] rounded-lg appearance-none cursor-pointer accent-[#6366F1]"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#2E3140]">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-[#94A3B8] bg-[#252836] rounded-lg hover:text-[#F1F5F9]"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold uppercase tracking-wide bg-[#6366F1] hover:bg-[#5053DC] text-white rounded-lg transition"
                >
                  Добавить
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}

// Child component row to handle local dropdown selections for approvals
interface PendingRowProps {
  key?: string;
  candidate: Member;
  departments: Department[];
  onApprove: (role: string, departmentId: string) => void;
  onReject: () => void;
}

function PendingRow({ candidate, departments, onApprove, onReject }: PendingRowProps) {
  const [role, setRole] = useState('operator');
  const [deptId, setDeptId] = useState(departments[0]?.id || 'development');

  return (
    <tr className="border-b border-[#2E3140]/30 hover:bg-[#1A1D27]/30 transition-colors text-xs text-[#F1F5F9]">
      <td className="py-3 px-3 font-semibold">{candidate.name}</td>
      <td className="py-3 px-3 text-[#94A3B8] font-mono select-all">{candidate.email || '—'}</td>
      
      {/* Department Dropdown */}
      <td className="py-3 px-3">
        <select 
          value={deptId}
          onChange={(e) => setDeptId(e.target.value)}
          className="bg-[#12151E] border border-[#2E3140] rounded px-2.5 py-1 text-xs focus:outline-none focus:border-[#6366F1]"
        >
          {departments.map((d) => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>
      </td>

      {/* Role Assign Dropdown */}
      <td className="py-3 px-3">
        <select 
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="bg-[#12151E] border border-[#2E3140] rounded px-2.5 py-1 text-xs focus:outline-none focus:border-[#6366F1]"
        >
          <option value="developer">Разработчик</option>
          <option value="smm">SMM специалист</option>
          <option value="marketing">Маркетолог</option>
          <option value="designer">Дизайнер</option>
          <option value="operator">Оператор техподдержки</option>
          <option value="administrator">Администратор</option>
        </select>
      </td>

      {/* Action Controls */}
      <td className="py-3 px-3 text-right">
        <div className="flex items-center justify-end gap-2">
          {/* Approve button */}
          <button
            onClick={() => onApprove(role, deptId)}
            className="p-1 px-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded font-bold text-[11px] uppercase tracking-wider flex items-center justify-center gap-1 cursor-pointer transition"
            title="Одобрить и назначить роль"
          >
            <Check className="h-3 w-3" /> Одобрить
          </button>
          
          {/* Reject button */}
          <button
            onClick={() => {
              if (confirm(`Вы хотите отклонить регистрацию ${candidate.name}?`)) {
                onReject();
              }
            }}
            className="p-1 px-2.5 bg-[#252836] hover:bg-red-500/10 hover:text-red-400 text-gray-400 rounded transition cursor-pointer"
            title="Отклонить регистрацию"
          >
            Отклонить
          </button>
        </div>
      </td>
    </tr>
  );
}
