import { IDomainEvent } from '../../../../common/interfaces/index.js';

export class UserCreatedEvent implements IDomainEvent {
    readonly eventName = 'user.created';
    readonly occurredAt: Date;

    constructor(readonly payload: { userId: string; email: string; role: string }) {
        this.occurredAt = new Date();
    }
}
