'use client';

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  FileIcon,
  Upload,
  Loader2,
  Trash2,
  Download,
  Image,
  FileText,
  FileSpreadsheet,
  File as FileIconGeneric,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { api, ApiError } from '@/lib/api';
import { formatRelativeTime } from '@/lib/utils';

interface FileItem {
  id: string;
  name: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  createdAt: string;
}

interface FileSectionProps {
  recordId?: string;
  taskId?: string;
  title?: string;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function getFileIcon(mimeType: string) {
  if (mimeType.startsWith('image/')) {
    return <Image className="h-5 w-5 text-emerald-400" />;
  }
  if (mimeType.includes('pdf')) {
    return <FileText className="h-5 w-5 text-red-400" />;
  }
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel') || mimeType.includes('csv')) {
    return <FileSpreadsheet className="h-5 w-5 text-green-400" />;
  }
  if (mimeType.includes('document') || mimeType.includes('word')) {
    return <FileText className="h-5 w-5 text-blue-400" />;
  }
  return <FileIconGeneric className="h-5 w-5 text-white/40" />;
}

export function FileSection({ recordId, taskId, title = 'Files' }: FileSectionProps) {
  const queryClient = useQueryClient();
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const queryKey = recordId ? ['files', 'record', recordId] : ['files', 'task', taskId];

  const { data: files = [], isLoading } = useQuery({
    queryKey,
    queryFn: () => {
      if (recordId) {
        return api.files.listByRecord(recordId);
      } else if (taskId) {
        return api.files.listByTask(taskId);
      }
      return Promise.resolve([]);
    },
    enabled: !!(recordId || taskId),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.files.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('File deleted');
    },
    onError: (err) => {
      if (err instanceof ApiError) {
        toast.error('Failed to delete file');
      }
    },
  });

  const handleUpload = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;

    setIsUploading(true);
    try {
      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        await api.files.upload(file, { recordId, taskId });
      }
      queryClient.invalidateQueries({ queryKey });
      toast.success(`${fileList.length} file(s) uploaded`);
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error('Failed to upload file');
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleUpload(e.dataTransfer.files);
  }, [recordId, taskId]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleUpload(e.target.files);
    e.target.value = ''; // Reset input
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete "${name}"?`)) {
      deleteMutation.mutate(id);
    }
  };

  const handleDownload = (file: FileItem) => {
    window.open(api.files.getDownloadUrl(file.id), '_blank');
  };

  return (
    <Card className="bg-white/[0.02] border-white/[0.05]">
      <CardHeader>
        <CardTitle className="text-lg text-white flex items-center gap-2">
          <FileIcon className="h-5 w-5 text-white/40" />
          {title}
          {files.length > 0 && (
            <span className="text-sm font-normal text-white/40">({files.length})</span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Upload Area */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            relative border-2 border-dashed rounded-lg p-6 text-center transition-colors
            ${isDragging
              ? 'border-violet-500 bg-violet-500/10'
              : 'border-white/10 hover:border-white/20 hover:bg-white/[0.02]'
            }
          `}
        >
          <input
            type="file"
            multiple
            onChange={handleFileSelect}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={isUploading}
          />
          {isUploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
              <p className="text-sm text-white/50">Uploading...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Upload className="h-8 w-8 text-white/30" />
              <p className="text-sm text-white/50">
                Drop files here or click to upload
              </p>
              <p className="text-xs text-white/30">
                Max file size: 10MB
              </p>
            </div>
          )}
        </div>

        {/* Files List */}
        {isLoading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-violet-500" />
          </div>
        ) : files.length === 0 ? (
          <p className="text-sm text-white/30 text-center py-2">No files attached</p>
        ) : (
          <div className="space-y-2">
            {files.map((file) => (
              <div
                key={file.id}
                className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.02] hover:bg-white/[0.04] group"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/5">
                  {getFileIcon(file.mimeType)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate" title={file.originalName}>
                    {file.originalName}
                  </p>
                  <p className="text-xs text-white/40">
                    {formatFileSize(file.size)} • {formatRelativeTime(file.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-white/40 hover:text-white"
                    onClick={() => handleDownload(file)}
                    title="Download"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-white/40 hover:text-red-400"
                    onClick={() => handleDelete(file.id, file.originalName)}
                    disabled={deleteMutation.isPending}
                    title="Delete"
                  >
                    {deleteMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
