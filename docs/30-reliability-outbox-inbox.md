# Reliability: Outbox / Inbox

Tables exist: OutboxSpec / InboxSpec.

## Outbox
Transactional event publishing with idempotency keys.

## Inbox
Consumer dedupe + retry + DLQ.

## Generator outputs
- outbox tables + workers
- retry policy + DLQ routes
