import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

export type HapticFeedbackType = 
  | 'light'       // Light tap - for button presses, selections
  | 'medium'      // Medium tap - for form submissions, confirmations  
  | 'heavy'       // Heavy tap - for important actions, errors
  | 'success'     // Success feedback - for completed actions
  | 'warning'     // Warning feedback - for caution actions
  | 'error'       // Error feedback - for failed actions
  | 'selection'   // Selection feedback - for picker/slider changes
  | 'impact';     // Impact feedback - for destructive actions

export class HapticService {
  private static isEnabled = true;
  
  /**
   * Enable or disable haptic feedback globally
   */
  static setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }
  
  /**
   * Check if haptic feedback is enabled
   */
  static getEnabled(): boolean {
    return this.isEnabled;
  }
  
  /**
   * Trigger haptic feedback based on type
   */
  static async trigger(type: HapticFeedbackType): Promise<void> {
    if (!this.isEnabled || Platform.OS === 'web') {
      return;
    }
    
    try {
      switch (type) {
        case 'light':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          break;
          
        case 'medium':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          break;
          
        case 'heavy':
        case 'impact':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          break;
          
        case 'success':
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          break;
          
        case 'warning':
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          break;
          
        case 'error':
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          break;
          
        case 'selection':
          await Haptics.selectionAsync();
          break;
          
        default:
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch (error) {
      console.log('Haptic feedback error:', error);
    }
  }
  
  // Convenience methods for common interactions
  
  /**
   * Light feedback for button taps, list item selections
   */
  static buttonPress(): Promise<void> {
    return this.trigger('light');
  }
  
  /**
   * Medium feedback for form submissions, navigation
   */
  static formSubmit(): Promise<void> {
    return this.trigger('medium');
  }
  
  /**
   * Success feedback for completed actions
   */
  static success(): Promise<void> {
    return this.trigger('success');
  }
  
  /**
   * Error feedback for failed actions
   */
  static error(): Promise<void> {
    return this.trigger('error');
  }
  
  /**
   * Warning feedback for caution actions
   */
  static warning(): Promise<void> {
    return this.trigger('warning');
  }
  
  /**
   * Heavy feedback for destructive actions
   */
  static destructive(): Promise<void> {
    return this.trigger('heavy');
  }
  
  /**
   * Selection feedback for picker/slider changes
   */
  static selection(): Promise<void> {
    return this.trigger('selection');
  }
  
  /**
   * Feedback for long press actions
   */
  static longPress(): Promise<void> {
    return this.trigger('medium');
  }
  
  /**
   * Feedback for swipe actions
   */
  static swipe(): Promise<void> {
    return this.trigger('light');
  }
  
  /**
   * Feedback for pull-to-refresh actions
   */
  static refresh(): Promise<void> {
    return this.trigger('light');
  }
  
  /**
   * Feedback for toggle switches
   */
  static toggle(): Promise<void> {
    return this.trigger('selection');
  }
  
  /**
   * Feedback for tab navigation
   */
  static tabChange(): Promise<void> {
    return this.trigger('selection');
  }
}