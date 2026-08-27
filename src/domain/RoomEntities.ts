/**
 * Daily Finance 2.5 - Room Entity Schema & Relationship Contract (DF-008 Part 2)
 * Canonical Room database entities following exact naming & column conventions.
 */

import { TransactionType, TransactionStatus } from '../types';

export interface BaseRoomEntity {
  id: string;
  spaceId: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  version: number;
  isDeleted: boolean;
  createdBy?: string;
  updatedBy?: string;
  deletedBy?: string;
  syncState: 'synced' | 'pending' | 'conflict';
  deviceId: string;
}

export interface FinancialSpaceEntity extends BaseRoomEntity {
  name: string;
  type: 'personal' | 'family' | 'company' | 'class' | 'other';
  balance: number;
  currency: string;
  cardColor: string;
  iconName: string;
  ownerName: string;
  membersCount: number;
  isPrimary: boolean;
}

export interface WalletEntity extends BaseRoomEntity {
  name: string;
  type: 'cash' | 'bank' | 'e_wallet' | 'credit_card' | 'investment';
  currency: string;
  initialBalance: number;
  currentBalance: number;
  status: 'active' | 'archived';
  cardColor?: string;
  iconName?: string;
  isDefault?: boolean;
}

export interface AccountEntity extends BaseRoomEntity {
  walletId: string;
  name: string;
  type: string;
  currency: string;
  openingBalance: number;
  currentBalance: number;
  accountNumber?: string;
  bankName?: string;
}

export interface TransactionEntity extends BaseRoomEntity {
  walletId?: string;
  accountId?: string;
  targetSpaceId?: string;
  targetWalletId?: string;
  categoryId: string;
  transactionType: TransactionType;
  amount: number;
  currency: string;
  exchangeRate: number;
  note?: string;
  description?: string;
  transactionDate: string;
  attachmentCount: number;
  referenceId?: string;
  status: TransactionStatus;
  merchant?: string;
  method?: 'cash' | 'credit_card' | 'bank' | 'e_wallet';
  receiptUrl?: string;
  tags?: string[];
}

export interface CategoryEntity extends BaseRoomEntity {
  name: string;
  type: 'income' | 'expense' | 'transfer' | 'saving' | 'investment' | 'loan' | 'debt' | 'adjustment' | 'opening_balance' | 'compensation';
  parentId?: string;
  icon: string;
  color: string;
  displayOrder: number;
  isActive: boolean;
}

export interface BudgetEntity extends BaseRoomEntity {
  categoryId: string;
  period: 'monthly' | 'yearly';
  allocatedAmount: number;
  spentAmount: number;
  remainingAmount: number;
  currency: string;
  warningThreshold: number;
  status: 'active' | 'exceeded' | 'warning';
}

export interface SavingGoalEntity extends BaseRoomEntity {
  title: string;
  targetAmount: number;
  currentProgress: number;
  deadline: string;
  category: 'emergency' | 'house' | 'car' | 'travel' | 'investment';
  icon: string;
  priority: number;
  targetWalletId?: string;
  status: 'active' | 'completed' | 'paused';
}

export interface InvestmentEntity extends BaseRoomEntity {
  name: string;
  type: 'stock' | 'crypto' | 'gold' | 'real_estate' | 'fund' | 'other';
  quantity: number;
  purchasePrice: number;
  currentPrice: number;
  profit: number;
  roi: number;
  currency: string;
  symbol?: string;
  status: 'active' | 'sold';
}

export interface LoanEntity extends BaseRoomEntity {
  title: string;
  borrowerName: string;
  principal: number;
  interestRate: number;
  outstandingBalance: number;
  dueDate: string;
  isLentOut: boolean;
  status: 'active' | 'settled' | 'defaulted';
}

export interface ReminderEntity extends BaseRoomEntity {
  title: string;
  amount?: number;
  currency?: string;
  triggerTime: string;
  repeatRule?: string;
  notificationState: 'pending' | 'triggered' | 'snoozed';
  linkedEntityId?: string;
  isRecurring: boolean;
}

export interface AttachmentEntity extends BaseRoomEntity {
  transactionId: string;
  name: string;
  fileUrl: string;
  mimeType: string;
  sizeBytes: number;
}

export interface PreferenceEntity extends BaseRoomEntity {
  userId: string;
  language: 'vi' | 'en';
  theme: string;
  baseCurrency: string;
  defaultSpaceId: string;
  biometricEnabled: boolean;
  notificationEnabled: boolean;
}

export interface FeatureToggleEntity extends BaseRoomEntity {
  featureKey: string;
  isEnabled: boolean;
  moduleGroup: string;
}

export interface AuditLogEntity extends BaseRoomEntity {
  entityType: string;
  entityId: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'RESTORE';
  changeReason?: string;
  source: string;
}

export interface SyncMetadataEntity extends BaseRoomEntity {
  entityName: string;
  lastSyncedAt: string;
  serverVersion: number;
  hasLocalChanges: boolean;
}
