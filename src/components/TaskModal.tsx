import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  CheckSquare, 
  Clock, 
  Plus, 
  MessageSquare, 
  Paperclip, 
  Trash2, 
  FileText, 
  Calendar, 
  Bookmark, 
  User, 
  Sliders, 
  ChevronDown, 
  ChevronUp,
  RotateCcw
} from 'lucide-react';
import { Task, TaskPriority, TaskStatus, Department, Member, Comment, ChecklistItem, TaskAttachment } from '../types';

interface TaskModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  departments: Department[];
  members: Member[];
  onUpdateTask: (updatedTask: Task) => void;
  currentUserId: string; // 'm1' as default Owner
}

export default function TaskModal({
  task,
  isOpen,
  onClose,
  departments,
  members,
  onUpdateTask,
  currentUserId,
}: TaskModalProps) {
  if (!task || !isOpen) return null;

  const modalRef = useRef<HTMLDivElement>(null);
  const currentUser = members.find(m => m.id === currentUserId) || members[0];

  // Fields state synchronized when task changes
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description);
  const [status, setStatus] = useState<TaskStatus>(task.status);
  const [priority, setPriority] = useState<TaskPriority>(task.priority);
  const [departmentId, setDepartmentId] = useState(task.departmentId);
  const [assigneeIds, setAssigneeIds] = useState<string[]>(task.assigneeIds);
  const [deadline, setDeadline] = useState(task.deadline);
  const [loggedTime, setLoggedTime] = useState(task.loggedTime);
  const [newTagVal, setNewTagVal] = useState('');
  const [tags, setTags] = useState<string[]>(task.tags);
  
  // Checklist and Comments input states
  const [newSubtask, setNewSubtask] = useState('');
  const [newCommentText, setNewCommentText] = useState('');
  
  // Accordion state
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // Sync state whenever the task updates (e.g. from outside or internally)
  useEffect(() => {
    setTitle(task.title);
    setDescription(task.description);
    setStatus(task.status);
    setPriority(task.priority);
    setDepartmentId(task.departmentId);
    setAssigneeIds(task.assigneeIds);
    setDeadline(task.deadline);
    setLoggedTime(task.loggedTime);
    setTags(task.tags);
  }, [task]);

  // Escape key close listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Click outside to close
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      onClose();
    }
  };

  const notifyChange = (changes: Partial<Task>, logMessage?: string) => {
    if (!task) return;
    
    // Auto add a history log entry
    const historyEntry = logMessage ? {
      id: Math.random().toString(36).substring(2, 9),
      text: logMessage,
      time: new Date().toLocaleString('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } : null;

    const newHistory = historyEntry ? [historyEntry, ...task.history] : task.history;

    const updated: Task = {
      ...task,
      ...changes,
      history: newHistory
    };
    onUpdateTask(updated);
  };

  // Input edits updates
  const handleTitleBlur = () => {
    if (title.trim() && title !== task.title) {
       notifyChange({ title: title.trim() }, `Название изменено на "${title.trim()}" пользователем ${currentUser.name}`);
    }
  };

  const handleDescBlur = () => {
    if (description !== task.description) {
       notifyChange({ description }, `Описание задачи обновлено пользователем ${currentUser.name}`);
    }
  };

  const handleStatusChange = (newStatus: TaskStatus) => {
    setStatus(newStatus);
    const statusLabels: Record<TaskStatus, string> = {
      new: 'Новая',
      in_progress: 'В работе',
      review: 'На проверке',
      changes: 'Нужны правки',
      done: 'Выполнена'
    };
    notifyChange({ status: newStatus }, `Статус изменен на "${statusLabels[newStatus]}" пользователем ${currentUser.name}`);
  };

  const handlePriorityChange = (newPriority: TaskPriority) => {
    setPriority(newPriority);
    const priorityLabels: Record<TaskPriority, string> = {
      critical: 'Критический',
      high: 'Высокий',
      medium: 'Средний',
      low: 'Низкий'
    };
    notifyChange({ priority: newPriority }, `Приоритет изменен на "${priorityLabels[newPriority]}" пользователем ${currentUser.name}`);
  };

  const handleDeptChange = (newDeptId: string) => {
    setDepartmentId(newDeptId);
    // Reset assignees to empty if transitioning departments
    setAssigneeIds([]);
    const deptName = departments.find(d => d.id === newDeptId)?.name || newDeptId;
    notifyChange({ 
      departmentId: newDeptId,
      assigneeIds: []
    }, `Отдел изменен на "${deptName}" (исполнители сброшены) пользователем ${currentUser.name}`);
  };

  const handleToggleAssignee = (mId: string) => {
    const updatedAssignees = assigneeIds.includes(mId)
      ? assigneeIds.filter(id => id !== mId)
      : [...assigneeIds, mId];
    
    setAssigneeIds(updatedAssignees);
    const mName = members.find(m => m.id === mId)?.name || 'соперник';
    const verb = updatedAssignees.includes(mId) ? 'назначен исполнителем' : 'снят с задачи';
    notifyChange({ assigneeIds: updatedAssignees }, `${currentUser.name} обновил состав: ${mName} ${verb}`);
  };

  const handleDeadlineChange = (val: string) => {
    setDeadline(val);
    notifyChange({ deadline: val }, `Дедлайн изменен на ${val} пользователем ${currentUser.name}`);
  };

  const handleLoggedTimeBlur = () => {
    if (loggedTime !== task.loggedTime) {
      notifyChange({ loggedTime }, `Затрачено времени обновлено на "${loggedTime}" пользователем ${currentUser.name}`);
    }
  };

  // Tags Subsystem
  const handleAddTag = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newTagVal.trim();
    if (clean && !tags.includes(clean)) {
      const updated = [...tags, clean];
      setTags(updated);
      setNewTagVal('');
      notifyChange({ tags: updated }, `Добавлен тег "${clean}" пользователем ${currentUser.name}`);
    }
  };

  const handleRemoveTag = (tag: string) => {
    const updated = tags.filter(t => t !== tag);
    setTags(updated);
    notifyChange({ tags: updated }, `Удален тег "${tag}" пользователем ${currentUser.name}`);
  };

  // Checklist Checkboxes Subsystem
  const handleToggleChecklist = (itemId: string) => {
    const updatedChecklist = task.checklist.map(item => {
      if (item.id === itemId) {
        return { ...item, isDone: !item.isDone };
      }
      return item;
    });
    
    const toggledItem = task.checklist.find(i => i.id === itemId);
    const act = toggledItem?.isDone ? 'снял отметку выполнения с' : 'выполнил подзадачу';

    notifyChange({ checklist: updatedChecklist }, `${currentUser.name} ${act} "${toggledItem?.text}"`);
  };

  const handleAddSubtask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtask.trim()) return;

    const newItem: ChecklistItem = {
      id: Math.random().toString(36).substring(2, 9),
      text: newSubtask.trim(),
      isDone: false
    };

    const updatedChecklist = [...task.checklist, newItem];
    setNewSubtask('');
    notifyChange({ checklist: updatedChecklist }, `Добавлена подзадача "${newItem.text}" пользователем ${currentUser.name}`);
  };

  const handleRemoveSubtask = (itemId: string) => {
    const item = task.checklist.find(i => i.id === itemId);
    const updatedChecklist = task.checklist.filter(i => i.id !== itemId);
    notifyChange({ checklist: updatedChecklist }, `Удалена подзадача "${item?.text}" пользователем ${currentUser.name}`);
  };

  // Comments Subsystem
  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;

    const newComment: Comment = {
      id: Math.random().toString(36).substring(2, 9),
      memberId: currentUserId,
      memberName: currentUser.name,
      memberAvatar: currentUser.avatar,
      text: newCommentText.trim(),
      createdAt: 'Только что'
    };

    const updatedComments = [...task.comments, newComment];
    setNewCommentText('');
    notifyChange({ comments: updatedComments }, `Пользователь ${currentUser.name} оставил комментарий`);
  };

  // Helper computations
  const totalSubtasks = task.checklist.length;
  const completedSubtasks = task.checklist.filter(i => i.isDone).length;
  const checklistPercent = totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0;

  // Department specific employees
  const departmentEmployees = members.filter(m => m.departmentId === departmentId);

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto"
      onClick={handleOverlayClick}
      id="task-modal-overlay"
    >
      <div 
        ref={modalRef}
        className="relative bg-[#1A1D27] border border-[#2E3140] rounded-xl shadow-[0_4px_24px_rgba(0,0,0,0.4)] w-full max-w-4xl text-[#F1F5F9] overflow-hidden flex flex-col max-h-[95vh] animate-scale-in"
        id="task-modal-card"
      >
        {/* Header Block with quick priority line */}
        <div className={`h-1.5 w-full ${
          priority === 'critical' ? 'bg-[#EF4444]' :
          priority === 'high' ? 'bg-[#F59E0B]' :
          priority === 'medium' ? 'bg-[#6366F1]' : 'bg-[#6B7280]'
        }`} />

        {/* Real Top Header Bar */}
        <div className="flex items-center justify-between p-5 border-b border-[#2E3140]" id="task-modal-bar">
          <div className="flex items-center gap-3">
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
              status === 'done' ? 'bg-[#22C55E]/10 text-[#22C55E] border border-[#22C55E]/20' :
              status === 'review' ? 'bg-[#8B5CF6]/10 text-[#8B5CF6] border border-[#8B5CF6]/20' :
              status === 'changes' ? 'bg-[#EF4444]/10 text-[#EF4444] border border-[#EF4444]/20' :
              status === 'in_progress' ? 'bg-[#6366F1]/10 text-[#6366F1] border border-[#6366F1]/20' :
              'bg-[#6B7280]/10 text-[#94A3B8] border border-[#2E3140]'
            }`}>
              {status === 'new' ? 'Новая' :
               status === 'in_progress' ? 'В работе' :
               status === 'review' ? 'На проверке' :
               status === 'changes' ? 'Нужны правки' : 'Выполнена'}
            </span>
            <span className="text-xs text-[#94A3B8] font-mono">ID: {task.id}</span>
          </div>

          <button 
            type="button"
            onClick={onClose}
            className="text-[#94A3B8] hover:text-[#F1F5F9] p-1.5 rounded-lg hover:bg-[#252836] transition-all cursor-pointer"
            id="close-modal-btn"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body Grid */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-3" id="task-modal-body-grid">
          
          {/* LEFT 2 COLUMNS: Main Controls & Subtasks */}
          <div className="md:col-span-2 p-6 space-y-6 border-b md:border-b-0 md:border-r border-[#2E3140]" id="modal-left-content">
            
            {/* Editable Title */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Название задачи</label>
              <input 
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={handleTitleBlur}
                className="w-full bg-transparent text-[#F1F5F9] text-xl font-bold border-b border-transparent hover:border-[#2E3140] focus:border-[#6366F1] py-1 outline-none transition-all"
                id="modal-title-input"
              />
            </div>

            {/* Editable Description */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Описание задачи</label>
              <textarea 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onBlur={handleDescBlur}
                placeholder="Добавьте описание задачи..."
                rows={4}
                className="w-full bg-[#0F1117] border border-[#2E3140] rounded-xl px-4 py-3 text-sm text-[#F1F5F9] leading-relaxed placeholder-[#94A3B8]/30 focus:outline-none focus:ring-2 focus:ring-[#6366F1]/40 focus:border-[#6366F1] transition-all"
                id="modal-desc-textarea"
              />
            </div>

            {/* Checklist subtasks */}
            <div className="space-y-3 p-4 rounded-xl bg-[#252836]/30 border border-[#2E3140]/60">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-[#F1F5F9] flex items-center gap-2">
                  <CheckSquare className="h-4.5 w-4.5 text-[#6366F1]" />
                  Чеклист подзадач
                </h4>
                <span className="text-xs font-mono text-[#94A3B8]">
                  {completedSubtasks}/{totalSubtasks} ({checklistPercent}%)
                </span>
              </div>

              {/* Checklist progress bar */}
              <div className="w-full h-1.5 bg-[#0F1117] rounded-full overflow-hidden">
                <div 
                  className="h-full bg-[#6366F1] rounded-full transition-all duration-300"
                  style={{ width: `${checklistPercent}%` }}
                />
              </div>

              {/* Subtask items list */}
              <div className="space-y-2 mt-3" id="checklist-items-stack">
                {task.checklist.map((item) => (
                  <div 
                    key={item.id}
                    className="flex items-center justify-between gap-3 p-2 bg-[#0F1117]/50 rounded-lg hover:bg-[#0F1117] transition-all group"
                  >
                    <label className="flex items-center gap-2.5 flex-1 cursor-pointer select-none">
                      <input 
                        type="checkbox"
                        checked={item.isDone}
                        onChange={() => handleToggleChecklist(item.id)}
                        className="w-4.5 h-4.5 accent-[#6366F1] text-indigo-500 rounded border-[#2E3140] bg-[#0F1117] cursor-pointer"
                      />
                      <span className={`text-sm tracking-wide transition-all ${
                        item.isDone ? 'line-through text-[#94A3B8]/50' : 'text-[#F1F5F9]'
                      }`}>
                        {item.text}
                      </span>
                    </label>

                    <button 
                      type="button"
                      onClick={() => handleRemoveSubtask(item.id)}
                      className="text-[#94A3B8]/40 hover:text-[#EF4444] opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-[#252836]"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}

                {task.checklist.length === 0 && (
                  <p className="text-xs text-[#94A3B8]/60 text-center py-2 italic">Нет добавленных подзадач</p>
                )}
              </div>

              {/* Add subtask Form */}
              <form onSubmit={handleAddSubtask} className="flex gap-2 mt-3">
                <input 
                  type="text"
                  placeholder="Добавить пункт в список..."
                  value={newSubtask}
                  onChange={(e) => setNewSubtask(e.target.value)}
                  className="flex-1 bg-[#0F1117] border border-[#2E3140] rounded-lg px-3 py-1.5 text-xs text-[#F1F5F9] focus:outline-none focus:ring-1 focus:ring-[#6366F1] focus:border-[#6366F1]"
                  id="modal-new-subtask-input"
                />
                <button 
                  type="submit"
                  className="bg-[#252836] hover:bg-[#6366F1] text-[#F1F5F9] hover:text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Добавить
                </button>
              </form>
            </div>

            {/* Attachments panel */}
            <div className="space-y-2.5 pb-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#94A3B8]">Вложения к задаче</h4>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2" id="attachments-grid">
                {task.attachments.map((file) => (
                  <div 
                    key={file.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-[#0F1117] border border-[#2E3140] hover:border-[#6366F1] transition-all"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="bg-[#252836] p-1.5 rounded text-[#6366F1]">
                        <FileText className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-[#F1F5F9] truncate">{file.name}</p>
                        <p className="text-[10px] text-[#94A3B8] font-mono uppercase">{file.type}</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-semibold text-[#6366F1] bg-[#6366F1]/10 px-2 py-0.5 rounded">Скачать</span>
                  </div>
                ))}

                {task.attachments.length === 0 && (
                  <div className="col-span-2 text-center py-4 bg-[#0F1117]/30 border border-[#2E3140] border-dashed rounded-xl">
                    <Paperclip className="h-5 w-5 text-[#94A3B8]/30 mx-auto mb-1.5" />
                    <p className="text-xs text-[#94A3B8]/50">Файлы не прикреплены</p>
                  </div>
                )}
              </div>
            </div>

            {/* Comments Thread */}
            <div className="space-y-4 pt-4 border-t border-[#2E3140]">
              <h4 className="text-sm font-bold text-[#F1F5F9] flex items-center gap-2">
                <MessageSquare className="h-4.5 w-4.5 text-[#6366F1]" />
                Комментарии ({task.comments.length})
              </h4>

              {/* Comment list thread stack */}
              <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1" id="comments-timeline">
                {task.comments.map((cmt) => {
                  const cmtMember = members.find(m => m.id === cmt.memberId);
                  const cmtBg = cmtMember?.bgColor || '#6366F1';
                  
                  return (
                    <div key={cmt.id} className="flex gap-3 bg-[#0F1117]/30 p-2.5 rounded-xl border border-[#2E3140]/30">
                      {/* Avatar */}
                      <div 
                        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                        style={{ backgroundColor: cmtBg }}
                      >
                        {cmt.memberAvatar}
                      </div>
                      
                      {/* Content block */}
                      <div className="space-y-1 text-xs flex-1">
                        <div className="flex justify-between items-baseline">
                          <span className="font-bold text-[#F1F5F9]">{cmt.memberName}</span>
                          <span className="text-[10px] text-[#94A3B8] font-mono">{cmt.createdAt}</span>
                        </div>
                        <p className="text-[#94A3B8] leading-relaxed break-all">{cmt.text}</p>
                      </div>
                    </div>
                  );
                })}

                {task.comments.length === 0 && (
                  <p className="text-xs text-[#94A3B8]/50 italic text-center py-4">Будьте первым, кто оставит комментарий!</p>
                )}
              </div>

              {/* Comment write-up panel */}
              <form onSubmit={handleAddComment} className="flex gap-2">
                <input 
                  type="text"
                  placeholder="Напишите комментарий..."
                  value={newCommentText}
                  onChange={(e) => setNewCommentText(e.target.value)}
                  className="flex-1 bg-[#0F1117] border border-[#2E3140] rounded-lg px-3 py-2 text-sm text-[#F1F5F9] placeholder-[#94A3B8]/30 focus:outline-none focus:ring-1 focus:ring-[#6366F1] focus:border-[#6366F1]"
                  id="modal-new-comment-input"
                />
                <button 
                  type="submit"
                  className="bg-[#6366F1] hover:bg-[#5053DC] text-white px-4 py-2 rounded-lg text-xs font-semibold hover:shadow-md transition-all cursor-pointer"
                >
                  Отправить
                </button>
              </form>
            </div>

          </div>

          {/* RIGHT COLUMN: Settings Sidebar Controls */}
          <div className="bg-[#12151E] p-6 space-y-5" id="modal-right-sidebar">
            <h4 className="text-xs font-bold uppercase tracking-widest text-[#94A3B8] pb-1.5 border-b border-[#2E3140]">Параметры задачи</h4>

            {/* Status Select */}
            <div className="space-y-1.5">
              <label className="block text-xs text-[#94A3B8] font-semibold">Статус</label>
              <select 
                value={status}
                onChange={(e) => handleStatusChange(e.target.value as TaskStatus)}
                className="w-full bg-[#0F1117] border border-[#2E3140] rounded-lg px-3 py-2 text-xs font-semibold text-[#F1F5F9] focus:outline-none focus:ring-1 focus:ring-[#6366F1]"
                id="modal-sidebar-select-status"
              >
                <option value="new" className="bg-[#1A1D27]">📁 Новая</option>
                <option value="in_progress" className="bg-[#1A1D27]">⚡ В работе</option>
                <option value="review" className="bg-[#1A1D27]">🔍 На проверке</option>
                <option value="changes" className="bg-[#1A1D27]">✍️ Нужны правки</option>
                <option value="done" className="bg-[#1A1D27]">✅ Выполнена</option>
              </select>
            </div>

            {/* Priority Select */}
            <div className="space-y-1.5">
              <label className="block text-xs text-[#94A3B8] font-semibold">Приоритет</label>
              <select 
                value={priority}
                onChange={(e) => handlePriorityChange(e.target.value as TaskPriority)}
                className="w-full bg-[#0F1117] border border-[#2E3140] rounded-lg px-3 py-2 text-xs font-semibold text-[#F1F5F9] focus:outline-none focus:ring-1 focus:ring-[#6366F1]"
                id="modal-sidebar-select-priority"
              >
                <option value="critical" className="bg-[#1A1D27] text-[#EF4444]">Критический (!)</option>
                <option value="high" className="bg-[#1A1D27] text-[#F59E0B]">Высокий</option>
                <option value="medium" className="bg-[#1A1D27] text-[#6366F1]">Средний</option>
                <option value="low" className="bg-[#1A1D27] text-[#6B7280]">Низкий</option>
              </select>
            </div>

            {/* Department Select */}
            <div className="space-y-1.5">
              <label className="block text-xs text-[#94A3B8] font-semibold">Отдел</label>
              <select 
                value={departmentId}
                onChange={(e) => handleDeptChange(e.target.value)}
                className="w-full bg-[#0F1117] border border-[#2E3140] rounded-lg px-3 py-2 text-xs font-semibold text-[#F1F5F9] focus:outline-none focus:ring-1 focus:ring-[#6366F1]"
                id="modal-sidebar-select-department"
              >
                {departments.map((d) => (
                  <option key={d.id} value={d.id} className="bg-[#1A1D27]">{d.name}</option>
                ))}
              </select>
            </div>

            {/* Assignees Overlapping Selection List */}
            <div className="space-y-2">
              <label className="block text-xs text-[#94A3B8] font-semibold">Исполнители отдела ({departmentEmployees.length})</label>
              
              <div className="space-y-1.5 max-h-[140px] overflow-y-auto bg-[#0F1117] p-2 rounded-lg border border-[#2E3140]" id="assignees-checkboxes-stack">
                {departmentEmployees.map((emp) => {
                  const isChecked = assigneeIds.includes(emp.id);
                  return (
                    <label 
                      key={emp.id}
                      className="flex items-center gap-2 p-1 rounded hover:bg-[#252836] text-xs cursor-pointer select-none"
                    >
                      <input 
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleAssignee(emp.id)}
                        className="accent-[#6366F1] rounded cursor-pointer"
                      />
                      <div 
                        className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold text-white"
                        style={{ backgroundColor: emp.bgColor }}
                      >
                        {emp.avatar}
                      </div>
                      <span className="truncate flex-1">{emp.name}</span>
                    </label>
                  );
                })}

                {departmentEmployees.length === 0 && (
                  <p className="text-[10px] text-[#94A3B8] italic">Никого нет в этом отделе</p>
                )}
              </div>
            </div>

            {/* Deadline Datepicker Input */}
            <div className="space-y-1.5">
              <label className="block text-xs text-[#94A3B8] font-semibold">Дедлайн</label>
              <div className="relative">
                <input 
                  type="date"
                  value={deadline}
                  onChange={(e) => handleDeadlineChange(e.target.value)}
                  className="w-full bg-[#0F1117] border border-[#2E3140] rounded-lg px-3 py-2 text-xs text-[#F1F5F9] focus:outline-none focus:ring-1 focus:ring-[#6366F1] pl-8"
                  id="modal-sidebar-input-deadline"
                />
                <Calendar className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-[#94A3B8]" />
              </div>
            </div>

            {/* Logged Workload time */}
            <div className="space-y-1.5">
              <label className="block text-xs text-[#94A3B8] font-semibold">Залогировано времени</label>
              <div className="relative">
                <input 
                  type="text"
                  value={loggedTime}
                  onChange={(e) => setLoggedTime(e.target.value)}
                  onBlur={handleLoggedTimeBlur}
                  placeholder="Например: 2ч 30м"
                  className="w-full bg-[#0F1117] border border-[#2E3140] rounded-lg px-3 py-2 text-xs font-mono text-[#F1F5F9] focus:outline-none focus:ring-1 focus:ring-[#6366F1] pl-8"
                  id="modal-sidebar-input-logged"
                />
                <Clock className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-[#94A3B8]" />
              </div>
            </div>

            {/* Tag Badges editor */}
            <div className="space-y-2">
              <label className="block text-xs text-[#94A3B8] font-semibold">Теги</label>
              <div className="flex flex-wrap gap-1" id="tags-pills-list">
                {tags.map((tg) => (
                  <span 
                    key={tg}
                    className="inline-flex items-center gap-1 bg-[#8B5CF6]/15 text-[#8B5CF6] border border-[#8B5CF6]/30 text-[10px] font-semibold px-2 py-0.5 rounded-full"
                  >
                    {tg}
                    <X className="h-2 w-2 cursor-pointer hover:text-[#EF4444]" onClick={() => handleRemoveTag(tg)} />
                  </span>
                ))}
              </div>
              <form onSubmit={handleAddTag} className="flex gap-1.5 mt-1.5">
                <input 
                  type="text"
                  placeholder="Новый тег..."
                  value={newTagVal}
                  onChange={(e) => setNewTagVal(e.target.value)}
                  className="flex-1 min-w-0 bg-[#0F1117] border border-[#2E3140] rounded px-2.5 py-1 text-[10px] text-[#F1F5F9] focus:outline-none"
                  id="modal-sidebar-new-tag-input"
                />
                <button 
                  type="submit"
                  className="bg-[#252836] text-[10px] font-bold text-[#F1F5F9] px-2 py-1 rounded hover:bg-[#6366F1] transition"
                >
                  +
                </button>
              </form>
            </div>

            {/* Created author & date info */}
            <div className="pt-3 border-t border-[#2E3140]/60 space-y-1 text-[11px] text-[#94A3B8]">
              <p>Создана: <span className="text-[#F1F5F9] font-medium">{task.createdAt}</span></p>
              <p>Кем: <span className="text-[#F1F5F9] font-medium">
                {members.find(m => m.id === task.creatorId)?.name || 'Владелец'}
              </span></p>
            </div>

            {/* HISTORY ACCORDION */}
            <div className="pt-3 border-t border-[#2E3140]/60">
              <button 
                type="button"
                onClick={() => setIsHistoryOpen(!isHistoryOpen)}
                className="w-full flex justify-between items-center text-xs font-semibold text-[#94A3B8] hover:text-[#F1F5F9] transition cursor-pointer select-none"
                id="accordion-history-toggle"
              >
                <span>История изменений ({task.history.length})</span>
                {isHistoryOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>

              {isHistoryOpen && (
                <div className="mt-2.5 space-y-2.5 text-[10px] max-h-[140px] overflow-y-auto bg-[#0D0F18] p-2 rounded border border-[#2E3140] animate-fade-in" id="history-logs-stack">
                  {task.history.map((hist) => (
                    <div key={hist.id} className="border-l border-indigo-500/40 pl-2 space-y-0.5">
                      <p className="text-[#F1F5F9] leading-snug font-medium">{hist.text}</p>
                      <p className="text-[#94A3B8]/60 text-[9px] font-mono">{hist.time}</p>
                    </div>
                  ))}

                  {task.history.length === 0 && (
                    <p className="text-[#94A3B8]/40 italic text-center py-1">Нет записей в истории</p>
                  )}
                </div>
              )}
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
