import { Role } from '../../common/enums/role.enum';

export type JwtPayload = {
  sub: string;
  role: Role;
  email: string | null;
  phone: string | null;
};
