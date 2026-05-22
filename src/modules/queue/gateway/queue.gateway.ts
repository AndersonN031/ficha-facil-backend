import { Logger } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
class QueueGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(QueueGateway.name);

  handleConnection(client: Socket) {
    this.logger.log(`Cliente conectado: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Cliente desconectado: ${client.id}`);
  }

  @SubscribeMessage('join:unit')
  async handleJoinUnit(
    @MessageBody() data: { healthUnitId: string },
    @ConnectedSocket() client: Socket,
  ) {
    await client.join(`unit:${data.healthUnitId}`);
    this.logger.log(
      `Cliente ${client.id} entrou na room unit:${data.healthUnitId}`,
    );

    client.emit('joined', {
      message: `Conectado à fila do posto ${data.healthUnitId}`,
    });
  }

  @SubscribeMessage('leave:unit')
  async handleLeaveUnit(
    @MessageBody() data: { healthUnitId: string },
    @ConnectedSocket() client: Socket,
  ) {
    await client.leave(`unit:${data.healthUnitId}`);
    this.logger.log(
      `Cliente ${client.id} saiu da room unit:${data.healthUnitId}`,
    );
  }

  // chamado internamente pelos usecases para emitir atualização da fila
  // envia para todos os conectados na room do posto
  emitQueueUpdate(healthUnitId: string, data: QueueUpdatePayload) {
    this.server.to(`unit:${healthUnitId}`).emit('queue:update', data);
    this.logger.log(`queue:update emitido para unit:${healthUnitId}`);
  }

  // chamado quando um paciente específico é chamado pela recepcionista
  // envia para todos da room — o frontend filtra pelo userId
  emitTicketCalled(healthUnitId: string, data: TicketCalledPayload) {
    this.server.to(`unit:${healthUnitId}`).emit('ticket:called', data);
  }
}
export { QueueGateway };

export interface QueueUpdatePayload {
  healthUnitId: string;
  ticketCount: number;
  entries: {
    userId: string;
    position: number;
    status: string;
  }[];
}

export interface TicketCalledPayload {
  userId: string;
  position: number;
  message: string;
}
