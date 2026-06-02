import { Member, Department, Task, ActivityEvent } from './types';

export const DEPARTMENTS: Department[] = [
  {
    id: 'development',
    name: 'Разработка',
    iconName: 'Code2',
    description: 'Создание, тестирование и поддержка программных продуктов компании.',
    managerId: 'm1',
    membersCount: 1,
    totalTasks: 0,
    activeTasks: 0,
    completedTasks: 0,
    overdueTasks: 0,
  },
  {
    id: 'smm',
    name: 'SMM',
    iconName: 'Megaphone',
    description: 'Ведение социальных сетей, создание вирального контента и работа с сообществом.',
    managerId: 'm1',
    membersCount: 0,
    totalTasks: 0,
    activeTasks: 0,
    completedTasks: 0,
    overdueTasks: 0,
  },
  {
    id: 'marketing',
    name: 'Маркетинг',
    iconName: 'TrendingUp',
    description: 'Привлечение клиентов, контекстная реклама и удержание аудитории.',
    managerId: 'm1',
    membersCount: 0,
    totalTasks: 0,
    activeTasks: 0,
    completedTasks: 0,
    overdueTasks: 0,
  },
  {
    id: 'design',
    name: 'Дизайн',
    iconName: 'Palette',
    description: 'Разработка интерфейсов, элементов фирменного стиля и рекламных баннеров.',
    managerId: 'm1',
    membersCount: 0,
    totalTasks: 0,
    activeTasks: 0,
    completedTasks: 0,
    overdueTasks: 0,
  },
  {
    id: 'support',
    name: 'Операторы',
    iconName: 'Headphones',
    description: 'Помощь пользователям, обработка обращений и решение инцидентов 24/7.',
    managerId: 'm1',
    membersCount: 0,
    totalTasks: 0,
    activeTasks: 0,
    completedTasks: 0,
    overdueTasks: 0,
  },
];

export const MEMBERS: Member[] = [
  {
    id: 'm1',
    name: 'Алексей Иванов',
    avatar: 'АИ',
    bgColor: '#EF4444', // Red
    role: 'Руководитель разработки',
    departmentId: 'development',
    isOnline: true,
    activeTasks: 0,
    completedTasks: 0,
    overdueTasks: 0,
    workload: 15,
  }
];

export const INITIAL_TASKS: Task[] = [];

export const INITIAL_EVENTS: ActivityEvent[] = [];
