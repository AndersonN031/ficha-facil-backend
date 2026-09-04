import { Injectable, ConflictException } from '@nestjs/common';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { AuthRepository } from '../repositories/auth.repository';
import { RegisterDto } from '../dto/register.dto';
import { UserEntity } from '../entities/user.entity';
import { randomUUID } from 'crypto';

interface JwtPayload {
  sub: string;
  email: string;
  role: string;
}

@Injectable()
export class RegisterUseCase {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async execute(dto: RegisterDto) {
    const emailInUse = await this.authRepository.findUserByEmail(dto.email);
    if (emailInUse) throw new ConflictException('E-mail já cadastrado');

    const cpfInUse = await this.authRepository.findUserByCpf(dto.cpf);
    if (cpfInUse) throw new ConflictException('CPF já cadastrado');

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.authRepository.createUser({
      ...dto,
      password: hashedPassword,
    });

    const tokens = await this.generateTokens(user.id, user.email, user.role);

    return { user: UserEntity.sanitize(user), ...tokens };
  }

  private async generateTokens(userId: string, email: string, role: string) {
    const payload: JwtPayload = { sub: userId, email, role };

    const accessExpiresIn = this.configService.getOrThrow(
      'JWT_EXPIRES_IN',
    ) as JwtSignOptions['expiresIn'];

    const refreshExpiresIn = this.configService.getOrThrow(
      'JWT_REFRESH_EXPIRES_IN',
    ) as JwtSignOptions['expiresIn'];

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_SECRET'),
      expiresIn: accessExpiresIn,
      jwtid: randomUUID(),
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_REFRESH_SECRET'),
      expiresIn: refreshExpiresIn,
      jwtid: randomUUID(),
    });

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.authRepository.saveRefreshToken({
      token: refreshToken,
      userId,
      expiresAt,
    });

    return { accessToken, refreshToken };
  }
}
