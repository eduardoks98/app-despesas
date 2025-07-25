/**
 * Conflict Resolution Service
 * 
 * Handles intelligent merging of conflicts during synchronization
 */

import { Transaction, Category } from '../../types';
import { logger } from '../../../packages/shared/src/utils/logger';

export interface ConflictData<T> {
  local: T;
  remote: T;
  lastSyncedVersion?: T;
}

export interface ConflictResolution<T> {
  resolution: 'local' | 'remote' | 'merge' | 'manual';
  data: T;
  confidence: number; // 0-1, how confident we are about the resolution
  reason: string;
}

export interface ConflictRule<T> {
  name: string;
  priority: number;
  condition: (conflict: ConflictData<T>) => boolean;
  resolve: (conflict: ConflictData<T>) => ConflictResolution<T>;
}

export class ConflictResolutionService {
  private static instance: ConflictResolutionService;
  private transactionRules: ConflictRule<Transaction>[] = [];
  private categoryRules: ConflictRule<Category>[] = [];

  private constructor() {
    this.initializeTransactionRules();
    this.initializeCategoryRules();
  }

  public static getInstance(): ConflictResolutionService {
    if (!ConflictResolutionService.instance) {
      ConflictResolutionService.instance = new ConflictResolutionService();
    }
    return ConflictResolutionService.instance;
  }

  /**
   * Initialize transaction conflict resolution rules
   */
  private initializeTransactionRules(): void {
    // Rule 1: Most recent update wins for amount changes
    this.transactionRules.push({
      name: 'most_recent_amount',
      priority: 90,
      condition: (conflict) => {
        return conflict.local.amount !== conflict.remote.amount;
      },
      resolve: (conflict) => {
        const localUpdated = new Date(conflict.local.updatedAt || conflict.local.createdAt);
        const remoteUpdated = new Date(conflict.remote.updatedAt || conflict.remote.createdAt);
        
        if (localUpdated > remoteUpdated) {
          return {
            resolution: 'local',
            data: conflict.local,
            confidence: 0.8,
            reason: 'Local version has more recent amount update'
          };
        } else {
          return {
            resolution: 'remote',
            data: conflict.remote,
            confidence: 0.8,
            reason: 'Remote version has more recent amount update'
          };
        }
      }
    });

    // Rule 2: Merge non-conflicting fields
    this.transactionRules.push({
      name: 'merge_non_conflicting',
      priority: 70,
      condition: () => true, // Always applicable
      resolve: (conflict) => {
        const merged = { ...conflict.local };
        
        // Merge description if local is empty or generic
        if (!merged.description || merged.description.trim() === '' || 
            merged.description === 'Transação' || merged.description === 'Transaction') {
          if (conflict.remote.description && conflict.remote.description.trim() !== '') {
            merged.description = conflict.remote.description;
          }
        }
        
        // Merge notes (concatenate if both exist)
        if (conflict.remote.notes && conflict.local.notes !== conflict.remote.notes) {
          if (merged.notes && merged.notes !== conflict.remote.notes) {
            merged.notes = `${merged.notes}\n\n[Remote]: ${conflict.remote.notes}`;
          } else {
            merged.notes = conflict.remote.notes;
          }
        }
        
        // Use most recent timestamp for updated fields
        const localUpdated = new Date(conflict.local.updatedAt || conflict.local.createdAt);
        const remoteUpdated = new Date(conflict.remote.updatedAt || conflict.remote.createdAt);
        
        if (remoteUpdated > localUpdated) {
          merged.updatedAt = conflict.remote.updatedAt;
        }
        
        return {
          resolution: 'merge',
          data: merged,
          confidence: 0.9,
          reason: 'Merged non-conflicting fields intelligently'
        };
      }
    });

    // Rule 3: Prefer non-deleted items
    this.transactionRules.push({
      name: 'prefer_non_deleted',
      priority: 95,
      condition: (conflict) => {
        return (conflict.local.deletedAt != null) !== (conflict.remote.deletedAt != null);
      },
      resolve: (conflict) => {
        if (conflict.local.deletedAt && !conflict.remote.deletedAt) {
          return {
            resolution: 'remote',
            data: conflict.remote,
            confidence: 0.95,
            reason: 'Remote version is not deleted'
          };
        } else {
          return {
            resolution: 'local',
            data: conflict.local,
            confidence: 0.95,
            reason: 'Local version is not deleted'
          };
        }
      }
    });

    // Rule 4: Validate data integrity
    this.transactionRules.push({
      name: 'data_integrity',
      priority: 100,
      condition: (conflict) => {
        return this.isValidTransaction(conflict.local) !== this.isValidTransaction(conflict.remote);
      },
      resolve: (conflict) => {
        const localValid = this.isValidTransaction(conflict.local);
        const remoteValid = this.isValidTransaction(conflict.remote);
        
        if (localValid && !remoteValid) {
          return {
            resolution: 'local',
            data: conflict.local,
            confidence: 1.0,
            reason: 'Local version has valid data, remote is corrupted'
          };
        } else {
          return {
            resolution: 'remote',
            data: conflict.remote,
            confidence: 1.0,
            reason: 'Remote version has valid data, local is corrupted'
          };
        }
      }
    });
  }

  /**
   * Initialize category conflict resolution rules
   */
  private initializeCategoryRules(): void {
    // Rule 1: System categories always come from server
    this.categoryRules.push({
      name: 'system_categories_server_wins',
      priority: 100,
      condition: (conflict) => {
        return conflict.remote.isSystem === true;
      },
      resolve: (conflict) => {
        return {
          resolution: 'remote',
          data: conflict.remote,
          confidence: 1.0,
          reason: 'System categories always use server version'
        };
      }
    });

    // Rule 2: Custom categories prefer local changes
    this.categoryRules.push({
      name: 'custom_categories_local_wins',
      priority: 80,
      condition: (conflict) => {
        return conflict.local.isCustom === true && conflict.remote.isCustom === true;
      },
      resolve: (conflict) => {
        return {
          resolution: 'local',
          data: conflict.local,
          confidence: 0.9,
          reason: 'Custom categories prefer local modifications'
        };
      }
    });

    // Rule 3: Merge category properties intelligently
    this.categoryRules.push({
      name: 'merge_category_properties',
      priority: 70,
      condition: () => true,
      resolve: (conflict) => {
        const merged = { ...conflict.local };
        
        // Keep the more descriptive name
        if (conflict.remote.name && conflict.remote.name.length > merged.name.length) {
          merged.name = conflict.remote.name;
        }
        
        // Prefer non-default colors
        if (conflict.remote.color && conflict.remote.color !== '#CCCCCC' && 
            (merged.color === '#CCCCCC' || !merged.color)) {
          merged.color = conflict.remote.color;
        }
        
        // Prefer non-default icons
        if (conflict.remote.icon && conflict.remote.icon !== 'folder' && 
            (merged.icon === 'folder' || !merged.icon)) {
          merged.icon = conflict.remote.icon;
        }
        
        return {
          resolution: 'merge',
          data: merged,
          confidence: 0.85,
          reason: 'Merged category properties intelligently'
        };
      }
    });
  }

  /**
   * Resolve transaction conflict
   */
  public resolveTransactionConflict(conflict: ConflictData<Transaction>): ConflictResolution<Transaction> {
    // Sort rules by priority (highest first)
    const sortedRules = [...this.transactionRules].sort((a, b) => b.priority - a.priority);
    
    // Find the first applicable rule
    for (const rule of sortedRules) {
      if (rule.condition(conflict)) {
        const resolution = rule.resolve(conflict);
        
        logger.info('Transaction conflict resolved', {
          rule: rule.name,
          resolution: resolution.resolution,
          confidence: resolution.confidence,
          reason: resolution.reason,
          transactionId: conflict.local.id
        });
        
        return resolution;
      }
    }
    
    // Fallback: use remote version
    return {
      resolution: 'remote',
      data: conflict.remote,
      confidence: 0.5,
      reason: 'No specific rule matched, defaulting to remote version'
    };
  }

  /**
   * Resolve category conflict
   */
  public resolveCategoryConflict(conflict: ConflictData<Category>): ConflictResolution<Category> {
    // Sort rules by priority (highest first)
    const sortedRules = [...this.categoryRules].sort((a, b) => b.priority - a.priority);
    
    // Find the first applicable rule
    for (const rule of sortedRules) {
      if (rule.condition(conflict)) {
        const resolution = rule.resolve(conflict);
        
        logger.info('Category conflict resolved', {
          rule: rule.name,
          resolution: resolution.resolution,
          confidence: resolution.confidence,
          reason: resolution.reason,
          categoryId: conflict.local.id
        });
        
        return resolution;
      }
    }
    
    // Fallback: use remote version
    return {
      resolution: 'remote',
      data: conflict.remote,
      confidence: 0.5,
      reason: 'No specific rule matched, defaulting to remote version'
    };
  }

  /**
   * Batch resolve conflicts
   */
  public resolveTransactionConflicts(conflicts: ConflictData<Transaction>[]): ConflictResolution<Transaction>[] {
    return conflicts.map(conflict => this.resolveTransactionConflict(conflict));
  }

  /**
   * Batch resolve category conflicts
   */
  public resolveCategoryConflicts(conflicts: ConflictData<Category>[]): ConflictResolution<Category>[] {
    return conflicts.map(conflict => this.resolveCategoryConflict(conflict));
  }

  /**
   * Check if transaction data is valid
   */
  private isValidTransaction(transaction: Transaction): boolean {
    try {
      // Basic validation
      if (!transaction.id || !transaction.amount || !transaction.description || !transaction.date) {
        return false;
      }
      
      // Amount validation
      if (typeof transaction.amount !== 'number' || transaction.amount <= 0) {
        return false;
      }
      
      // Date validation
      const date = new Date(transaction.date);
      if (isNaN(date.getTime())) {
        return false;
      }
      
      // Type validation
      if (!['income', 'expense'].includes(transaction.type)) {
        return false;
      }
      
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Add custom transaction rule
   */
  public addTransactionRule(rule: ConflictRule<Transaction>): void {
    this.transactionRules.push(rule);
    this.transactionRules.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Add custom category rule
   */
  public addCategoryRule(rule: ConflictRule<Category>): void {
    this.categoryRules.push(rule);
    this.categoryRules.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Get conflict statistics
   */
  public getConflictStats(): { transactionRules: number; categoryRules: number } {
    return {
      transactionRules: this.transactionRules.length,
      categoryRules: this.categoryRules.length
    };
  }

  /**
   * Reset rules to default
   */
  public resetToDefaults(): void {
    this.transactionRules = [];
    this.categoryRules = [];
    this.initializeTransactionRules();
    this.initializeCategoryRules();
  }
}