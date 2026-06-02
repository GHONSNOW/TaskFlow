import React, { useState, useEffect, useRef } from 'react';
import { X, Calendar, Tag, AlertTriangle, Users } from 'lucide-react';
import { Task, TaskPriority, TaskStatus, Department, Member } from '../types';

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  departments: Department[];
  members: Member[];
  onCreateTask: (taskData: Omit<Task, 'id' | 'createdAt' | 'creatorId' | 'history' | 'comments' | 'attachments' | 'loggedTime'>) => void;
}

export default function CreateTaskModal({
  isOpen,
  onClose,
  departments,
  members,
  onCreateTask,
}: CreateTaskModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const tagInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [departmentId, setDepartmentId] = useState(departments[0]?.id || '');
  const [assigneeId, setAssigneeId] = useState(''); // can be expanded, but select allows single for simplicity, mapping to assigneeIds
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [deadline, setDeadline] = useState(new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0]); // 3 days in future default
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>(['Проект', 'Срочно']);

  // Filter members by department
  const filteredMembers = members.filter(m => m.departmentId === departmentId);

  // Whenever department changes, reset selected assignee to first available in that department
  useEffect(() => {
    if (filteredMembers.length > 0) {
      setAssigneeId(filteredMembers[0].id);
    } else {
      setAssigneeId('');
    }
  }, [departmentId]);

  // Handle Close with Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Click outside to close
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      onClose();
    }
  };

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const cleanTag = tagInput.trim();
      if (cleanTag && !tags.includes(cleanTag)) {
        setTags([...tags, cleanTag]);
        setTagInput('');
      }
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onCreateTask({
      title: title.trim(),
      description: description.trim() || 'Описание отсутствует',
      departmentId,
      assigneeIds: assigneeId ? [assigneeId] : [],
      priority,
      status: 'new', // always 'new' at startup
      deadline,
      checklist: [], // starts empty
      tags,
    });

    // Reset Form
    setTitle('');
    setDescription('');
    setDepartmentId(departments[0]?.id || '');
    setPriority('medium');
    setTags(['Проект', 'Срочно']);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto"
      onClick={handleOverlayClick}
      id="create-task-modal-overlay"
    >
      <div 
        ref={modalRef}
        className="relative bg-[#1A1D27] border border-[#2E3140] rounded-xl shadow-[0_4px_24px_rgba(0,0,0,0.4)] w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] animate-scale-in"
        id="create-task-modal-card"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#2E3140]" id="create-modal-header">
          <h3 className="text-lg font-bold text-[#F1F5F9] flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#6366F1]" />
            Создание новой задачи
          </h3>
          <button 
            type="button"
            onClick={onClose}
            className="text-[#94A3B8] hover:text-[#F1F5F9] p-1 rounded-lg hover:bg-[#252836] transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Form Scrollable */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4" id="create-task-form">
          
          {/* Title */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#94A3B8]">
              Название задачи <span className="text-[#EF4444]">*</span>
            </label>
            <input 
              type="text"
              required
              placeholder="Например: Сверстать новый UI главной страницы"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-[#0F1117] border border-[#2E3140] rounded-lg px-3 py-2 text-[#F1F5F9] placeholder-[#94A3B8]/40 focus:outline-none focus:ring-2 focus:ring-[#6366F1]/50 focus:border-[#6366F1] transition-all"
              id="create-input-title"
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#94A3B8]">
              Описание задачи
            </label>
            <textarea 
              rows={3}
              placeholder="Подробно распишите требования, ожидаемый результат и технические ссылки..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-[#0F1117] border border-[#2E3140] rounded-lg px-3 py-2 text-[#F1F5F9] placeholder-[#94A3B8]/40 focus:outline-none focus:ring-2 focus:ring-[#6366F1]/50 focus:border-[#6366F1] transition-all resize-none"
              id="create-textarea-desc"
            />
          </div>

          {/* Department & Assignee (depends on department) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#94A3B8]">
                Отдел
              </label>
              <select 
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
                className="w-full bg-[#0F1117] border border-[#2E3140] rounded-lg px-3 py-2 text-[#F1F5F9] focus:outline-none focus:ring-2 focus:ring-[#6366F1]/50 focus:border-[#6366F1] transition-all"
                id="create-select-dept"
              >
                {departments.map(dept => (
                  <option key={dept.id} value={dept.id} className="bg-[#1A1D27]">{dept.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#94A3B8]">
                Исполнитель
              </label>
              <select 
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
                className="w-full bg-[#0F1117] border border-[#2E3140] rounded-lg px-3 py-2 text-[#F1F5F9] focus:outline-none focus:ring-2 focus:ring-[#6366F1]/50 focus:border-[#6366F1] transition-all"
                id="create-select-assignee"
              >
                {filteredMembers.map(m => (
                  <option key={m.id} value={m.id} className="bg-[#1A1D27]">{m.name} ({m.role})</option>
                ))}
                {filteredMembers.length === 0 && (
                  <option value="" disabled className="bg-[#1A1D27]">Нет сотрудников в отделе</option>
                )}
              </select>
            </div>

          </div>

          {/* Priority (4 Pill Buttons with colors) */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#94A3B8]">
              Приоритет задачи
            </label>
            <div className="grid grid-cols-4 gap-2" id="priority-choices-grid">
              
              {/* Critical */}
              <button
                type="button"
                onClick={() => setPriority('critical')}
                className={`flex flex-col items-center justify-center p-2 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                  priority === 'critical' 
                    ? 'border-[#EF4444] bg-[#EF4444]/15 text-[#EF4444]' 
                    : 'border-[#2E3140] bg-[#0F1117] text-[#94A3B8] hover:border-[#EF4444]/40 hover:text-[#EF4444]'
                }`}
                id="priority-select-critical"
              >
                <span className="w-2.5 h-2.5 rounded-full bg-[#EF4444] mb-1.5 shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
                Критический
              </button>

              {/* High */}
              <button
                type="button"
                onClick={() => setPriority('high')}
                className={`flex flex-col items-center justify-center p-2 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                  priority === 'high' 
                    ? 'border-[#F59E0B] bg-[#F59E0B]/15 text-[#F59E0B]' 
                    : 'border-[#2E3140] bg-[#0F1117] text-[#94A3B8] hover:border-[#F59E0B]/40 hover:text-[#F59E0B]'
                }`}
                id="priority-select-high"
              >
                <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B] mb-1.5 shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
                Высокий
              </button>

              {/* Medium */}
              <button
                type="button"
                onClick={() => setPriority('medium')}
                className={`flex flex-col items-center justify-center p-2 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                  priority === 'medium' 
                    ? 'border-[#6366F1] bg-[#6366F1]/15 text-[#6366F1]' 
                    : 'border-[#2E3140] bg-[#0F1117] text-[#94A3B8] hover:border-[#6366F1]/40 hover:text-[#6366F1]'
                }`}
                id="priority-select-medium"
              >
                <span className="w-2.5 h-2.5 rounded-full bg-[#6366F1] mb-1.5 shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
                Средний
              </button>

              {/* Low */}
              <button
                type="button"
                onClick={() => setPriority('low')}
                className={`flex flex-col items-center justify-center p-2 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                  priority === 'low' 
                    ? 'border-[#6B7280] bg-[#6B7280]/15 text-[#94A3B8]' 
                    : 'border-[#2E3140] bg-[#0F1117] text-[#94A3B8] hover:border-[#6B7280]/65 hover:text-[#94A3B8]'
                }`}
                id="priority-select-low"
              >
                <span className="w-2.5 h-2.5 rounded-full bg-[#6B7280] mb-1.5" />
                Низкий
              </button>

            </div>
          </div>

          {/* Deadline Picker */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#94A3B8]">
              Срок выполнения (Дедлайн)
            </label>
            <div className="relative">
              <input 
                type="date"
                required
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full bg-[#0F1117] border border-[#2E3140] rounded-lg px-3 py-2 text-[#F1F5F9] focus:outline-none focus:ring-2 focus:ring-[#6366F1]/50 focus:border-[#6366F1] transition-all pl-10"
                id="create-input-deadline"
              />
              <Calendar className="absolute left-3 top-2.5 h-4.5 w-4.5 text-[#94A3B8]" />
            </div>
          </div>

          {/* Tags (Type Enter to add tag) */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#94A3B8]">
              Теги задачи (Нажмите Enter)
            </label>
            <div className="flex flex-wrap gap-1.5 p-2 bg-[#0F1117] border border-[#2E3140] rounded-lg min-h-[42px]" id="tags-wrapper">
              {tags.map((tag) => (
                <span 
                  key={tag}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-[#8B5CF6]/15 text-[#8B5CF6] border border-[#8B5CF6]/30 animate-fade-in"
                >
                  {tag}
                  <button 
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="text-[#8B5CF6] hover:text-[#F1F5F9] focus:outline-none rounded-full"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
              <input 
                ref={tagInputRef}
                type="text"
                placeholder={tags.length === 0 ? "Введите тег и нажмите Enter..." : ""}
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleAddTag}
                className="flex-1 bg-transparent border-0 outline-none p-0.5 text-xs text-[#F1F5F9] placeholder-[#94A3B8]/30 min-w-[120px]"
                id="create-tag-input"
              />
            </div>
          </div>

          {/* Action Footer Button Bar inside form */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#2E3140]" id="create-modal-footer">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-[#252836] hover:bg-[#2E3140] text-[#94A3B8] hover:text-[#F1F5F9] text-sm font-semibold transition-colors duration-150 cursor-pointer"
            >
              Отмена
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-[#6366F1] hover:bg-[#5053DC] text-white text-sm font-semibold shadow-[0_4px_12px_rgba(99,102,241,0.3)] hover:shadow-[0_4px_16px_rgba(99,102,241,0.5)] transition-all duration-150 cursor-pointer"
            >
              Создать задачу
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
