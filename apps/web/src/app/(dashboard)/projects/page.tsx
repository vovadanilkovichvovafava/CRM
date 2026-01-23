'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
import { formatDate } from '@/lib/utils';
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
  LOW: 'text-slate-500',
  MEDIUM: 'text-yellow-500',
  HIGH: 'text-orange-500',
  URGENT: 'text-red-500',
};

// Priority weights for sorting (higher = more important = should appear first)
const priorityWeights: Record<string, number> = {
  URGENT: 4,
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1,
};

// Sort tasks by priority (URGENT on top)
function sortByPriority(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => (priorityWeights[b.priority] || 0) - (priorityWeights[a.priority] || 0));
}

export default function ProjectsPage() {
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

  const { data, isLoading } = useProjects({ search: search || undefined });
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

  const tasksByStatus = {
    TODO: sortByPriority(tasks.filter(t => t.status === 'TODO')),
    IN_PROGRESS: sortByPriority(tasks.filter(t => t.status === 'IN_PROGRESS')),
    IN_REVIEW: sortByPriority(tasks.filter(t => t.status === 'IN_REVIEW')),
    DONE: sortByPriority(tasks.filter(t => t.status === 'DONE')),
  };

  const handleCreateProject = () => {
    if (!newName.trim()) return;

    createProjectMutation.mutate(
      { name: newName, description: newDescription },
      {
        onSuccess: (result) => {
          toast.success('Project created');
          setIsCreateDialogOpen(false);
          setNewName('');
          setNewDescription('');
          if (result && typeof result === 'object' && 'id' in result) {
            router.push(`/projects?id=${result.id}`);
          }
        },
        onError: (error) => {
          toast.error(error instanceof Error ? error.message : 'Failed to create project');
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
          toast.success('Member added');
          setSelectedUserId('');
          setIsInviteDialogOpen(false);
        },
        onError: (error) => {
          toast.error(error instanceof Error ? error.message : 'Failed to add member');
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
            toast.success('Member added');
            setInviteEmail('');
            setIsInviteDialogOpen(false);
          },
          onError: (error) => {
            toast.error(error instanceof Error ? error.message : 'Failed to add member');
          },
        }
      );
    } else {
      toast.success(`Invitation sent to ${inviteEmail}`);
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
          toast.success('Member removed');
        },
        onError: (error) => {
          toast.error(error instanceof Error ? error.message : 'Failed to remove member');
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
          toast.success('Task created');
          setNewTaskTitle('');
          setIsAddingTask(false);
        },
        onError: (error) => {
          toast.error(error instanceof Error ? error.message : 'Failed to create task');
        },
      }
    );
  };

  // Project Detail View
  if (selectedProjectId) {
    if (isLoadingDetail) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary" />
        </div>
      );
    }

    if (!projectData) {
      return (
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <AlertCircle className="h-12 w-12 text-muted-foreground" />
          <p className="text-muted-foreground">Project not found</p>
          <Button variant="outline" onClick={() => router.push('/projects')}>
            Back to Projects
          </Button>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.push('/projects')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-4">
              <div
                className="flex h-14 w-14 items-center justify-center rounded-xl text-2xl"
                style={{ backgroundColor: projectData.color ? `${projectData.color}20` : 'hsl(var(--primary) / 0.1)' }}
              >
                {projectData.emoji || <FolderKanban className="h-7 w-7" style={{ color: projectData.color || 'hsl(var(--primary))' }} />}
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold">{projectData.name}</h1>
                  <Badge className={`${statusColors[projectData.status]} text-white`}>
                    {projectData.status}
                  </Badge>
                </div>
                {projectData.description && (
                  <p className="text-muted-foreground mt-1">{projectData.description}</p>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setIsInviteDialogOpen(true)}>
              <UserPlus className="h-4 w-4 mr-2" />
              Invite
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
                  Edit Project
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Project
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="overview" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="tasks" className="gap-2">
              <ListTodo className="h-4 w-4" />
              Tasks
            </TabsTrigger>
            <TabsTrigger value="board" className="gap-2">
              <KanbanSquare className="h-4 w-4" />
              Board
            </TabsTrigger>
            <TabsTrigger value="team" className="gap-2">
              <Users className="h-4 w-4" />
              Team
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Progress</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{projectData.progress}%</div>
                  <div className="mt-2 h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${projectData.progress}%`,
                        backgroundColor: projectData.color || 'hsl(var(--primary))'
                      }}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Tasks</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{tasks.length}</div>
                  <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                    <span>{tasksByStatus.DONE.length} completed</span>
                    <span>{tasksByStatus.IN_PROGRESS.length} in progress</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Team</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{projectData.members?.length || 0}</div>
                  <div className="flex -space-x-2 mt-2">
                    {projectData.members?.slice(0, 5).map((member) => {
                      const user = getUserById(member.userId);
                      return (
                        <Avatar key={member.id} className="h-8 w-8 border-2 border-background">
                          <AvatarImage src={user?.avatar} />
                          <AvatarFallback className="text-xs">
                            {user?.name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                      );
                    })}
                    {(projectData.members?.length || 0) > 5 && (
                      <div className="flex items-center justify-center h-8 w-8 rounded-full bg-muted text-xs font-medium">
                        +{(projectData.members?.length || 0) - 5}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Task Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-4">
                  <div className="bg-muted/50 rounded-lg p-4 text-center">
                    <div className="text-3xl font-bold">{tasksByStatus.TODO.length}</div>
                    <div className="text-sm text-muted-foreground mt-1">To Do</div>
                  </div>
                  <div className="bg-blue-500/10 rounded-lg p-4 text-center">
                    <div className="text-3xl font-bold text-blue-500">{tasksByStatus.IN_PROGRESS.length}</div>
                    <div className="text-sm text-muted-foreground mt-1">In Progress</div>
                  </div>
                  <div className="bg-yellow-500/10 rounded-lg p-4 text-center">
                    <div className="text-3xl font-bold text-yellow-500">{tasksByStatus.IN_REVIEW.length}</div>
                    <div className="text-sm text-muted-foreground mt-1">In Review</div>
                  </div>
                  <div className="bg-green-500/10 rounded-lg p-4 text-center">
                    <div className="text-3xl font-bold text-green-500">{tasksByStatus.DONE.length}</div>
                    <div className="text-sm text-muted-foreground mt-1">Done</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {projectData.priority && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Priority</span>
                      <span className={`font-medium ${priorityColors[projectData.priority]}`}>
                        {projectData.priority}
                      </span>
                    </div>
                  )}
                  {projectData.startDate && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Start Date</span>
                      <span className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {formatDate(projectData.startDate)}
                      </span>
                    </div>
                  )}
                  {projectData.dueDate && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Due Date</span>
                      <span className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {formatDate(projectData.dueDate)}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-center py-8">No recent activity</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Tasks Tab */}
          <TabsContent value="tasks" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">All Tasks</h3>
              <Button onClick={() => setIsAddingTask(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Task
              </Button>
            </div>

            {isAddingTask && (
              <Card>
                <CardContent className="pt-4">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Task title..."
                      value={newTaskTitle}
                      onChange={(e) => setNewTaskTitle(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleQuickAddTask()}
                      autoFocus
                    />
                    <Button onClick={handleQuickAddTask} disabled={createTaskMutation.isPending}>
                      Add
                    </Button>
                    <Button variant="ghost" onClick={() => setIsAddingTask(false)}>
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="space-y-2">
              {tasks.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <ListTodo className="h-12 w-12 text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground">No tasks yet</p>
                    <Button variant="link" onClick={() => setIsAddingTask(true)}>
                      Create your first task
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                sortByPriority(tasks).map((task) => (
                  <Card key={task.id} className="hover:shadow-sm transition-shadow cursor-pointer">
                    <CardContent className="flex items-center justify-between py-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${
                          task.status === 'DONE' ? 'bg-green-500' :
                          task.status === 'IN_PROGRESS' ? 'bg-blue-500' :
                          task.status === 'IN_REVIEW' ? 'bg-yellow-500' : 'bg-gray-400'
                        }`} />
                        <span className={task.status === 'DONE' ? 'line-through text-muted-foreground' : ''}>
                          {task.title}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {task.assigneeId && (
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={getUserById(task.assigneeId)?.avatar} />
                            <AvatarFallback className="text-[10px]">
                              {getUserById(task.assigneeId)?.name?.charAt(0) || 'U'}
                            </AvatarFallback>
                          </Avatar>
                        )}
                        {task.dueDate && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDate(task.dueDate)}
                          </span>
                        )}
                        <Badge variant="outline" className={priorityColors[task.priority]}>
                          {task.priority}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>

            <Link href={`/tasks?project=${selectedProjectId}`}>
              <Button variant="outline" className="w-full">
                View All in Task Manager
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
                      <h4 className="font-medium text-sm">
                        {status.replace('_', ' ')}
                      </h4>
                    </div>
                    <Badge variant="secondary">{statusTasks.length}</Badge>
                  </div>
                  <div className="space-y-2 min-h-[300px] p-2 rounded-lg border-2 border-dashed border-white/10 bg-white/[0.02]">
                    {statusTasks.length === 0 ? (
                      <div className="flex h-full min-h-[200px] items-center justify-center text-center text-sm text-muted-foreground">
                        <div>
                          <p>No tasks</p>
                          <p className="text-xs">Drag here to move</p>
                        </div>
                      </div>
                    ) : (
                      statusTasks.map((task) => (
                        <Card key={task.id} className="cursor-pointer hover:shadow-sm border-white/10 bg-white/5">
                          <CardContent className="p-3">
                            <p className="text-sm font-medium">{task.title}</p>
                            <div className="flex items-center justify-between mt-2">
                              {task.assigneeId ? (
                                <Avatar className="h-5 w-5">
                                  <AvatarImage src={getUserById(task.assigneeId)?.avatar} />
                                  <AvatarFallback className="text-[9px]">
                                    {getUserById(task.assigneeId)?.name?.charAt(0) || 'U'}
                                  </AvatarFallback>
                                </Avatar>
                              ) : (
                                <span />
                              )}
                              <Badge variant="outline" className={`text-xs ${priorityColors[task.priority]}`}>
                                {task.priority}
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
              <h3 className="text-lg font-semibold">Team Members</h3>
              <Button onClick={() => setIsInviteDialogOpen(true)}>
                <UserPlus className="h-4 w-4 mr-2" />
                Add Member
              </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {projectData.members?.map((member) => {
                const user = getUserById(member.userId);
                return (
                  <Card key={member.id}>
                    <CardContent className="flex items-center gap-3 p-4">
                      <Avatar className="h-10 w-10 flex-shrink-0">
                        <AvatarImage src={user?.avatar} />
                        <AvatarFallback>
                          {user?.name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate">{user?.name || 'Unknown'}</p>
                        <p className="text-sm text-muted-foreground truncate">{user?.email}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Badge variant={member.role === 'OWNER' ? 'default' : 'secondary'}>
                          {member.role}
                        </Badge>
                        {member.role !== 'OWNER' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
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

        {/* Invite Dialog */}
        <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite to Project</DialogTitle>
              <DialogDescription>
                Add existing users or invite new people by email
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              <div className="space-y-3">
                <Label>Add Existing User</Label>
                <div className="flex gap-2">
                  <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select user..." />
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
                      <SelectItem value="ADMIN">Admin</SelectItem>
                      <SelectItem value="MEMBER">Member</SelectItem>
                      <SelectItem value="VIEWER">Viewer</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={handleAddMember} disabled={!selectedUserId || addMemberMutation.isPending}>
                    Add
                  </Button>
                </div>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Or</span>
                </div>
              </div>

              <div className="space-y-3">
                <Label>Invite by Email</Label>
                <p className="text-sm text-muted-foreground">
                  Send an invitation to someone who is not registered yet
                </p>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
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
                    Send Invite
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Projects</h1>
          <p className="text-muted-foreground">Manage your projects and track progress</p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Project
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search projects..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Projects Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary" />
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-12">
          <FolderKanban className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
          <p className="text-muted-foreground">No projects yet</p>
          <Button variant="link" onClick={() => setIsCreateDialogOpen(true)}>
            Create your first project
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Card
              key={project.id}
              className="cursor-pointer hover:shadow-md transition-shadow hover:border-primary/50"
              onClick={() => router.push(`/projects?id=${project.id}`)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-lg"
                      style={{ backgroundColor: project.color ? `${project.color}20` : 'hsl(var(--primary) / 0.1)' }}
                    >
                      <FolderKanban
                        className="h-5 w-5"
                        style={{ color: project.color || 'hsl(var(--primary))' }}
                      />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{project.name}</CardTitle>
                    </div>
                  </div>
                  <Badge variant="secondary" className={`${statusColors[project.status]} text-white`}>
                    {project.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="mb-4 line-clamp-2">
                  {project.description || 'No description'}
                </CardDescription>

                <div className="mb-4">
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium">{project.progress}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{
                        width: `${project.progress}%`,
                        backgroundColor: project.color || undefined
                      }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>{project._count?.tasks || 0} tasks</span>
                  {project.dueDate && (
                    <span>Due {formatDate(project.dueDate)}</span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Project Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Project Name</Label>
              <Input
                id="name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="My Project"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="Project description..."
                rows={3}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateProject}
              disabled={!newName.trim() || createProjectMutation.isPending}
            >
              {createProjectMutation.isPending ? 'Creating...' : 'Create Project'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
