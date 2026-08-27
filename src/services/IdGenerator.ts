/**
 * Daily Finance 2.5 - IdGenerator Service
 * Centralized service for generating unique entity identifiers.
 * Replaces direct calls to Date.now() and Math.random().
 */

export class IdGenerator {
  /**
   * Generates a unique string ID with a given prefix.
   * Format: `${prefix}_${timestamp}_${randomString}`
   */
  static generateId(prefix: string): string {
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 7);
    return `${prefix}_${timestamp}_${randomStr}`;
  }

  /**
   * Generates a simple ID with prefix and timestamp.
   * Format: `${prefix}_${timestamp}`
   */
  static generateSimpleId(prefix: string): string {
    return `${prefix}_${Date.now()}`;
  }

  static generateTransactionId(): string {
    return this.generateId('tx');
  }

  static generateWalletId(): string {
    return this.generateSimpleId('w');
  }

  static generateBudgetId(): string {
    return this.generateSimpleId('b');
  }

  static generateSavingsGoalId(): string {
    return this.generateSimpleId('svg');
  }

  static generateInvestmentId(): string {
    return this.generateSimpleId('inv');
  }

  static generateDebtId(): string {
    return this.generateSimpleId('d');
  }

  static generateBackupId(): string {
    return this.generateSimpleId('bak');
  }
}
