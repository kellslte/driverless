import { IDomainEvent } from '../../../../common/interfaces/index.js';

export class UserDeletedEvent implements IDomainEvent {
    readonly eventName = 'user.deleted';
    readonly occurredAt: Date;

    constructor(readonly payload: { userId: string; email: string }) {
        this.occurredAt = new Date();
    }
}
