import { Category } from '../entities/Category';

export interface ICategoryRepository {
  save(category: Category): Promise<void>;
  update(category: Category): Promise<void>;
  delete(id: string): Promise<void>;
  findById(id: string): Promise<Category | null>;
  findAll(): Promise<Category[]>;
  findByParent(parentId: string): Promise<Category[]>;
  findSystemCategories(): Promise<Category[]>;
}