import { v4 as uuidv4 } from 'uuid';

export enum BillingCycle {
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  SEMIANNUAL = 'semiannual',
  ANNUAL = 'annual',
}

export interface SubscriptionProps {
  id?: string;
  name: string;
  amount: number;
  billingCycle: BillingCycle;
  dueDay: number;
  categoryId: string;
  startDate: Date;
  endDate?: Date;
  isActive?: boolean;
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Subscription {
  private readonly _id: string;
  private _name: string;
  private _amount: number;
  private _billingCycle: BillingCycle;
  private _dueDay: number;
  private _categoryId: string;
  private _startDate: Date;
  private _endDate?: Date;
  private _isActive: boolean;
  private _notes?: string;
  private readonly _createdAt: Date;
  private _updatedAt: Date;

  constructor(props: SubscriptionProps) {
    this._id = props.id || uuidv4();
    this._name = props.name;
    this._amount = props.amount;
    this._billingCycle = props.billingCycle;
    this._dueDay = props.dueDay;
    this._categoryId = props.categoryId;
    this._startDate = props.startDate;
    this._endDate = props.endDate;
    this._isActive = props.isActive ?? true;
    this._notes = props.notes;
    this._createdAt = props.createdAt || new Date();
    this._updatedAt = props.updatedAt || new Date();
    
    this.validate();
  }

  private validate(): void {
    if (!this._name || this._name.trim().length === 0) {
      throw new Error('Subscription name is required');
    }
    
    if (this._amount <= 0) {
      throw new Error('Subscription amount must be greater than 0');
    }
    
    if (this._dueDay < 1 || this._dueDay > 31) {
      throw new Error('Due day must be between 1 and 31');
    }
    
    if (!this._categoryId) {
      throw new Error('Category is required');
    }
    
    if (this._endDate && this._endDate < this._startDate) {
      throw new Error('End date cannot be before start date');
    }
  }

  get id(): string {
    return this._id;
  }

  get name(): string {
    return this._name;
  }

  get amount(): number {
    return this._amount;
  }

  get billingCycle(): BillingCycle {
    return this._billingCycle;
  }

  get dueDay(): number {
    return this._dueDay;
  }

  get categoryId(): string {
    return this._categoryId;
  }

  get startDate(): Date {
    return this._startDate;
  }

  get endDate(): Date | undefined {
    return this._endDate;
  }

  get isActive(): boolean {
    return this._isActive;
  }

  get notes(): string | undefined {
    return this._notes;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  get annualAmount(): number {
    switch (this._billingCycle) {
      case BillingCycle.MONTHLY:
        return this._amount * 12;
      case BillingCycle.QUARTERLY:
        return this._amount * 4;
      case BillingCycle.SEMIANNUAL:
        return this._amount * 2;
      case BillingCycle.ANNUAL:
        return this._amount;
    }
  }

  get monthlyAmount(): number {
    switch (this._billingCycle) {
      case BillingCycle.MONTHLY:
        return this._amount;
      case BillingCycle.QUARTERLY:
        return this._amount / 3;
      case BillingCycle.SEMIANNUAL:
        return this._amount / 6;
      case BillingCycle.ANNUAL:
        return this._amount / 12;
    }
  }

  updateAmount(amount: number): void {
    if (amount <= 0) {
      throw new Error('Subscription amount must be greater than 0');
    }
    
    this._amount = amount;
    this._updatedAt = new Date();
  }

  updateBillingCycle(billingCycle: BillingCycle): void {
    this._billingCycle = billingCycle;
    this._updatedAt = new Date();
  }

  updateDueDay(dueDay: number): void {
    if (dueDay < 1 || dueDay > 31) {
      throw new Error('Due day must be between 1 and 31');
    }
    
    this._dueDay = dueDay;
    this._updatedAt = new Date();
  }

  cancel(endDate?: Date): void {
    this._isActive = false;
    this._endDate = endDate || new Date();
    this._updatedAt = new Date();
  }

  reactivate(): void {
    this._isActive = true;
    this._endDate = undefined;
    this._updatedAt = new Date();
  }

  toJSON(): SubscriptionProps {
    return {
      id: this._id,
      name: this._name,
      amount: this._amount,
      billingCycle: this._billingCycle,
      dueDay: this._dueDay,
      categoryId: this._categoryId,
      startDate: this._startDate,
      endDate: this._endDate,
      isActive: this._isActive,
      notes: this._notes,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }
}