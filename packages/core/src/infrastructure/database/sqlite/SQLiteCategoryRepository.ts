import { Category, CategoryProps } from '../../../domain/entities/Category';
import { ICategoryRepository } from '../../../domain/repositories/ICategoryRepository';

// Mock implementation with default categories
export class SQLiteCategoryRepository implements ICategoryRepository {
  private categories: Category[] = [];

  constructor() {
    this.initializeDefaultCategories();
  }

  private initializeDefaultCategories(): void {
    const defaultCategories: CategoryProps[] = [
      // Expense Categories
      { id: 'food', name: 'Alimentação', icon: 'restaurant', color: '#FF6B6B', isSystem: true },
      { id: 'transport', name: 'Transporte', icon: 'directions-car', color: '#4ECDC4', isSystem: true },
      { id: 'health', name: 'Saúde', icon: 'local-hospital', color: '#45B7D1', isSystem: true },
      { id: 'entertainment', name: 'Entretenimento', icon: 'movie', color: '#F7DC6F', isSystem: true },
      { id: 'shopping', name: 'Compras', icon: 'shopping-cart', color: '#BB8FCE', isSystem: true },
      { id: 'bills', name: 'Contas', icon: 'receipt', color: '#F1948A', isSystem: true },
      { id: 'education', name: 'Educação', icon: 'school', color: '#82E0AA', isSystem: true },
      { id: 'other-expense', name: 'Outros', icon: 'more-horiz', color: '#AEB6BF', isSystem: true },
      
      // Income Categories
      { id: 'salary', name: 'Salário', icon: 'work', color: '#58D68D', isSystem: true },
      { id: 'freelance', name: 'Freelance', icon: 'computer', color: '#5DADE2', isSystem: true },
      { id: 'investment', name: 'Investimentos', icon: 'trending-up', color: '#F8C471', isSystem: true },
      { id: 'bonus', name: 'Bonificação', icon: 'card-giftcard', color: '#D7BDE2', isSystem: true },
      { id: 'other-income', name: 'Outras Receitas', icon: 'attach-money', color: '#A9DFBF', isSystem: true },
    ];

    this.categories = defaultCategories.map(props => new Category(props));
  }

  async save(category: Category): Promise<void> {
    this.categories.push(category);
  }

  async update(category: Category): Promise<void> {
    const index = this.categories.findIndex(c => c.id === category.id);
    if (index !== -1) {
      this.categories[index] = category;
    }
  }

  async delete(id: string): Promise<void> {
    const category = this.categories.find(c => c.id === id);
    if (category?.isSystem) {
      throw new Error('Cannot delete system category');
    }
    this.categories = this.categories.filter(c => c.id !== id);
  }

  async findById(id: string): Promise<Category | null> {
    return this.categories.find(c => c.id === id) || null;
  }

  async findAll(): Promise<Category[]> {
    return [...this.categories].sort((a, b) => a.name.localeCompare(b.name));
  }

  async findByParent(parentId: string): Promise<Category[]> {
    return this.categories.filter(c => c.parentId === parentId);
  }

  async findSystemCategories(): Promise<Category[]> {
    return this.categories.filter(c => c.isSystem);
  }
}