'use client';

import { useState } from 'react';
import { Plus, Search, FolderKanban, X, Calendar, Users, CheckCircle2, UserPlus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useProjects, useCreateProject, useProject, useAddProjectMember, useRemoveProjectMember } from '@/hooks/use-projects';
import { useTasks } from '@/hooks/use-tasks';
import { useUsers } from '@/hooks/use-users';
import { formatDate } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  progress: number;
  dueDate?: string;
  color?: string;
  _count?: { tasks: number };
  members?: ProjectMember[];
}

interface User {
  id: string;
  name?: string;
  email: string;
  avatar?: string;
}

const statusColors: Record<string, string> = {
  PLANNING: 'bg-gray-500',
  ACTIVE: 'bg-green-500',
  ON_HOLD: 'bg-yellow-500',
  COMPLETED: 'bg-blue-500',
  CANCELLED: 'bg-red-500',
};

export default function ProjectsPage() {
  const [search, setSearch] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<'ADMIN' | 'MEMBER' | 'VIEWER'>('MEMBER');

  const { data, isLoading } = useProjects({ search: search || undefined });
  const { data: selectedProject } = useProject(selectedProjectId || '');
  const { data: users } = useUsers();
  const createProjectMutation = useCreateProject();
  const addMemberMutation = useAddProjectMember();
  const removeMemberMutation = useRemoveProjectMember();

  // Get tasks for selected project
  const { data: tasksData } = useTasks({
    projectId: selectedProjectId || undefined,
    limit: 100
  });

  const projects = (data?.data as Project[]) || [];
  const projectTasks = tasksData?.data || [];
  const allUsers = (users as User[]) || [];

  // Get user by ID
  const getUserById = (userId: string): User | undefined => {
    return allUsers.find(u => u.id === userId);
  };

  // Get members not already in project
  const projectData = selectedProject as Project | undefined;
  const availableUsers = allUsers.filter(
    u => !projectData?.members?.some(m => m.userId === u.id)
  );

  const handleAddMember = () => {
    if (!selectedProjectId || !selectedUserId) return;

    addMemberMutation.mutate(
      { projectId: selectedProjectId, userId: selectedUserId, role: selectedRole },
      {
        onSuccess: () => {
          toast.success('Member added');
          setSelectedUserId('');
        },
        onError: (error) => {
          toast.error(error instanceof Error ? error.message : 'Failed to add member');
        },
      }
    );
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

  const handleCreateProject = () => {
    if (!newName.trim()) return;

    createProjectMutation.mutate(
      { name: newName, description: newDescription },
      {
        onSuccess: () => {
          toast.success('Project created');
          setIsCreateDialogOpen(false);
          setNewName('');
          setNewDescription('');
        },
        onError: (error) => {
          toast.error(error instanceof Error ? error.message : 'Failed to create project');
        },
      }
    );
  };

  const tasksByStatus = {
    TODO: projectTasks.filter((t: { status: string }) => t.status === 'TODO'),
    IN_PROGRESS: projectTasks.filter((t: { status: string }) => t.status === 'IN_PROGRESS'),
    IN_REVIEW: projectTasks.filter((t: { status: string }) => t.status === 'IN_REVIEW'),
    DONE: projectTasks.filter((t: { status: string }) => t.status === 'DONE'),
  };

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
              onClick={() => setSelectedProjectId(project.id)}
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

                {/* Progress */}
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

                {/* Meta */}
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

      {/* Project Detail Dialog */}
      <Dialog open={!!selectedProjectId} onOpenChange={(open) => !open && setSelectedProjectId(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          {selectedProject && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-lg"
                    style={{ backgroundColor: (selectedProject as Project).color ? `${(selectedProject as Project).color}20` : 'hsl(var(--primary) / 0.1)' }}
                  >
                    <FolderKanban
                      className="h-6 w-6"
                      style={{ color: (selectedProject as Project).color || 'hsl(var(--primary))' }}
                    />
                  </div>
                  <div>
                    <DialogTitle className="text-xl">{(selectedProject as Project).name}</DialogTitle>
                    <Badge variant="secondary" className={`${statusColors[(selectedProject as Project).status]} text-white mt-1`}>
                      {(selectedProject as Project).status}
                    </Badge>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-6 mt-4">
                {/* Description */}
                {(selectedProject as Project).description && (
                  <div>
                    <Label className="text-muted-foreground text-xs uppercase">Description</Label>
                    <p className="mt-1">{(selectedProject as Project).description}</p>
                  </div>
                )}

                {/* Progress */}
                <div>
                  <Label className="text-muted-foreground text-xs uppercase">Progress</Label>
                  <div className="mt-2">
                    <div className="mb-1 flex justify-between text-sm">
                      <span>{(selectedProject as Project).progress}% complete</span>
                    </div>
                    <div className="h-3 rounded-full bg-muted">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${(selectedProject as Project).progress}%`,
                          backgroundColor: (selectedProject as Project).color || 'hsl(var(--primary))'
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Task Stats */}
                <div>
                  <Label className="text-muted-foreground text-xs uppercase">Tasks Overview</Label>
                  <div className="grid grid-cols-4 gap-3 mt-2">
                    <div className="bg-muted/50 rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold">{tasksByStatus.TODO.length}</div>
                      <div className="text-xs text-muted-foreground">To Do</div>
                    </div>
                    <div className="bg-blue-500/10 rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold text-blue-500">{tasksByStatus.IN_PROGRESS.length}</div>
                      <div className="text-xs text-muted-foreground">In Progress</div>
                    </div>
                    <div className="bg-yellow-500/10 rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold text-yellow-500">{tasksByStatus.IN_REVIEW.length}</div>
                      <div className="text-xs text-muted-foreground">In Review</div>
                    </div>
                    <div className="bg-green-500/10 rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold text-green-500">{tasksByStatus.DONE.length}</div>
                      <div className="text-xs text-muted-foreground">Done</div>
                    </div>
                  </div>
                </div>

                {/* Project Members */}
                <div>
                  <Label className="text-muted-foreground text-xs uppercase mb-2 flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Team Members
                  </Label>

                  {/* Add Member Form */}
                  <div className="flex gap-2 mt-2 mb-4">
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
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ADMIN">Admin</SelectItem>
                        <SelectItem value="MEMBER">Member</SelectItem>
                        <SelectItem value="VIEWER">Viewer</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      size="icon"
                      onClick={handleAddMember}
                      disabled={!selectedUserId || addMemberMutation.isPending}
                    >
                      <UserPlus className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Members List */}
                  <div className="space-y-2">
                    {(selectedProject as Project).members?.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">No team members yet</p>
                    )}
                    {(selectedProject as Project).members?.map((member) => {
                      const user = getUserById(member.userId);
                      return (
                        <div
                          key={member.id}
                          className="flex items-center justify-between p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={user?.avatar} />
                              <AvatarFallback className="text-xs">
                                {user?.name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-medium">{user?.name || user?.email || 'Unknown'}</p>
                              <p className="text-xs text-muted-foreground">{user?.email}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={member.role === 'OWNER' ? 'default' : 'secondary'}>
                              {member.role}
                            </Badge>
                            {member.role !== 'OWNER' && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                onClick={() => handleRemoveMember(member.userId)}
                                disabled={removeMemberMutation.isPending}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Due Date */}
                {(selectedProject as Project).dueDate && (
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>Due {formatDate((selectedProject as Project).dueDate as string)}</span>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-4 border-t">
                  <Button
                    className="flex-1"
                    onClick={() => {
                      const projectId = selectedProjectId;
                      setSelectedProjectId(null);
                      window.location.href = `/tasks?project=${projectId}`;
                    }}
                  >
                    View Tasks
                  </Button>
                  <Button variant="outline" onClick={() => setSelectedProjectId(null)}>
                    Close
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

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
