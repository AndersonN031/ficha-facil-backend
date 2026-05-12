import { Role, User } from '@prisma/client';

export class UserEntity {
  id: string;
  name: string;
  email: string;
  cpf: string;
  phone: string | null;
  role: Role;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Omit<User, 'password'>) {
    this.id = partial.id;
    this.name = partial.name;
    this.email = partial.email;
    this.cpf = partial.cpf;
    this.phone = partial.phone;
    this.role = partial.role;
    this.active = partial.active;
    this.createdAt = partial.createdAt;
    this.updatedAt = partial.updatedAt;
  }

  static sanitize(user: User): UserEntity {
    const { password, ...rest } = user;
    void password;
    return new UserEntity(rest);
  }
}
