import { Category } from '../../../domain/entities/Category';
import { ICategoryRepository } from '../../../domain/repositories/ICategoryRepository';

export interface GetCategoriesResponse {
  categories: Category[];
}

export class GetCategoriesUseCase {
  constructor(
    private readonly categoryRepository: ICategoryRepository
  ) {}

  async execute(): Promise<GetCategoriesResponse> {
    const categories = await this.categoryRepository.findAll();

    return {
      categories,
    };
  }
}