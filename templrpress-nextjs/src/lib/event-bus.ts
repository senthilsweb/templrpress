/**
 * Lightweight pub/sub EventBus for React components.
 */

type Listener<T = unknown> = (data: T) => void;

class EventBus {
  private listeners = new Map<string, Set<Listener>>();

  on<T = unknown>(event: string, fn: Listener<T>) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(fn as Listener);
    return () => this.off(event, fn);
  }

  off<T = unknown>(event: string, fn: Listener<T>) {
    this.listeners.get(event)?.delete(fn as Listener);
  }

  emit<T = unknown>(event: string, data: T) {
    this.listeners.get(event)?.forEach((fn) => fn(data));
  }
}

export const eventBus = new EventBus();

export const EVENTS = {
  PG_TABLE_SELECTED: "pg:table:selected",
  MYSQL_TABLE_SELECTED: "mysql:table:selected",
  MONGO_COLLECTION_SELECTED: "mongo:collection:selected",
  CHAT_CONTEXT_UPDATE: "chat:context:update",
  CHAT_TOGGLE: "chat:toggle",
  NAVBAR_VISIBILITY: "navbar:visibility",
} as const;

export interface PgTableSelectedEvent {
  schema: string;
  table: string;
}

export interface MySQLTableSelectedEvent {
  database: string;
  table: string;
}

export interface MongoCollectionSelectedEvent {
  database: string;
  collection: string;
}

export interface NavbarVisibilityEvent {
  visible: boolean;
}

export interface ChatContextUpdateEvent {
  type: string;
  source: string;
  query: string;
  row_count: number;
  columns: string[];
  data: Record<string, unknown>[];
  summary?: Record<string, unknown>;
  page?: string;
}
