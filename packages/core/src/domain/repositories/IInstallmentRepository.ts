import { Installment } from '../entities/Installment';

export interface IInstallmentRepository {
  save(installment: Installment): Promise<void>;
  update(installment: Installment): Promise<void>;
  delete(id: string): Promise<void>;
  findById(id: string): Promise<Installment | null>;
  findAll(): Promise<Installment[]>;
  findActive(): Promise<Installment[]>;
  findByCategory(categoryId: string): Promise<Installment[]>;
  findDueInMonth(year: number, month: number): Promise<Installment[]>;
}