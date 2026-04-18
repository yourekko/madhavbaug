import { User } from './user.entity';
export declare class AuditLog {
    id: string;
    actorUserId: string | null;
    actorUser?: User | null;
    action: string;
    entityType: string;
    entityId: string | null;
    payloadJson: Record<string, unknown> | null;
    createdAt: Date;
}
