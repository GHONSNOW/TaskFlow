import React, { useState, useMemo } from 'react';
import { 
  Kanban as KanbanIcon, 
  List as ListIcon, 
  Calendar as CalendarIcon, 
  Plus, 
  Search, 
  Clock, 
  MessageSquare, 
  ChevronDown, 
  ChevronUp, 
  AlertCircle,
  Users as UsersIcon,
  ChevronsUpDown,
  Filter,
  CheckSquare
} from 'lucide-react';
import { Task, TaskPriority, TaskStatus, Department, Member } from '../types';

interface TasksViewProps {
  tasks: Task[];
  departments: Department[];
  members: Member[];
  onSelectTask: (task: Task) => void;
  onOpenCreateModal: () => void;
  onUpdateTaskStatus: (taskId: string, nextStatus: TaskStatus) => void;
  onUpdateTask: (task: Task) => void;
  searchQuery: string;
}

type ModeType = 'kanban' | 'list' | 'calendar';

export default function TasksView({
  tasks,
  departments,
  members,
  onSelectTask,
  onOpenCreateModal,
  onUpdateTaskStatus,
  onUpdateTask,
  searchQuery
}: TasksViewProps) {
  
  // Virtual "today" constant
  const TODAY_STR = '2026-06-02';

  // State Management
  const [viewMode, setViewMode] = useState<ModeType>('kanban');
  const [filterDept, setFilterDept] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterAssignee, setFilterAssignee] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Sorting for list view
  const [sortKey, setSortKey] = useState<keyof Task | 'assignee' | 'department'>('deadline');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Calendar View month-state (starts at June 2026)
  const [calDate, setCalDate] = useState<Date>(new Date(2026, 5, 2)); // Month: 5 is June in JS

  // Combine Search from Header with internal filters
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      // 1. Search filter (title, description, tags)
      const query = searchQuery.toLowerCase().trim();
      const matchQuery = !query ? true : (
        task.title.toLowerCase().includes(query) ||
        task.description.toLowerCase().includes(query) ||
        task.tags.some(tag => tag.toLowerCase().includes(query))
      );

      // 2. Department filter
      const matchDept = filterDept === 'all' ? true : task.departmentId === filterDept;

      // 3. Priority filter
      const matchPriority = filterPriority === 'all' ? true : task.priority === filterPriority;

      // 4. Assignee filter
      const matchAssignee = filterAssignee === 'all' ? true : task.assigneeIds.includes(filterAssignee);

      // 5. Status filter
      const matchStatus = filterStatus === 'all' ? true : task.status === filterStatus;

      return matchQuery && matchDept && matchPriority && matchAssignee && matchStatus;
    });
  }, [tasks, searchQuery, filterDept, filterPriority, filterAssignee, filterStatus]);

  // Handle Drag & Drop status transition
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetStatus: TaskStatus) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    if (taskId) {
      onUpdateTaskStatus(taskId, targetStatus);
    }
  };

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('taskId', taskId);
  };

  // Helper for priority color accents in kanban / list
  const getPriorityStyle = (priority: TaskPriority) => {
    switch (priority) {
      case 'critical': return { bg: 'bg-[#EF4444]', border: 'border-[#EF4444]', text: 'text-[#EF4444]', label: 'Критический' };
      case 'high': return { bg: 'bg-[#F59E0B]', border: 'border-[#F59E0B]', text: 'text-[#F59E0B]', label: 'Высокий' };
      case 'medium': return { bg: 'bg-[#6366F1]', border: 'border-[#6366F1]', text: 'text-[#6366F1]', label: 'Средний' };
      case 'low': return { bg: 'bg-[#6B7280]', border: 'border-[#6B7280]', text: 'text-[#94A3B8]', label: 'Низкий' };
    }
  };

  const getStatusLabelAndStyles = (status: TaskStatus) => {
    switch (status) {
      case 'new': return { label: 'Новая', color: 'bg-[#6B7280]/15 text-[#94A3B8] border border-[#2E3140]' };
      case 'in_progress': return { label: 'В работе', color: 'bg-[#6366F1]/15 text-[#6366F1] border border-[#6366F1]/20' };
      case 'review': return { label: 'На проверке', color: 'bg-[#8B5CF6]/15 text-[#8B5CF6] border border-[#8B5CF6]/20' };
      case 'changes': return { label: 'Нужны правки', color: 'bg-[#EF4444]/15 text-[#EF4444] border border-[#EF4444]/20' };
      case 'done': return { label: 'Выполнена', color: 'bg-[#22C55E]/15 text-[#22C55E] border border-[#22C55E]/20' };
    }
  };

  // List View Column Sorter
  const handleSort = (key: keyof Task | 'assignee' | 'department') => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('asc');
    }
  };

  const sortedTasks = useMemo(() => {
    const sorted = [...filteredTasks];
    sorted.sort((a, b) => {
      let aVal: any = a[sortKey as keyof Task];
      let bVal: any = b[sortKey as keyof Task];

      if (sortKey === 'assignee') {
        aVal = a.assigneeIds.length > 0 ? (members.find(m => m.id === a.assigneeIds[0])?.name || '') : '';
        bVal = b.assigneeIds.length > 0 ? (members.find(m => m.id === b.assigneeIds[0])?.name || '') : '';
      } else if (sortKey === 'department') {
        aVal = departments.find(d => d.id === a.departmentId)?.name || '';
        bVal = departments.find(d => d.id === b.departmentId)?.name || '';
      }

      if (aVal === undefined) return 0;
      if (bVal === undefined) return 0;

      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [filteredTasks, sortKey, sortOrder, members, departments]);

  // Calendar Engine: Days mapping for the dynamic active month view
  const calendarDays = useMemo(() => {
    const year = calDate.getFullYear();
    const month = calDate.getMonth();
    
    // First day of the month
    const firstDayIndex = new Date(year, month, 1).getDay(); // Sunday=0, Monday=1...
    // Adjust to European (Monday-first) format
    const startOffset = firstDayIndex === 0 ? 6 : firstDayIndex - 1;
    
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const calendarArray: { dayNum: number; isCurrentMonth: boolean; fullDateStr: string }[] = [];

    // Fill previous month padding days
    for (let i = startOffset - 1; i >= 0; i--) {
      const pDay = daysInPrevMonth - i;
      const prevMonthIdx = month === 0 ? 11 : month - 1;
      const prevYear = month === 0 ? year - 1 : year;
      const padDateStr = `${prevYear}-${String(prevMonthIdx + 1).padStart(2, '0')}-${String(pDay).padStart(2, '0')}`;
      calendarArray.push({ dayNum: pDay, isCurrentMonth: false, fullDateStr: padDateStr });
    }

    // Fill current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const actualDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      calendarArray.push({ dayNum: day, isCurrentMonth: true, fullDateStr: actualDateStr });
    }

    // Fill next month padding days
    const totalSlots = 35; // or 42 depending on height, let's keep 42 for regular safety grid
    const remaining = 42 - calendarArray.length;
    for (let day = 1; day <= remaining; day++) {
      const nextMonthIdx = month === 11 ? 0 : month + 1;
      const nextYear = month === 11 ? year + 1 : year;
      const padDateStr = `${nextYear}-${String(nextMonthIdx + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      calendarArray.push({ dayNum: day, isCurrentMonth: false, fullDateStr: padDateStr });
    }

    return calendarArray;
  }, [calDate]);

  const changeCalendarMonth = (offset: number) => {
    setCalDate(new Date(calDate.getFullYear(), calDate.getMonth() + offset, 1));
  };

  const getMonthRussianName = (d: Date) => {
    const list = [
      'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 
      'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
    ];
    return `${list[d.getMonth()]} ${d.getFullYear()}`;
  };

  return (
    <div className="space-y-6 animate-fade-in" id="tasks-view-root">
      
      {/* Top Controls Row */}
      <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between" id="tasks-toolbar">
        
        {/* View mode buttons */}
        <div className="inline-flex p-1 bg-[#1A1D27] rounded-xl border border-[#2E3140]" id="tasks-tabs-toggle">
          <button
            onClick={() => setViewMode('kanban')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer ${
              viewMode === 'kanban' 
                ? 'bg-[#6366F1] text-white shadow-md' 
                : 'text-[#94A3B8] hover:text-[#F1F5F9]'
            }`}
          >
            <KanbanIcon className="h-4 w-4" />
            Канбан
          </button>
          
          <button
            onClick={() => setViewMode('list')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer ${
              viewMode === 'list' 
                ? 'bg-[#6366F1] text-white shadow-md' 
                : 'text-[#94A3B8] hover:text-[#F1F5F9]'
            }`}
          >
            <ListIcon className="h-4 w-4" />
            Список
          </button>

          <button
            onClick={() => setViewMode('calendar')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer ${
              viewMode === 'calendar' 
                ? 'bg-[#6366F1] text-white shadow-md' 
                : 'text-[#94A3B8] hover:text-[#F1F5F9]'
            }`}
          >
            <CalendarIcon className="h-4 w-4" />
            Календарь
          </button>
        </div>

        {/* Create Task Button */}
        <button
          onClick={onOpenCreateModal}
          className="bg-[#6366F1] hover:bg-[#5053DC] text-white font-semibold text-xs px-5 py-3 rounded-lg flex items-center justify-center gap-2 shadow-[0_4px_14px_rgba(99,102,241,0.35)] transition-all cursor-pointer hover:-translate-y-0.5"
          id="btn-add-task-primary"
        >
          <Plus className="h-4 w-4" />
          Новая задача
        </button>
      </div>

      {/* Filters Select row under tabs */}
      <div className="bg-[#1A1D27] border border-[#2E3140] rounded-xl p-4 shadow-sm" id="filters-row">
        <div className="flex items-center gap-2 mb-3 text-xs font-bold text-[#94A3B8] uppercase tracking-wide">
          <Filter className="h-4 w-4 text-[#6366F1]" />
          Фильтрация и поиск
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3" id="filters-dropdowns-grid">
          
          {/* Dept select */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-[#94A3B8] font-semibold">Отдел</label>
            <select
              value={filterDept}
              onChange={(e) => setFilterDept(e.target.value)}
              className="bg-[#0F1117] border border-[#2E3140] rounded-lg px-3 py-2 text-xs text-[#F1F5F9] focus:outline-none focus:border-[#6366F1]"
              id="filter-dept-select"
            >
              <option value="all">Все отделы</option>
              {departments.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>

          {/* Priority select */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-[#94A3B8] font-semibold">Приоритет</label>
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="bg-[#0F1117] border border-[#2E3140] rounded-lg px-3 py-2 text-xs text-[#F1F5F9] focus:outline-none focus:border-[#6366F1]"
              id="filter-priority-select"
            >
              <option value="all">Все приоритеты</option>
              <option value="critical">Критический</option>
              <option value="high">Высокий</option>
              <option value="medium">Средний</option>
              <option value="low">Низкий</option>
            </select>
          </div>

          {/* Assignee select */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-[#94A3B8] font-semibold">Исполнитель</label>
            <select
              value={filterAssignee}
              onChange={(e) => setFilterAssignee(e.target.value)}
              className="bg-[#0F1117] border border-[#2E3140] rounded-lg px-3 py-2 text-xs text-[#F1F5F9] focus:outline-none focus:border-[#6366F1]"
              id="filter-assignee-select"
            >
              <option value="all">Все исполнители</option>
              {members.map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>

          {/* Status filter */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-[#94A3B8] font-semibold">Статус</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-[#0F1117] border border-[#2E3140] rounded-lg px-3 py-2 text-xs text-[#F1F5F9] focus:outline-none focus:border-[#6366F1]"
              id="filter-status-select"
            >
              <option value="all">Все статусы</option>
              <option value="new">Новая</option>
              <option value="in_progress">В работе</option>
              <option value="review">На проверке</option>
              <option value="changes">Нужны правки</option>
              <option value="done">Выполнена</option>
            </select>
          </div>

        </div>
      </div>

      {/* Main Container according to Mode */}
      <div id="tasks-view-body">
        
        {/* Zero state feedback */}
        {filteredTasks.length === 0 && (
          <div className="flex flex-col items-center justify-center p-16 bg-[#1A1D27] rounded-xl border border-[#2E3140] text-center" id="search-empty-state">
            <div className="bg-[#252836] p-4 rounded-full text-[#94A3B8] mb-4">
              <AlertCircle className="h-8 w-8" />
            </div>
            <h3 className="text-[#F1F5F9] text-base font-bold">Задач не найдено</h3>
            <p className="text-[#94A3B8] text-sm max-w-sm mt-1.5 leading-relaxed">
              Попробуйте скорректировать параметры фильтрации или поисковый запрос в верху хедера.
            </p>
          </div>
        )}

        {filteredTasks.length > 0 && viewMode === 'kanban' && (
          <div className="overflow-x-auto pb-4" id="kanban-wrapper-scroll">
            <div className="flex gap-4 min-w-[1000px] items-start" id="kanban-columns-container">
              
              {(['new', 'in_progress', 'review', 'changes', 'done'] as TaskStatus[]).map((colStatus) => {
                const colTasks = filteredTasks.filter(t => t.status === colStatus);
                const { label } = getStatusLabelAndStyles(colStatus);

                return (
                  <div 
                    key={colStatus}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, colStatus)}
                    className="flex-1 min-w-[200px] bg-[#1A1D27]/80 border border-[#2E3140] rounded-xl p-3 flex flex-col max-h-[75vh]"
                    id={`kanban-column-${colStatus}`}
                  >
                    
                    {/* Column Header */}
                    <div className="flex items-center justify-between mb-3.5 px-1.5 shrink-0" id={`kanban-col-head-${colStatus}`}>
                      <span className="text-xs font-bold text-[#F1F5F9] flex items-center gap-1.5 tracking-wider uppercase">
                        <span className={`w-2 h-2 rounded-full ${
                          colStatus === 'new' ? 'bg-[#94A3B8]' :
                          colStatus === 'in_progress' ? 'bg-[#6366F1]' :
                          colStatus === 'review' ? 'bg-[#8B5CF6]' :
                          colStatus === 'changes' ? 'bg-[#EF4444]' : 'bg-[#22C55E]'
                        }`} />
                        {label}
                      </span>
                      <span className="bg-[#252836] text-[10px] font-bold text-[#F1F5F9] px-2 py-0.5 rounded-full font-mono">
                        {colTasks.length}
                      </span>
                    </div>

                    {/* Column body cards lists scrollable */}
                    <div className="space-y-3 overflow-y-auto max-h-[60vh] pr-1" id={`kanban-col-body-${colStatus}`}>
                      {colTasks.map((task) => {
                        const style = getPriorityStyle(task.priority);
                        const isOverdue = task.status !== 'done' && task.deadline < TODAY_STR;
                        
                        // Checklist counters
                        const totalSub = task.checklist.length;
                        const doneSub = task.checklist.filter(i => i.isDone).length;

                        return (
                          <div
                            key={task.id}
                            draggable="true"
                            onDragStart={(e) => handleDragStart(e, task.id)}
                            onClick={() => onSelectTask(task)}
                            className="bg-[#1A1D27] border border-[#2E3140] hover:border-[#6366F1] rounded-xl p-3.5 shadow-md hover:scale-[1.01] hover:brightness-[1.03] transition-all duration-200 cursor-pointer relative group flex flex-col space-y-3"
                            id={`kanban-task-card-${task.id}`}
                          >
                            {/* Priority visual border indicator */}
                            <div className={`absolute top-0 left-4 right-4 h-1 rounded-b-md ${style.bg}`} />

                            {/* Title */}
                            <div>
                              <p className="text-[10px] font-mono text-[#94A3B8] font-bold uppercase mb-1">{style.label}</p>
                              <h4 className="text-xs font-bold text-[#F1F5F9] leading-snug group-hover:text-white line-clamp-2">
                                {task.title}
                              </h4>
                            </div>

                            {/* Tags list (max 2 tags) */}
                            {task.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1" id={`tags-container-${task.id}`}>
                                {task.tags.slice(0, 2).map((t, idx) => (
                                  <span 
                                    key={idx} 
                                    className="px-2 py-0.5 rounded bg-[#252836] text-[#94A3B8] text-[9px] font-medium"
                                  >
                                    #{t}
                                  </span>
                                ))}
                                {task.tags.length > 2 && (
                                  <span className="px-1.5 py-0.5 rounded bg-[#252836] text-indigo-400 text-[9px] font-bold">
                                    +{task.tags.length - 2}
                                  </span>
                                )}
                              </div>
                            )}

                            {/* Bottom info section: Members stack, Checklist tracker, Comments indicator, Deadline */}
                            <div className="pt-2 border-t border-[#2E3140]/60 flex items-center justify-between" id="card-footinfo">
                              
                              {/* Left side checklist + comment counts */}
                              <div className="flex items-center gap-2.5 text-[10px] text-[#94A3B8]">
                                {totalSub > 0 && (
                                  <span className="flex items-center gap-1 font-mono" title="Подозадачи">
                                    <CheckSquare className="h-3 w-3 text-indigo-400" />
                                    {doneSub}/{totalSub}
                                  </span>
                                )}
                                {task.comments.length > 0 && (
                                  <span className="flex items-center gap-1 font-mono" title="Комментарии">
                                    <MessageSquare className="h-3 w-3 text-[#94A3B8]" />
                                    {task.comments.length}
                                  </span>
                                )}
                              </div>

                              {/* Overlapping member avatars stack */}
                              <div className="flex -space-x-1.5 overflow-hidden">
                                {task.assigneeIds.map((mId) => {
                                  const memberObj = members.find(m => m.id === mId);
                                  if (!memberObj) return null;
                                  return (
                                    <div 
                                      key={mId}
                                      className="w-5.5 h-5.5 rounded-full border border-[#1A1D27] flex items-center justify-center text-[7px] font-bold text-white shadow-sm shrink-0"
                                      style={{ backgroundColor: memberObj.bgColor }}
                                      title={memberObj.name}
                                    >
                                      {memberObj.avatar}
                                    </div>
                                  );
                                })}
                              </div>

                            </div>

                            {/* Deadline clock */}
                            <div className="flex items-center justify-between text-[9px] font-semibold">
                              <span className="text-[#94A3B8]">Срок:</span>
                              <span className={`inline-flex items-center gap-1 font-mono ${
                                isOverdue ? 'text-[#EF4444] animate-pulse bg-red-950/20 px-1.5 py-0.5 rounded' : 'text-[#94A3B8]'
                              }`}>
                                <Clock className="h-3 w-3" />
                                {task.deadline}
                              </span>
                            </div>

                          </div>
                        );
                      })}

                      {colTasks.length === 0 && (
                        <div className="text-center py-10 border border-dashed border-[#2E3140] rounded-xl" id="column-empty-fallback">
                          <p className="text-[11px] text-[#94A3B8]/40 italic">Перетащите сюда задачи</p>
                        </div>
                      )}
                    </div>

                  </div>
                );
              })}

            </div>
          </div>
        )}

        {/* List View Component */}
        {filteredTasks.length > 0 && viewMode === 'list' && (
          <div className="overflow-x-auto bg-[#1A1D27] border border-[#2E3140] rounded-xl shadow-md" id="table-view-card">
            <table className="w-full text-left border-collapse table-auto text-xs" id="tasks-table">
              
              {/* Header row with arrows */}
              <thead>
                <tr className="border-b border-[#2E3140] text-[#94A3B8] bg-[#12151E]">
                  <th 
                    onClick={() => handleSort('title')}
                    className="p-4 font-semibold hover:text-[#F1F5F9] cursor-pointer"
                  >
                    <div className="flex items-center gap-1 select-none">
                      Задача <ChevronsUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort('department')}
                    className="p-4 font-semibold hover:text-[#F1F5F9] cursor-pointer"
                  >
                    <div className="flex items-center gap-1 select-none">
                      Отдел <ChevronsUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th className="p-4 font-semibold select-none">
                    Исполнители
                  </th>
                  <th 
                    onClick={() => handleSort('priority')}
                    className="p-4 font-semibold hover:text-[#F1F5F9] cursor-pointer"
                  >
                    <div className="flex items-center gap-1 select-none">
                      Приоритет <ChevronsUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort('status')}
                    className="p-4 font-semibold hover:text-[#F1F5F9] cursor-pointer"
                  >
                    <div className="flex items-center gap-1 select-none">
                      Статус <ChevronsUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort('deadline')}
                    className="p-4 font-semibold hover:text-[#F1F5F9] cursor-pointer"
                  >
                    <div className="flex items-center gap-1 select-none">
                      Дедлайн <ChevronsUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th className="p-4 font-semibold select-none">Прогресс</th>
                </tr>
              </thead>

              {/* Rows items */}
              <tbody className="divide-y divide-[#2E3140]/65 text-[#F1F5F9]" id="table-body">
                {sortedTasks.map((task) => {
                  const style = getPriorityStyle(task.priority);
                  const statusInfo = getStatusLabelAndStyles(task.status);
                  const isOverdue = task.status !== 'done' && task.deadline < TODAY_STR;
                  const dept = departments.find(d => d.id === task.departmentId);

                  const totalSub = task.checklist.length;
                  const doneSub = task.checklist.filter(i => i.isDone).length;
                  const percent = totalSub > 0 ? Math.round((doneSub / totalSub) * 100) : 0;

                  return (
                    <tr 
                      key={task.id}
                      onClick={() => onSelectTask(task)}
                      className="hover:bg-[#252836]/45 transition-colors duration-150 cursor-pointer"
                      id={`table-row-${task.id}`}
                    >
                      {/* Title */}
                      <td className="p-4 font-semibold max-w-[280px]">
                        <p className="truncate text-sm text-[#F1F5F9]">{task.title}</p>
                        <div className="flex items-center gap-1 mt-1">
                          {task.tags.slice(0, 2).map((t, i) => (
                            <span key={i} className="text-[10px] text-indigo-400">#{t}</span>
                          ))}
                        </div>
                      </td>

                      {/* Department */}
                      <td className="p-4 text-[#94A3B8]">
                        <span className="font-semibold">{dept?.name || task.departmentId}</span>
                      </td>

                      {/* Assignees stack list */}
                      <td className="p-4">
                        <div className="flex items-center gap-1.5">
                          <div className="flex -space-x-1 overflow-hidden">
                            {task.assigneeIds.map(id => {
                              const emp = members.find(m => m.id === id);
                              if (!emp) return null;
                              return (
                                <div 
                                  key={id}
                                  title={emp.name}
                                  className="w-6 h-6 rounded-full border border-[#1A1D27] text-[8px] font-bold text-white flex items-center justify-center shrink-0 shadow-sm"
                                  style={{ backgroundColor: emp.bgColor }}
                                >
                                  {emp.avatar}
                                </div>
                              );
                            })}
                          </div>
                          {task.assigneeIds.length === 1 && (
                            <span className="text-[10px] text-[#94A3B8] truncate max-w-[80px]">
                              {members.find(m => m.id === task.assigneeIds[0])?.name.split(' ')[0]}
                            </span>
                          )}
                          {task.assigneeIds.length === 0 && (
                            <span className="text-[10px] text-[#94A3B8]/40 italic">Создатель</span>
                          )}
                        </div>
                      </td>

                      {/* Priority pill */}
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          task.priority === 'critical' ? 'bg-[#EF4444]/15 text-[#EF4444]' :
                          task.priority === 'high' ? 'bg-[#F59E0B]/15 text-[#F59E0B]' :
                          task.priority === 'medium' ? 'bg-[#6366F1]/15 text-[#6366F1]' :
                          'bg-[#6B7280]/20 text-[#94A3B8]'
                        }`}>
                          {style.label}
                        </span>
                      </td>

                      {/* Status badge */}
                      <td className="p-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${statusInfo.color}`}>
                          {statusInfo.label}
                        </span>
                      </td>

                      {/* Deadline info icon */}
                      <td className="p-4 font-mono font-semibold">
                        <span className={`inline-flex items-center gap-1 ${
                          isOverdue ? 'text-[#EF4444] font-bold animate-pulse' : 'text-[#94A3B8]'
                        }`}>
                          {isOverdue && <AlertCircle className="h-3. w-3" />}
                          {task.deadline}
                        </span>
                      </td>

                      {/* Checklist progress */}
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] text-[#94A3B8]">{percent}%</span>
                          <div className="w-16 h-1.5 bg-[#252836] rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] rounded-full" 
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </div>
                      </td>

                    </tr>
                  );
                })}
              </tbody>

            </table>
          </div>
        )}

        {/* Real Dynamic Calendar View */}
        {filteredTasks.length > 0 && viewMode === 'calendar' && (
          <div className="bg-[#1A1D27] border border-[#2E3140] rounded-xl p-4 shadow-md space-y-4" id="calendar-view-card">
            
            {/* Calendar title with controls */}
            <div className="flex items-center justify-between" id="calendar-nav-toolbar">
              <h3 className="text-base font-bold text-[#F1F5F9] flex items-center gap-2">
                <CalendarIcon className="h-4.5 w-4.5 text-[#6366F1]" />
                {getMonthRussianName(calDate)}
              </h3>
              
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => changeCalendarMonth(-1)}
                  className="px-3 py-1.5 text-xs font-semibold bg-[#252836] hover:bg-[#2E3140] text-[#F1F5F9] rounded-lg transition"
                >
                  Пред. месяц
                </button>
                <button 
                  onClick={() => {
                    const sysToday = new Date(2026, 5, 2);
                    setCalDate(sysToday);
                  }}
                  className="px-3 py-1.5 text-xs font-semibold bg-[#6366F1]/20 text-[#6366F1] border border-[#6366F1]/30 hover:bg-[#6366F1] hover:text-white rounded-lg transition"
                >
                  Сегодня
                </button>
                <button 
                  onClick={() => changeCalendarMonth(1)}
                  className="px-3 py-1.5 text-xs font-semibold bg-[#252836] hover:bg-[#2E3140] text-[#F1F5F9] rounded-lg transition"
                >
                  Следующий месяц
                </button>
              </div>
            </div>

            {/* Grid display */}
            <div className="grid grid-cols-7 gap-1" id="calendar-grid">
              
              {/* Day names row */}
              {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map((dayName) => (
                <div key={dayName} className="text-center text-[10px] font-bold text-[#94A3B8] uppercase py-2 tracking-wider bg-[#12151E] rounded-md border border-[#2E3140]/30">
                  {dayName}
                </div>
              ))}

              {/* Days mapping */}
              {calendarDays.map((slot, index) => {
                // Find tasks matching fullDateStr as deadline
                const dayTasks = filteredTasks.filter(t => t.deadline === slot.fullDateStr);
                const isToday = slot.fullDateStr === TODAY_STR;

                return (
                  <div 
                    key={index}
                    className={`min-h-[92px] p-1.5 rounded-lg border flex flex-col justify-between transition-colors overflow-hidden ${
                      slot.isCurrentMonth 
                        ? 'bg-[#0F1117] border-[#2E3140]' 
                        : 'bg-[#0F1117]/30 border-[#2E3140]/30 opacity-40'
                    }`}
                  >
                    
                    {/* Date label header */}
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-[11px] font-mono font-bold w-5.5 h-5.5 flex items-center justify-center rounded-full ${
                        isToday 
                          ? 'bg-[#6366F1] text-white shadow-[0_0_8px_rgba(99,102,241,0.6)] font-extrabold' 
                          : 'text-[#94A3B8]'
                      }`}>
                        {slot.dayNum}
                      </span>
                      {dayTasks.length > 0 && (
                        <span className="text-[8px] font-bold text-[#6366F1] bg-[#6366F1]/10 px-1 py-0.2 rounded font-mono">
                          {dayTasks.length} зад.
                        </span>
                      )}
                    </div>

                    {/* Strip tasks on this date */}
                    <div className="flex-1 space-y-1.5 overflow-hidden flex flex-col justify-end" id={`slot-tasks-${slot.fullDateStr}`}>
                      {dayTasks.slice(0, 3).map((t) => {
                        let stripColor = 'bg-[#6B7280]/20 border-l-[#94A3B8]/80 text-[#94A3B8] hover:bg-[#6B7280]/30';
                        if (t.status === 'done') {
                          stripColor = 'bg-[#22C55E]/10 border-l-[#22C55E] text-[#22C55E] hover:bg-[#22C55E]/15';
                        } else if (t.status === 'review') {
                          stripColor = 'bg-[#8B5CF6]/10 border-l-[#8B5CF6] text-[#8B5CF6] hover:bg-[#8B5CF6]/15';
                        } else if (t.status === 'changes') {
                          stripColor = 'bg-[#EF4444]/15 border-l-[#EF4444] text-[#EF4444] hover:bg-[#EF4444]/20';
                        } else if (t.status === 'in_progress') {
                          stripColor = 'bg-[#6366F1]/15 border-l-[#6366F1] text-indigo-300 hover:bg-[#6366F1]/20';
                        }

                        return (
                          <div
                            key={t.id}
                            onClick={() => onSelectTask(t)}
                            className={`text-[9px] font-semibold tracking-wide py-0.5 px-1.5 border-l-2 truncate rounded-r cursor-pointer transition ${stripColor}`}
                            title={t.title}
                          >
                            {t.title}
                          </div>
                        );
                      })}
                      {dayTasks.length > 3 && (
                        <span className="text-[8px] text-[#94A3B8] italic font-medium px-1 block text-right">
                          и еще {dayTasks.length - 3}...
                        </span>
                      )}
                    </div>

                  </div>
                );
              })}

            </div>

          </div>
        )}

      </div>

    </div>
  );
}
