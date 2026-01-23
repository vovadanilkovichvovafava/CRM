'use client';

import { useState } from 'react';
import {
  CalendarDays,
  Flag,
  ChevronRight,
  MoreHorizontal,
  Trash2,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { format, isPast, isToday, isTomorrow } from 'date-fns';
import type { Task } from '@/types';

interface SubtaskCardProps {
  subtask: Task;
  onClick: (subtask: Task) => void;
  onStatusChange: (subtaskId: string, done: boolean) => void;
  onDelete?: (subtaskId: string) => void;
}

const columns = [
  { id: 'TODO', name: 'To Do', color: 'bg-gray-500', textColor: 'text-gray-400' },
  { id: 'IN_PROGRESS', name: 'In Progress', color: 'bg-blue-500', textColor: 'text-blue-400' },
  { id: 'IN_REVIEW', name: 'In Review', color: 'bg-yellow-500', textColor: 'text-yellow-400' },
  { id: 'DONE', name: 'Done', color: 'bg-green-500', textColor: 'text-green-400' },
];

const priorities = [
  { id: 'URGENT', name: 'Urgent', color: 'text-red-500', bgColor: 'bg-red-500/20' },
  { id: 'HIGH', name: 'High', color: 'text-orange-500', bgColor: 'bg-orange-500/20' },
  { id: 'MEDIUM', name: 'Medium', color: 'text-yellow-500', bgColor: 'bg-yellow-500/20' },
  { id: 'LOW', name: 'Low', color: 'text-gray-400', bgColor: 'bg-gray-500/20' },
];

function formatDueDate(dateStr: string): { text: string; className: string } {
  const date = new Date(dateStr);

  if (isToday(date)) {
    return { text: 'Today', className: 'text-yellow-400' };
  }
  if (isTomorrow(date)) {
    return { text: 'Tomorrow', className: 'text-blue-400' };
  }
  if (isPast(date)) {
    return { text: 'Overdue', className: 'text-red-400' };
  }
  return { text: format(date, 'MMM d'), className: 'text-white/50' };
}

export function SubtaskCard({ subtask, onClick, onStatusChange, onDelete }: SubtaskCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const isDone = subtask.status === 'DONE';
  const currentStatus = columns.find(c => c.id === subtask.status);
  const currentPriority = priorities.find(p => p.id === subtask.priority);
  const dueInfo = subtask.dueDate ? formatDueDate(subtask.dueDate) : null;
  const subtaskCount = subtask._count?.subtasks || 0;
  const commentCount = subtask._count?.comments || 0;

  return (
    <div
      className={cn(
        'group relative flex items-start gap-3 p-3 rounded-lg transition-all cursor-pointer',
        'bg-white/5 hover:bg-white/10 border border-transparent hover:border-white/10',
        isDone && 'opacity-60'
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onClick(subtask)}
    >
      {/* Checkbox */}
      <div
        className="pt-0.5"
        onClick={(e) => {
          e.stopPropagation();
        }}
      >
        <Checkbox
          checked={isDone}
          onCheckedChange={(checked) => {
            onStatusChange(subtask.id, !!checked);
          }}
          className="h-4 w-4"
        />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 space-y-2">
        {/* Title row */}
        <div className="flex items-center gap-2">
          <span className={cn(
            'text-sm font-medium flex-1 truncate',
            isDone && 'line-through text-white/50'
          )}>
            {subtask.title}
          </span>

          {/* Open indicator */}
          <ChevronRight className={cn(
            'h-4 w-4 text-white/30 transition-all',
            isHovered && 'text-white/60 translate-x-0.5'
          )} />
        </div>

        {/* Meta row */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Status badge */}
          <Badge
            variant="outline"
            className={cn(
              'text-[10px] px-1.5 py-0 h-5 border-0',
              currentStatus?.textColor,
              `bg-${currentStatus?.color?.replace('bg-', '')}/20`
            )}
          >
            <span className={cn('w-1.5 h-1.5 rounded-full mr-1', currentStatus?.color)} />
            {currentStatus?.name}
          </Badge>

          {/* Priority */}
          {currentPriority && subtask.priority !== 'MEDIUM' && (
            <Badge
              variant="outline"
              className={cn(
                'text-[10px] px-1.5 py-0 h-5 border-0',
                currentPriority.color,
                currentPriority.bgColor
              )}
            >
              <Flag className="h-2.5 w-2.5 mr-1" />
              {currentPriority.name}
            </Badge>
          )}

          {/* Due date */}
          {dueInfo && (
            <span className={cn('text-[10px] flex items-center gap-1', dueInfo.className)}>
              <CalendarDays className="h-3 w-3" />
              {dueInfo.text}
            </span>
          )}

          {/* Assignee */}
          {subtask.assignee && (
            <Avatar className="h-5 w-5 border border-white/10">
              <AvatarImage src={subtask.assignee.avatar} />
              <AvatarFallback className="text-[8px] bg-indigo-500">
                {subtask.assignee.name?.charAt(0) || subtask.assignee.email?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
          )}

          {/* Subtasks count */}
          {subtaskCount > 0 && (
            <span className="text-[10px] text-white/40 flex items-center gap-1">
              <span className="w-3 h-3 flex items-center justify-center rounded bg-white/10 text-[8px]">
                {subtaskCount}
              </span>
              subtasks
            </span>
          )}

          {/* Comments count */}
          {commentCount > 0 && (
            <span className="text-[10px] text-white/40">
              {commentCount} comments
            </span>
          )}
        </div>
      </div>

      {/* Actions menu */}
      {isHovered && onDelete && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 absolute top-2 right-2 opacity-0 group-hover:opacity-100"
            >
              <MoreHorizontal className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onDelete(subtask.id);
              }}
              className="text-red-400"
            >
              <Trash2 className="h-3 w-3 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
