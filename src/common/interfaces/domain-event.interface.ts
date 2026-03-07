/**
 * Base interface for domain events.
 * Events are published when domain state changes, consumed by other modules.
 */
export interface IDomainEvent {
    readonly eventName: string;
    readonly occurredAt: Date;
    readonly payload: Record<string, unknown>;
}
