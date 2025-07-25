import { Subscription } from '../entities/Subscription';

export interface ISubscriptionRepository {
  save(subscription: Subscription): Promise<void>;
  update(subscription: Subscription): Promise<void>;
  delete(id: string): Promise<void>;
  findById(id: string): Promise<Subscription | null>;
  findAll(): Promise<Subscription[]>;
  findActive(): Promise<Subscription[]>;
  findByCategory(categoryId: string): Promise<Subscription[]>;
  findDueInMonth(year: number, month: number): Promise<Subscription[]>;
}