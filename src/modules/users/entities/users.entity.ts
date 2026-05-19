import { Role } from '@prisma/client';

class UsersEntity {
  id!: string;
  name!: string;
  email!: string;
  cpf!: string;
  phone!: string | null;
  role!: Role;
  active!: boolean;
  createdAt!: Date;
  updatedAt!: Date;
}

export { UsersEntity };
