// Simple dependency injection container
export interface ServiceContainer {
  register<T>(key: string, factory: () => T): void;
  get<T>(key: string): T;
}

export class DIContainer implements ServiceContainer {
  private services = new Map<string, () => any>();
  private instances = new Map<string, any>();

  register<T>(key: string, factory: () => T): void {
    this.services.set(key, factory);
  }

  get<T>(key: string): T {
    // Return singleton instance if exists
    if (this.instances.has(key)) {
      return this.instances.get(key);
    }

    // Create new instance
    const factory = this.services.get(key);
    if (!factory) {
      throw new Error(`Service not registered: ${key}`);
    }

    const instance = factory();
    this.instances.set(key, instance);
    return instance;
  }

  clear(): void {
    this.services.clear();
    this.instances.clear();
  }
}