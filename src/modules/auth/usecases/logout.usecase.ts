import { Injectable } from '@nestjs/common';
import { AuthRepository } from '../repositories/auth.repository';

@Injectable()
export class LogoutUseCase {
  constructor(private readonly authRepository: AuthRepository) {}

  async execute(userId: string) {
    await this.authRepository.revokeAllUserRefreshTokens(userId);
    return { message: 'Logout realizado com sucesso' };
  }
}
