import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { PresenceService } from './presence.service';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userName?: string;
}

@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  },
  namespace: '/collaboration',
})
export class CollaborationGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(CollaborationGateway.name);

  @WebSocketServer()
  server: Server;

  constructor(private readonly presenceService: PresenceService) {}

  handleConnection(client: AuthenticatedSocket): void {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: AuthenticatedSocket): void {
    if (client.userId) {
      this.presenceService.removePresence(client.userId);
      this.server.emit('user:left', { oderId: client.userId });
    }
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('auth')
  handleAuth(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { userId: string; userName: string; avatar?: string },
  ): void {
    client.userId = data.userId;
    client.userName = data.userName;

    this.presenceService.updatePresence(data.userId, {
      oderId: data.userId,
      name: data.userName,
      avatar: data.avatar,
    });

    this.server.emit('user:joined', {
      userId: data.userId,
      userName: data.userName,
      avatar: data.avatar,
    });

    // Send current online users to the new client
    client.emit('presence:list', this.presenceService.getOnlineUsers());
  }

  @SubscribeMessage('presence:update')
  handlePresenceUpdate(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { page?: string; recordId?: string },
  ): void {
    if (!client.userId) return;

    this.presenceService.updatePresence(client.userId, {
      currentPage: data.page,
      currentRecordId: data.recordId,
    });

    this.server.emit('presence:updated', {
      userId: client.userId,
      ...data,
    });
  }

  @SubscribeMessage('record:join')
  handleRecordJoin(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { recordId: string },
  ): void {
    client.join(`record:${data.recordId}`);

    if (client.userId) {
      this.presenceService.updatePresence(client.userId, {
        currentRecordId: data.recordId,
      });

      this.server.to(`record:${data.recordId}`).emit('record:user_joined', {
        userId: client.userId,
        userName: client.userName,
        recordId: data.recordId,
      });
    }
  }

  @SubscribeMessage('record:leave')
  handleRecordLeave(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { recordId: string },
  ): void {
    client.leave(`record:${data.recordId}`);

    if (client.userId) {
      this.presenceService.updatePresence(client.userId, {
        currentRecordId: undefined,
      });

      this.server.to(`record:${data.recordId}`).emit('record:user_left', {
        userId: client.userId,
        recordId: data.recordId,
      });
    }
  }

  @SubscribeMessage('record:update')
  handleRecordUpdate(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { recordId: string; field: string; value: unknown },
  ): void {
    // Broadcast update to all users viewing this record (except sender)
    client.to(`record:${data.recordId}`).emit('record:updated', {
      recordId: data.recordId,
      field: data.field,
      value: data.value,
      updatedBy: client.userId,
    });
  }

  @SubscribeMessage('task:update')
  handleTaskUpdate(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { projectId: string; taskId: string; changes: unknown },
  ): void {
    this.server.to(`project:${data.projectId}`).emit('task:updated', {
      taskId: data.taskId,
      changes: data.changes,
      updatedBy: client.userId,
    });
  }

  @SubscribeMessage('project:join')
  handleProjectJoin(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { projectId: string },
  ): void {
    client.join(`project:${data.projectId}`);
  }

  @SubscribeMessage('project:leave')
  handleProjectLeave(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { projectId: string },
  ): void {
    client.leave(`project:${data.projectId}`);
  }

  // Helper method to broadcast to all clients
  broadcastToAll(event: string, data: unknown): void {
    this.server.emit(event, data);
  }

  // Helper method to broadcast to specific record viewers
  broadcastToRecord(recordId: string, event: string, data: unknown): void {
    this.server.to(`record:${recordId}`).emit(event, data);
  }

  // Helper method to broadcast to specific project members
  broadcastToProject(projectId: string, event: string, data: unknown): void {
    this.server.to(`project:${projectId}`).emit(event, data);
  }
}
