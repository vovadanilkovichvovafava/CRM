'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Send, Loader2, MessageSquare, Edit2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { api, ApiError } from '@/lib/api';
import { formatRelativeTime, getInitials } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth';

interface Comment {
  id: string;
  content: string;
  authorId: string;
  createdAt: string;
  updatedAt: string;
}

interface CommentSectionProps {
  recordId?: string;
  taskId?: string;
  title?: string;
}

export function CommentSection({ recordId, taskId, title = 'Comments' }: CommentSectionProps) {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [newComment, setNewComment] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  const queryKey = recordId
    ? ['comments', 'record', recordId]
    : ['comments', 'task', taskId];

  const { data: comments = [], isLoading } = useQuery({
    queryKey,
    queryFn: () => {
      if (recordId) {
        return api.comments.listByRecord(recordId) as Promise<Comment[]>;
      } else if (taskId) {
        return api.comments.listByTask(taskId) as Promise<Comment[]>;
      }
      return Promise.resolve([]);
    },
    enabled: !!(recordId || taskId),
  });

  const createMutation = useMutation({
    mutationFn: (content: string) =>
      api.comments.create({
        content,
        recordId,
        taskId,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      setNewComment('');
      toast.success('Comment added');
    },
    onError: (err) => {
      if (err instanceof ApiError) {
        toast.error('Failed to add comment');
      }
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, content }: { id: string; content: string }) =>
      api.comments.update(id, { content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      setEditingId(null);
      setEditContent('');
      toast.success('Comment updated');
    },
    onError: (err) => {
      if (err instanceof ApiError) {
        toast.error('Failed to update comment');
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.comments.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('Comment deleted');
    },
    onError: (err) => {
      if (err instanceof ApiError) {
        toast.error('Failed to delete comment');
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newComment.trim()) {
      createMutation.mutate(newComment.trim());
    }
  };

  const handleEdit = (comment: Comment) => {
    setEditingId(comment.id);
    setEditContent(comment.content);
  };

  const handleSaveEdit = () => {
    if (editingId && editContent.trim()) {
      updateMutation.mutate({ id: editingId, content: editContent.trim() });
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditContent('');
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this comment?')) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <Card className="bg-white/[0.02] border-white/[0.05]">
      <CardHeader>
        <CardTitle className="text-lg text-white flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-white/40" />
          {title}
          {comments.length > 0 && (
            <span className="text-sm font-normal text-white/40">({comments.length})</span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add Comment Form */}
        <form onSubmit={handleSubmit} className="flex gap-3">
          <Avatar className="h-8 w-8 flex-shrink-0 bg-violet-500/20">
            <AvatarFallback className="text-xs text-violet-300 bg-transparent">
              {getInitials(user?.name || user?.email || 'U')}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-2">
            <Textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a comment..."
              className="min-h-[60px] bg-white/[0.02] border-white/[0.05] text-white placeholder:text-white/30 resize-none"
            />
            <div className="flex justify-end">
              <Button
                type="submit"
                size="sm"
                disabled={!newComment.trim() || createMutation.isPending}
                className="bg-violet-600 hover:bg-violet-700"
              >
                {createMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-1" />
                    Send
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>

        {/* Comments List */}
        {isLoading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-violet-500" />
          </div>
        ) : comments.length === 0 ? (
          <p className="text-sm text-white/30 text-center py-4">No comments yet</p>
        ) : (
          <div className="space-y-4 mt-4">
            {comments.map((comment) => (
              <div key={comment.id} className="flex gap-3 group">
                <Avatar className="h-8 w-8 flex-shrink-0 bg-white/10">
                  <AvatarFallback className="text-xs text-white/60 bg-transparent">
                    {getInitials(comment.authorId.slice(0, 2))}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-white/70">
                          {comment.authorId === user?.id ? 'You' : 'User'}
                        </span>
                        <span className="text-xs text-white/30">
                          {formatRelativeTime(comment.createdAt)}
                        </span>
                        {comment.updatedAt !== comment.createdAt && (
                          <span className="text-xs text-white/20">(edited)</span>
                        )}
                      </div>

                      {editingId === comment.id ? (
                        <div className="mt-2 space-y-2">
                          <Textarea
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            className="min-h-[60px] bg-white/[0.02] border-white/[0.05] text-white resize-none"
                          />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={handleSaveEdit}
                              disabled={updateMutation.isPending}
                              className="bg-violet-600 hover:bg-violet-700"
                            >
                              {updateMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                'Save'
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={handleCancelEdit}
                              className="border-white/10"
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <p className="mt-1 text-sm text-white/80 whitespace-pre-wrap break-words">
                          {comment.content}
                        </p>
                      )}
                    </div>

                    {comment.authorId === user?.id && !editingId && (
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-white/40 hover:text-white"
                          onClick={() => handleEdit(comment)}
                          title="Edit"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-white/40 hover:text-red-400"
                          onClick={() => handleDelete(comment.id)}
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
