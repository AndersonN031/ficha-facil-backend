import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
} from '@nestjs/websockets';

@WebSocketGateway({
  cors: {
    origin: '*', // em produção vai trocar pelo domínio do frontend
  },
})
class QueueGateway implements OnGatewayConnection, OnGatewayDisconnect {}
export { QueueGateway };
