import { v4 as uuidv4 } from 'uuid';

export enum TransactionType {
  INCOME = 'income',
  EXPENSE = 'expense',
}

export interface TransactionProps {
  id?: string;
  amount: number;
  description: string;
  date: Date;
  type: TransactionType;
  categoryId: string;
  tags?: string[];
  notes?: string;
  isRecurring?: boolean;
  installmentId?: string;
  subscriptionId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Transaction {
  private readonly _id: string;
  private _amount: number;
  private _description: string;
  private _date: Date;
  private _type: TransactionType;
  private _categoryId: string;
  private _tags: string[];
  private _notes?: string;
  private _isRecurring: boolean;
  private _installmentId?: string;
  private _subscriptionId?: string;
  private readonly _createdAt: Date;
  private _updatedAt: Date;

  constructor(props: TransactionProps) {
    this._id = props.id || uuidv4();
    this._amount = props.amount;
    this._description = props.description;
    this._date = props.date;
    this._type = props.type;
    this._categoryId = props.categoryId;
    this._tags = props.tags || [];
    this._notes = props.notes;
    this._isRecurring = props.isRecurring || false;
    this._installmentId = props.installmentId;
    this._subscriptionId = props.subscriptionId;
    this._createdAt = props.createdAt || new Date();
    this._updatedAt = props.updatedAt || new Date();
    
    this.validate();
  }

  private validate(): void {
    if (this._amount <= 0) {
      throw new Error('Transaction amount must be greater than 0');
    }
    
    if (!this._description || this._description.trim().length === 0) {
      throw new Error('Transaction description is required');
    }
    
    if (!this._categoryId) {
      throw new Error('Transaction category is required');
    }
  }

  get id(): string {
    return this._id;
  }

  get amount(): number {
    return this._amount;
  }

  get description(): string {
    return this._description;
  }

  get date(): Date {
    return this._date;
  }

  get type(): TransactionType {
    return this._type;
  }

  get categoryId(): string {
    return this._categoryId;
  }

  get tags(): string[] {
    return [...this._tags];
  }

  get notes(): string | undefined {
    return this._notes;
  }

  get isRecurring(): boolean {
    return this._isRecurring;
  }

  get installmentId(): string | undefined {
    return this._installmentId;
  }

  get subscriptionId(): string | undefined {
    return this._subscriptionId;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  updateAmount(amount: number): void {
    if (amount <= 0) {
      throw new Error('Transaction amount must be greater than 0');
    }
    this._amount = amount;
    this._updatedAt = new Date();
  }

  updateDescription(description: string): void {
    if (!description || description.trim().length === 0) {
      throw new Error('Transaction description is required');
    }
    this._description = description;
    this._updatedAt = new Date();
  }

  updateCategory(categoryId: string): void {
    if (!categoryId) {
      throw new Error('Transaction category is required');
    }
    this._categoryId = categoryId;
    this._updatedAt = new Date();
  }

  addTag(tag: string): void {
    if (!this._tags.includes(tag)) {
      this._tags.push(tag);
      this._updatedAt = new Date();
    }
  }

  removeTag(tag: string): void {
    const index = this._tags.indexOf(tag);
    if (index > -1) {
      this._tags.splice(index, 1);
      this._updatedAt = new Date();
    }
  }

  toJSON(): TransactionProps {
    return {
      id: this._id,
      amount: this._amount,
      description: this._description,
      date: this._date,
      type: this._type,
      categoryId: this._categoryId,
      tags: [...this._tags],
      notes: this._notes,
      isRecurring: this._isRecurring,
      installmentId: this._installmentId,
      subscriptionId: this._subscriptionId,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }
}