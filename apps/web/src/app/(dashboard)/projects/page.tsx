'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import {
  Plus,
  Search,
  FolderKanban,
  ArrowLeft,
  Calendar,
  Users,
  Trash2,
  UserPlus,
  Mail,
  MoreHorizontal,
  Edit2,
  Clock,
  ListTodo,
  KanbanSquare,
  BarChart3,
  Settings,
  AlertCircle,
  RefreshCw,
  Filter,
  ChevronDown,
  Eye,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useProjects, useProject, useCreateProject, useAddProjectMember, useRemoveProjectMember } from '@/hooks/use-projects';
import { useTasks, useCreateTask } from '@/hooks/use-tasks';
import { useUsers } from '@/hooks/use-users';
import { formatDate, cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ProjectMember {
  id: string;
  userId: string;
  role: 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';
}

interface Project {
  id: string;
  name: string;
  description?: string;
  status: string;
  priority?: string;
  progress: number;
  dueDate?: string;
  startDate?: string;
  color?: string;
  emoji?: string;
  _count?: { tasks: number };
  members?: ProjectMember[];
}

interface User {
  id: string;
  name?: string;
  email: string;
  avatar?: string;
}

interface Task {
  id: string;
  title: string;
  status: string;
  priority: string;
  assigneeId?: string;
  dueDate?: string;
}

const statusColors: Record<string, string> = {
  PLANNING: 'bg-gray-500',
  ACTIVE: 'bg-green-500',
  ON_HOLD: 'bg-yellow-500',
  COMPLETED: 'bg-blue-500',
  CANCELLED: 'bg-red-500',
};

const priorityColors: Record<string, string> = {
  LOW: 'text-gray-500',
  MEDIUM: 'text-yellow-600',
  HIGH: 'text-orange-500',
  URGENT: 'text-red-500',
};

const priorityWeights: Record<string, number> = {
  URGENT: 4,
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1,
};

function sortByPriority(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => (priorityWeights[b.priority] || 0) - (priorityWeights[a.priority] || 0));
}

interface MetricProps {
  label: string;
  value: number;
  isActive?: boolean;
  onClick?: () => void;
}

function Metric({ label, value, isActive, onClick }: MetricProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex flex-col items-center px-4 py-2 rounded-md transition-all duration-200',
        isActive
          ? 'bg-[#0070d2] text-white'
          : 'text-gray-700 hover:bg-gray-100'
      )}
    >
      <span className="font-semibold text-lg">{value}</span>
      <span className={cn('text-xs whitespace-nowrap', isActive ? 'text-white/80' : 'text-gray-500')}>
        {label}
      </span>
    </button>
  );
}

export default function ProjectsPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedProjectId = searchParams.get('id');

  const [search, setSearch] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedRole, setSelectedRole] = useState<'ADMIN' | 'MEMBER' | 'VIEWER'>('MEMBER');
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data, isLoading, refetch } = useProjects({ search: search || undefined });
  const { data: projectDetail, isLoading: isLoadingDetail } = useProject(selectedProjectId || '');
  const { data: users } = useUsers();
  const { data: tasksData } = useTasks({ projectId: selectedProjectId || undefined, limit: 100 });
  const createProjectMutation = useCreateProject();
  const addMemberMutation = useAddProjectMember();
  const removeMemberMutation = useRemoveProjectMember();
  const createTaskMutation = useCreateTask();

  const projects = (data?.data as Project[]) || [];
  const projectData = projectDetail as Project | undefined;
  const allUsers = (users as User[]) || [];
  const tasks = (tasksData?.data as Task[]) || [];

  const availableUsers = allUsers.filter(
    u => !projectData?.members?.some(m => m.userId === u.id)
  );

  const getUserById = (userId: string): User | undefined => {
    return allUsers.find(u => u.id === userId);
  };

  const getStatusLabel = (status: string): string => {
    const statusKey = status.toLowerCase().replace('_', '');
    return t(`projects.status.${statusKey}`, status);
  };

  const getTaskStatusLabel = (status: string): string => {
    const statusMap: Record<string, string> = {
      'TODO': t('tasks.status.todo'),
      'IN_PROGRESS': t('tasks.status.inProgress'),
      'IN_REVIEW': t('tasks.status.inReview'),
      'DONE': t('tasks.status.done'),
    };
    return statusMap[status] || status.replace('_', ' ');
  };

  const getPriorityLabel = (priority: string): string => {
    return t(`common.priorities.${priority.toLowerCase()}`, priority);
  };

  const getRoleLabel = (role: string): string => {
    const roleMap: Record<string, string> = {
      'OWNER': t('team.roles.owner'),
      'ADMIN': t('team.roles.admin'),
      'MEMBER': t('team.roles.member'),
      'VIEWER': t('team.roles.viewer'),
    };
    return roleMap[role] || role;
  };

  const tasksByStatus = {
    TODO: sortByPriority(tasks.filter(t => t.status === 'TODO')),
    IN_PROGRESS: sortByPriority(tasks.filter(t => t.status === 'IN_PROGRESS')),
    IN_REVIEW: sortByPriority(tasks.filter(t => t.status === 'IN_REVIEW')),
    DONE: sortByPriority(tasks.filter(t => t.status === 'DONE')),
  };

  // Calculate metrics
  const metrics = {
    all: projects.length,
    active: projects.filter(p => p.status === 'ACTIVE').length,
    planning: projects.filter(p => p.status === 'PLANNING').length,
    onHold: projects.filter(p => p.status === 'ON_HOLD').length,
    completed: projects.filter(p => p.status === 'COMPLETED').length,
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const handleCreateProject = () => {
    if (!newName.trim()) return;

    createProjectMutation.mutate(
      { name: newName, description: newDescription },
      {
        onSuccess: (result) => {
          toast.success(t('common.success'));
          setIsCreateDialogOpen(false);
          setNewName('');
          setNewDescription('');
          if (result && typeof result === 'object' && 'id' in result) {
            router.push(`/projects?id=${result.id}`);
          }
        },
        onError: (error) => {
          toast.error(error instanceof Error ? error.message : t('errors.general'));
        },
      }
    );
  };

  const handleAddMember = () => {
    if (!selectedProjectId || !selectedUserId) return;

    addMemberMutation.mutate(
      { projectId: selectedProjectId, userId: selectedUserId, role: selectedRole },
      {
        onSuccess: () => {
          toast.success(t('team.messages.memberAdded'));
          setSelectedUserId('');
          setIsInviteDialogOpen(false);
        },
        onError: (error) => {
          toast.error(error instanceof Error ? error.message : t('errors.general'));
        },
      }
    );
  };

  const handleInviteByEmail = () => {
    if (!inviteEmail.trim()) return;

    const existingUser = allUsers.find(u => u.email.toLowerCase() === inviteEmail.toLowerCase());

    if (existingUser && selectedProjectId) {
      addMemberMutation.mutate(
        { projectId: selectedProjectId, userId: existingUser.id, role: selectedRole },
        {
          onSuccess: () => {
            toast.success(t('team.messages.memberAdded'));
            setInviteEmail('');
            setIsInviteDialogOpen(false);
          },
          onError: (error) => {
            toast.error(error instanceof Error ? error.message : t('errors.general'));
          },
        }
      );
    } else {
      toast.success(t('team.messages.invitationSent', { email: inviteEmail }));
      setInviteEmail('');
      setIsInviteDialogOpen(false);
    }
  };

  const handleRemoveMember = (userId: string) => {
    if (!selectedProjectId) return;

    removeMemberMutation.mutate(
      { projectId: selectedProjectId, userId },
      {
        onSuccess: () => {
          toast.success(t('team.messages.memberRemoved'));
        },
        onError: (error) => {
          toast.error(error instanceof Error ? error.message : t('errors.general'));
        },
      }
    );
  };

  const handleQuickAddTask = () => {
    if (!newTaskTitle.trim() || !selectedProjectId) return;

    createTaskMutation.mutate(
      { title: newTaskTitle, projectId: selectedProjectId },
      {
        onSuccess: () => {
          toast.success(t('tasks.messages.created'));
          setNewTaskTitle('');
          setIsAddingTask(false);
        },
        onError: (error) => {
          toast.error(error instanceof Error ? error.message : t('errors.general'));
        },
      }
    );
  };

  // Filter projects based on active filter
  const filteredProjects = projects.filter(project => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'active') return project.status === 'ACTIVE';
    if (activeFilter === 'planning') return project.status === 'PLANNING';
    if (activeFilter === 'onHold') return project.status === 'ON_HOLD';
    if (activeFilter === 'completed') return project.status === 'COMPLETED';
    return true;
  });

  // Project Detail View
  if (selectedProjectId) {
    if (isLoadingDetail) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#0070d2]" />
        </div>
      );
    }

    if (!projectData) {
      return (
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <AlertCircle className="h-12 w-12 text-gray-400" />
          <p className="text-gray-500">{t('projects.projectNotFound')}</p>
          <Button variant="outline" onClick={() => router.push('/projects')}>
            {t('projects.backToProjects')}
          </Button>
        </div>
      );
    }

    return (
      <div className="h-full flex flex-col bg-[#f4f6f9]">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => router.push('/projects')}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div
                className="flex h-10 w-10 items-center justify-center rounded-lg"
                style={{ backgroundColor: projectData.color ? `${projectData.color}20` : '#0070d220' }}
              >
                {projectData.emoji || <FolderKanban className="h-5 w-5" style={{ color: projectData.color || '#0070d2' }} />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">{t('projects.title')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-semibold text-gray-900">{projectData.name}</h1>
                  <Badge className={`${statusColors[projectData.status]} text-white`}>
                    {getStatusLabel(projectData.status)}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => setIsInviteDialogOpen(true)}>
                <UserPlus className="h-4 w-4 mr-2" />
                {t('team.inviteToProject')}
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>
                    <Edit2 className="h-4 w-4 mr-2" />
                    {t('projects.editProject')}
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Settings className="h-4 w-4 mr-2" />
                    {t('common.settings')}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-red-600">
                    <Trash2 className="h-4 w-4 mr-2" />
                    {t('projects.deleteProject')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex-1 overflow-auto p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="bg-white border border-gray-200 mb-6">
              <TabsTrigger value="overview" className="gap-2">
                <BarChart3 className="h-4 w-4" />
                {t('projects.overview')}
              </TabsTrigger>
              <TabsTrigger value="tasks" className="gap-2">
                <ListTodo className="h-4 w-4" />
                {t('projects.tasks')}
              </TabsTrigger>
              <TabsTrigger value="board" className="gap-2">
                <KanbanSquare className="h-4 w-4" />
                {t('projects.board')}
              </TabsTrigger>
              <TabsTrigger value="team" className="gap-2">
                <Users className="h-4 w-4" />
                {t('projects.team')}
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid gap-6 md:grid-cols-3">
                <Card className="bg-white border-gray-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-500">{t('projects.stats.progress')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-gray-900">{projectData.progress}%</div>
                    <div className="mt-2 h-2 rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${projectData.progress}%`,
                          backgroundColor: projectData.color || '#0070d2'
                        }}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white border-gray-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-500">{t('projects.tasks')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-gray-900">{tasks.length}</div>
                    <div className="flex gap-4 mt-2 text-sm text-gray-500">
                      <span>{tasksByStatus.DONE.length} {t('common.completed').toLowerCase()}</span>
                      <span>{tasksByStatus.IN_PROGRESS.length} {t('common.inProgress').toLowerCase()}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white border-gray-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-500">{t('projects.team')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-gray-900">{projectData.members?.length || 0}</div>
                    <div className="flex -space-x-2 mt-2">
                      {projectData.members?.slice(0, 5).map((member) => {
                        const user = getUserById(member.userId);
                        return (
                          <Avatar key={member.id} className="h-8 w-8 border-2 border-white">
                            <AvatarImage src={user?.avatar} />
                            <AvatarFallback className="text-xs bg-gray-100 text-gray-600">
                              {user?.name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                            </AvatarFallback>
                          </Avatar>
                        );
                      })}
                      {(projectData.members?.length || 0) > 5 && (
                        <div className="flex items-center justify-center h-8 w-8 rounded-full bg-gray-100 text-xs font-medium text-gray-600">
                          +{(projectData.members?.length || 0) - 5}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className="bg-white border-gray-200">
                <CardHeader>
                  <CardTitle className="text-gray-900">{t('projects.taskOverview')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 gap-4">
                    <div className="bg-gray-50 rounded-lg p-4 text-center">
                      <div className="text-3xl font-bold text-gray-900">{tasksByStatus.TODO.length}</div>
                      <div className="text-sm text-gray-500 mt-1">{getTaskStatusLabel('TODO')}</div>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-4 text-center">
                      <div className="text-3xl font-bold text-[#0070d2]">{tasksByStatus.IN_PROGRESS.length}</div>
                      <div className="text-sm text-gray-500 mt-1">{getTaskStatusLabel('IN_PROGRESS')}</div>
                    </div>
                    <div className="bg-yellow-50 rounded-lg p-4 text-center">
                      <div className="text-3xl font-bold text-yellow-600">{tasksByStatus.IN_REVIEW.length}</div>
                      <div className="text-sm text-gray-500 mt-1">{getTaskStatusLabel('IN_REVIEW')}</div>
                    </div>
                    <div className="bg-green-50 rounded-lg p-4 text-center">
                      <div className="text-3xl font-bold text-green-600">{tasksByStatus.DONE.length}</div>
                      <div className="text-sm text-gray-500 mt-1">{getTaskStatusLabel('DONE')}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid gap-6 md:grid-cols-2">
                <Card className="bg-white border-gray-200">
                  <CardHeader>
                    <CardTitle className="text-gray-900">{t('common.details')}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {projectData.description && (
                      <div>
                        <span className="text-sm text-gray-500">{t('common.description')}</span>
                        <p className="mt-1 text-gray-900">{projectData.description}</p>
                      </div>
                    )}
                    {projectData.priority && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">{t('common.priority')}</span>
                        <span className={`font-medium ${priorityColors[projectData.priority]}`}>
                          {getPriorityLabel(projectData.priority)}
                        </span>
                      </div>
                    )}
                    {projectData.startDate && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">{t('projects.fields.startDate')}</span>
                        <span className="flex items-center gap-2 text-gray-900">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          {formatDate(projectData.startDate)}
                        </span>
                      </div>
                    )}
                    {projectData.dueDate && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">{t('projects.fields.dueDate')}</span>
                        <span className="flex items-center gap-2 text-gray-900">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          {formatDate(projectData.dueDate)}
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="bg-white border-gray-200">
                  <CardHeader>
                    <CardTitle className="text-gray-900">{t('projects.recentActivity')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-500 text-center py-8">{t('projects.noRecentActivity')}</p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Tasks Tab */}
            <TabsContent value="tasks" className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">{t('projects.allTasks')}</h3>
                <Button onClick={() => setIsAddingTask(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  {t('tasks.addTask')}
                </Button>
              </div>

              {isAddingTask && (
                <Card className="bg-white border-gray-200">
                  <CardContent className="pt-4">
                    <div className="flex gap-2">
                      <Input
                        placeholder={t('tasks.taskTitle')}
                        value={newTaskTitle}
                        onChange={(e) => setNewTaskTitle(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleQuickAddTask()}
                        autoFocus
                      />
                      <Button onClick={handleQuickAddTask} disabled={createTaskMutation.isPending}>
                        {t('common.add')}
                      </Button>
                      <Button variant="ghost" onClick={() => setIsAddingTask(false)}>
                        {t('common.cancel')}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="space-y-2">
                {tasks.length === 0 ? (
                  <Card className="bg-white border-gray-200">
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <ListTodo className="h-12 w-12 text-gray-300 mb-4" />
                      <p className="text-gray-500">{t('tasks.noTasksYet')}</p>
                      <Button variant="link" onClick={() => setIsAddingTask(true)} className="text-[#0070d2]">
                        {t('tasks.createFirstTask')}
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  sortByPriority(tasks).map((task) => (
                    <Card key={task.id} className="bg-white border-gray-200 hover:shadow-sm transition-shadow cursor-pointer">
                      <CardContent className="flex items-center justify-between py-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${
                            task.status === 'DONE' ? 'bg-green-500' :
                            task.status === 'IN_PROGRESS' ? 'bg-blue-500' :
                            task.status === 'IN_REVIEW' ? 'bg-yellow-500' : 'bg-gray-400'
                          }`} />
                          <span className={task.status === 'DONE' ? 'line-through text-gray-400' : 'text-gray-900'}>
                            {task.title}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {task.assigneeId && (
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={getUserById(task.assigneeId)?.avatar} />
                              <AvatarFallback className="text-[10px] bg-gray-100">
                                {getUserById(task.assigneeId)?.name?.charAt(0) || 'U'}
                              </AvatarFallback>
                            </Avatar>
                          )}
                          {task.dueDate && (
                            <span className="text-xs text-gray-500 flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatDate(task.dueDate)}
                            </span>
                          )}
                          <Badge variant="outline" className={priorityColors[task.priority]}>
                            {getPriorityLabel(task.priority)}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>

              <Link href={`/tasks?project=${selectedProjectId}`}>
                <Button variant="outline" className="w-full border-[#0070d2] text-[#0070d2] hover:bg-blue-50">
                  {t('projects.viewAllInTaskManager')}
                </Button>
              </Link>
            </TabsContent>

            {/* Board Tab */}
            <TabsContent value="board">
              <div className="flex gap-4 overflow-x-auto pb-4">
                {Object.entries(tasksByStatus).map(([status, statusTasks]) => (
                  <div key={status} className="flex-shrink-0 w-72 space-y-2">
                    <div className="flex items-center justify-between px-2">
                      <div className="flex items-center gap-2">
                        <div className={`h-3 w-3 rounded-full ${
                          status === 'DONE' ? 'bg-green-500' :
                          status === 'IN_PROGRESS' ? 'bg-blue-500' :
                          status === 'IN_REVIEW' ? 'bg-yellow-500' : 'bg-gray-500'
                        }`} />
                        <h4 className="font-medium text-sm text-gray-900">
                          {getTaskStatusLabel(status)}
                        </h4>
                      </div>
                      <Badge variant="secondary" className="bg-gray-100 text-gray-600">{statusTasks.length}</Badge>
                    </div>
                    <div className="space-y-2 min-h-[300px] p-2 rounded-lg border-2 border-dashed border-gray-200 bg-gray-50">
                      {statusTasks.length === 0 ? (
                        <div className="flex h-full min-h-[200px] items-center justify-center text-center text-sm text-gray-400">
                          <p>{t('tasks.noTasksYet')}</p>
                        </div>
                      ) : (
                        statusTasks.map((task) => (
                          <Card key={task.id} className="cursor-pointer hover:shadow-sm bg-white border-gray-200">
                            <CardContent className="p-3">
                              <p className="text-sm font-medium text-gray-900">{task.title}</p>
                              <div className="flex items-center justify-between mt-2">
                                {task.assigneeId ? (
                                  <Avatar className="h-5 w-5">
                                    <AvatarImage src={getUserById(task.assigneeId)?.avatar} />
                                    <AvatarFallback className="text-[9px] bg-gray-100">
                                      {getUserById(task.assigneeId)?.name?.charAt(0) || 'U'}
                                    </AvatarFallback>
                                  </Avatar>
                                ) : (
                                  <span />
                                )}
                                <Badge variant="outline" className={`text-xs ${priorityColors[task.priority]}`}>
                                  {getPriorityLabel(task.priority)}
                                </Badge>
                              </div>
                            </CardContent>
                          </Card>
                        ))
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            {/* Team Tab */}
            <TabsContent value="team" className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">{t('team.teamMembers')}</h3>
                <Button onClick={() => setIsInviteDialogOpen(true)}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  {t('team.addMember')}
                </Button>
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {projectData.members?.map((member) => {
                  const user = getUserById(member.userId);
                  return (
                    <Card key={member.id} className="bg-white border-gray-200">
                      <CardContent className="flex items-center gap-3 p-4">
                        <Avatar className="h-10 w-10 flex-shrink-0">
                          <AvatarImage src={user?.avatar} />
                          <AvatarFallback className="bg-gray-100 text-gray-600">
                            {user?.name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-gray-900 truncate">{user?.name || t('common.unknown')}</p>
                          <p className="text-sm text-gray-500 truncate">{user?.email}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Badge variant={member.role === 'OWNER' ? 'default' : 'secondary'} className="bg-gray-100 text-gray-600">
                            {getRoleLabel(member.role)}
                          </Badge>
                          {member.role !== 'OWNER' && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                              onClick={() => handleRemoveMember(member.userId)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Invite Dialog */}
        <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
          <DialogContent className="bg-white">
            <DialogHeader>
              <DialogTitle className="text-gray-900">{t('team.inviteToProject')}</DialogTitle>
              <DialogDescription className="text-gray-500">
                {t('team.inviteDescription')}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              <div className="space-y-3">
                <Label className="text-gray-700">{t('team.addExistingUser')}</Label>
                <div className="flex gap-2">
                  <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder={t('team.selectUser')} />
                    </SelectTrigger>
                    <SelectContent>
                      {availableUsers.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          <span className="flex items-center gap-2">
                            <Avatar className="h-5 w-5">
                              <AvatarImage src={user.avatar} />
                              <AvatarFallback className="text-[9px]">
                                {user.name?.charAt(0) || user.email?.charAt(0) || 'U'}
                              </AvatarFallback>
                            </Avatar>
                            {user.name || user.email}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as 'ADMIN' | 'MEMBER' | 'VIEWER')}>
                    <SelectTrigger className="w-28">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ADMIN">{t('team.roles.admin')}</SelectItem>
                      <SelectItem value="MEMBER">{t('team.roles.member')}</SelectItem>
                      <SelectItem value="VIEWER">{t('team.roles.viewer')}</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={handleAddMember} disabled={!selectedUserId || addMemberMutation.isPending}>
                    {t('common.add')}
                  </Button>
                </div>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-gray-500">{t('common.or')}</span>
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-gray-700">{t('team.inviteByEmail')}</Label>
                <p className="text-sm text-gray-500">
                  {t('team.inviteDescription')}
                </p>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      type="email"
                      placeholder="email@example.com"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <Button onClick={handleInviteByEmail} disabled={!inviteEmail.trim()}>
                    <Mail className="h-4 w-4 mr-2" />
                    {t('team.sendInvite')}
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Projects List View
  return (
    <div className="h-full flex flex-col bg-[#f4f6f9]">
      {/* Page Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-[#0070d2] to-[#00a1e0]">
              <FolderKanban className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">{t('projects.title')}</span>
              </div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-semibold text-gray-900">{t('projects.title')}</h1>
                <ChevronDown className="h-4 w-4 text-gray-400" />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button className="p-2 rounded-md text-gray-500 hover:bg-gray-100 transition-colors">
              <Settings className="h-5 w-5" />
            </button>
            <button
              onClick={handleRefresh}
              className={cn(
                'p-2 rounded-md text-gray-500 hover:bg-gray-100 transition-colors',
                isRefreshing && 'animate-spin'
              )}
            >
              <RefreshCw className="h-5 w-5" />
            </button>
            <button className="p-2 rounded-md text-gray-500 hover:bg-gray-100 transition-colors">
              <Filter className="h-5 w-5" />
            </button>

            <Button
              onClick={() => setIsCreateDialogOpen(true)}
              variant="outline"
              className="border-[#0070d2] text-[#0070d2] hover:bg-blue-50"
            >
              {t('projects.newProject')}
            </Button>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-[#16325c] px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 rounded-lg">
            <Metric
              label={t('common.all')}
              value={metrics.all}
              isActive={activeFilter === 'all'}
              onClick={() => setActiveFilter('all')}
            />
            <Metric
              label={t('projects.status.active')}
              value={metrics.active}
              isActive={activeFilter === 'active'}
              onClick={() => setActiveFilter('active')}
            />
            <Metric
              label={t('projects.status.planning')}
              value={metrics.planning}
              isActive={activeFilter === 'planning'}
              onClick={() => setActiveFilter('planning')}
            />
            <Metric
              label={t('projects.status.onHold')}
              value={metrics.onHold}
              isActive={activeFilter === 'onHold'}
              onClick={() => setActiveFilter('onHold')}
            />
            <Metric
              label={t('projects.status.completed')}
              value={metrics.completed}
              isActive={activeFilter === 'completed'}
              onClick={() => setActiveFilter('completed')}
            />
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/50" />
            <Input
              placeholder={t('projects.searchProjects')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-64 pl-9 bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:bg-white/20"
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-gray-600">
            {filteredProjects.length} {t('projects.title').toLowerCase()}
          </p>
        </div>

        <div className="sf-card animate-fade-in">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#0070d2]" />
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <FolderKanban className="h-12 w-12 text-gray-300 mb-4" />
              <p className="text-gray-500">{t('projects.noProjects')}</p>
              <Button variant="link" onClick={() => setIsCreateDialogOpen(true)} className="text-[#0070d2]">
                {t('projects.createFirstProject')}
              </Button>
            </div>
          ) : (
            <table className="sf-table">
              <thead>
                <tr>
                  <th>{t('projects.fields.name')}</th>
                  <th>{t('common.status')}</th>
                  <th>{t('projects.stats.progress')}</th>
                  <th>{t('projects.tasks')}</th>
                  <th>{t('projects.fields.dueDate')}</th>
                  <th className="w-24"></th>
                </tr>
              </thead>
              <tbody className="stagger-children">
                {filteredProjects.map((project) => (
                  <tr
                    key={project.id}
                    className="cursor-pointer"
                    onClick={() => router.push(`/projects?id=${project.id}`)}
                  >
                    <td>
                      <div className="flex items-center gap-3">
                        <div
                          className="flex h-9 w-9 items-center justify-center rounded-lg"
                          style={{ backgroundColor: project.color ? `${project.color}20` : '#0070d220' }}
                        >
                          <FolderKanban className="h-5 w-5" style={{ color: project.color || '#0070d2' }} />
                        </div>
                        <div>
                          <Link
                            href={`/projects?id=${project.id}`}
                            className="font-medium text-[#0070d2] hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {project.name}
                          </Link>
                          {project.description && (
                            <p className="text-xs text-gray-500 truncate max-w-[200px]">{project.description}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      <Badge className={`${statusColors[project.status]} text-white`}>
                        {getStatusLabel(project.status)}
                      </Badge>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 rounded-full bg-gray-100 overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${project.progress}%`,
                              backgroundColor: project.color || '#0070d2'
                            }}
                          />
                        </div>
                        <span className="text-sm text-gray-600">{project.progress}%</span>
                      </div>
                    </td>
                    <td className="text-gray-600">
                      {project._count?.tasks || 0} {t('projects.tasks').toLowerCase()}
                    </td>
                    <td className="text-gray-500">
                      {project.dueDate ? formatDate(project.dueDate) : '—'}
                    </td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-1">
                        <button
                          className="p-1.5 rounded-md text-gray-400 hover:text-[#0070d2] hover:bg-blue-50 transition-all"
                          onClick={() => router.push(`/projects?id=${project.id}`)}
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all">
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Create Project Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle className="text-gray-900">{t('projects.createNewProject')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-gray-700">{t('projects.projectName')}</Label>
              <Input
                id="name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description" className="text-gray-700">{t('common.description')}</Label>
              <Textarea
                id="description"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder={t('projects.projectDescription')}
                rows={3}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleCreateProject}
              disabled={!newName.trim() || createProjectMutation.isPending}
            >
              {createProjectMutation.isPending ? t('projects.creating') : t('projects.createProject')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
