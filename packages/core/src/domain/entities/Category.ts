import { v4 as uuidv4 } from 'uuid';

export interface CategoryProps {
  id?: string;
  name: string;
  icon: string;
  color: string;
  parentId?: string;
  isSystem?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Category {
  private readonly _id: string;
  private _name: string;
  private _icon: string;
  private _color: string;
  private _parentId?: string;
  private readonly _isSystem: boolean;
  private readonly _createdAt: Date;
  private _updatedAt: Date;

  constructor(props: CategoryProps) {
    this._id = props.id || uuidv4();
    this._name = props.name;
    this._icon = props.icon;
    this._color = props.color;
    this._parentId = props.parentId;
    this._isSystem = props.isSystem || false;
    this._createdAt = props.createdAt || new Date();
    this._updatedAt = props.updatedAt || new Date();
    
    this.validate();
  }

  private validate(): void {
    if (!this._name || this._name.trim().length === 0) {
      throw new Error('Category name is required');
    }
    
    if (!this._icon || this._icon.trim().length === 0) {
      throw new Error('Category icon is required');
    }
    
    if (!this._color || !this._color.match(/^#[0-9A-F]{6}$/i)) {
      throw new Error('Category color must be a valid hex color');
    }
  }

  get id(): string {
    return this._id;
  }

  get name(): string {
    return this._name;
  }

  get icon(): string {
    return this._icon;
  }

  get color(): string {
    return this._color;
  }

  get parentId(): string | undefined {
    return this._parentId;
  }

  get isSystem(): boolean {
    return this._isSystem;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  updateName(name: string): void {
    if (this._isSystem) {
      throw new Error('Cannot update system category');
    }
    
    if (!name || name.trim().length === 0) {
      throw new Error('Category name is required');
    }
    
    this._name = name;
    this._updatedAt = new Date();
  }

  updateIcon(icon: string): void {
    if (this._isSystem) {
      throw new Error('Cannot update system category');
    }
    
    if (!icon || icon.trim().length === 0) {
      throw new Error('Category icon is required');
    }
    
    this._icon = icon;
    this._updatedAt = new Date();
  }

  updateColor(color: string): void {
    if (this._isSystem) {
      throw new Error('Cannot update system category');
    }
    
    if (!color || !color.match(/^#[0-9A-F]{6}$/i)) {
      throw new Error('Category color must be a valid hex color');
    }
    
    this._color = color;
    this._updatedAt = new Date();
  }

  toJSON(): CategoryProps {
    return {
      id: this._id,
      name: this._name,
      icon: this._icon,
      color: this._color,
      parentId: this._parentId,
      isSystem: this._isSystem,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }
}