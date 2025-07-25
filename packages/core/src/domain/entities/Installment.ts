import { v4 as uuidv4 } from 'uuid';

export interface InstallmentProps {
  id?: string;
  description: string;
  totalAmount: number;
  installmentAmount: number;
  totalInstallments: number;
  currentInstallment: number;
  dueDay: number;
  startDate: Date;
  categoryId: string;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Installment {
  private readonly _id: string;
  private _description: string;
  private _totalAmount: number;
  private _installmentAmount: number;
  private _totalInstallments: number;
  private _currentInstallment: number;
  private _dueDay: number;
  private _startDate: Date;
  private _categoryId: string;
  private _isActive: boolean;
  private readonly _createdAt: Date;
  private _updatedAt: Date;

  constructor(props: InstallmentProps) {
    this._id = props.id || uuidv4();
    this._description = props.description;
    this._totalAmount = props.totalAmount;
    this._installmentAmount = props.installmentAmount;
    this._totalInstallments = props.totalInstallments;
    this._currentInstallment = props.currentInstallment;
    this._dueDay = props.dueDay;
    this._startDate = props.startDate;
    this._categoryId = props.categoryId;
    this._isActive = props.isActive ?? true;
    this._createdAt = props.createdAt || new Date();
    this._updatedAt = props.updatedAt || new Date();
    
    this.validate();
  }

  private validate(): void {
    if (!this._description || this._description.trim().length === 0) {
      throw new Error('Installment description is required');
    }
    
    if (this._totalAmount <= 0) {
      throw new Error('Total amount must be greater than 0');
    }
    
    if (this._installmentAmount <= 0) {
      throw new Error('Installment amount must be greater than 0');
    }
    
    if (this._totalInstallments <= 0) {
      throw new Error('Total installments must be greater than 0');
    }
    
    if (this._currentInstallment < 0 || this._currentInstallment > this._totalInstallments) {
      throw new Error('Current installment must be between 0 and total installments');
    }
    
    if (this._dueDay < 1 || this._dueDay > 31) {
      throw new Error('Due day must be between 1 and 31');
    }
    
    if (!this._categoryId) {
      throw new Error('Category is required');
    }
  }

  get id(): string {
    return this._id;
  }

  get description(): string {
    return this._description;
  }

  get totalAmount(): number {
    return this._totalAmount;
  }

  get installmentAmount(): number {
    return this._installmentAmount;
  }

  get totalInstallments(): number {
    return this._totalInstallments;
  }

  get currentInstallment(): number {
    return this._currentInstallment;
  }

  get dueDay(): number {
    return this._dueDay;
  }

  get startDate(): Date {
    return this._startDate;
  }

  get categoryId(): string {
    return this._categoryId;
  }

  get isActive(): boolean {
    return this._isActive;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  get remainingInstallments(): number {
    return this._totalInstallments - this._currentInstallment;
  }

  get remainingAmount(): number {
    return this._installmentAmount * this.remainingInstallments;
  }

  get progress(): number {
    return (this._currentInstallment / this._totalInstallments) * 100;
  }

  payInstallment(): void {
    if (!this._isActive) {
      throw new Error('Cannot pay installment for inactive installment plan');
    }
    
    if (this._currentInstallment >= this._totalInstallments) {
      throw new Error('All installments have been paid');
    }
    
    this._currentInstallment++;
    this._updatedAt = new Date();
    
    if (this._currentInstallment === this._totalInstallments) {
      this._isActive = false;
    }
  }

  activate(): void {
    if (this._currentInstallment >= this._totalInstallments) {
      throw new Error('Cannot activate completed installment plan');
    }
    
    this._isActive = true;
    this._updatedAt = new Date();
  }

  deactivate(): void {
    this._isActive = false;
    this._updatedAt = new Date();
  }

  toJSON(): InstallmentProps {
    return {
      id: this._id,
      description: this._description,
      totalAmount: this._totalAmount,
      installmentAmount: this._installmentAmount,
      totalInstallments: this._totalInstallments,
      currentInstallment: this._currentInstallment,
      dueDay: this._dueDay,
      startDate: this._startDate,
      categoryId: this._categoryId,
      isActive: this._isActive,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }
}