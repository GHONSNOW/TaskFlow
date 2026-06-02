export type TaskStatus = 'new' | 'in_progress' | 'review' | 'changes' | 'done';

export type TaskPriority = 'critical' | 'high' | 'medium' | 'low';

export interface ChecklistItem {
  id: string;
  text: string;
  isDone: boolean;
}

export interface Comment {
  id: string;
  memberId: string;
  memberName: string;
  memberAvatar: string;
  text: string;
  createdAt: string; // e.g., "10 мин назад", "Сегодня, 14:20"
}

export interface TaskAttachment {
  id: string;
  name: string;
  type: string; // e.g., 'pdf', 'image', 'zip', 'doc'
}

export interface TaskHistoryEntry {
  id: string;
  text: string;
  time: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  departmentId: string;
  assigneeIds: string[]; // support multiple assignees
  priority: TaskPriority;
  status: TaskStatus;
  deadline: string; // YYYY-MM-DD
  checklist: ChecklistItem[];
  comments: Comment[];
  attachments: TaskAttachment[];
  loggedTime: string; // e.g., "2ч 30м"
  createdAt: string;
  creatorId: string;
  history: TaskHistoryEntry[];
  tags: string[];
}

export interface Member {
  id: string;
  name: string;
  email?: string;
  avatar: string; // unique color/initial or placeholder URL
  bgColor: string; // hex color for avatar background
  role: string;
  departmentId: string;
  isOnline: boolean;
  activeTasks: number;
  completedTasks: number;
  overdueTasks: number;
  workload: number; // percentage (0-100)
}

export interface Department {
  id: string;
  name: string;
  iconName: string; // lucide-react icon name mapper
  description: string;
  managerId: string;
  membersCount: number;
  totalTasks: number;
  activeTasks: number;
  completedTasks: number;
  overdueTasks: number;
}

export interface ActivityEvent {
  id: string;
  memberId: string;
  memberName: string;
  memberAvatar: string;
  action: string;
  time: string;
  type: 'success' | 'warning' | 'info' | 'error';
}
