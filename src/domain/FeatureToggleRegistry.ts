/**
 * Daily Finance 2.5 - Feature Toggle Registry (ADR-013)
 * Dynamic Feature Visibility System
 * Ensures no UI component directly accesses raw state flags without going through the registry.
 */

import { FeatureConfig } from '../types';

export type FeatureKey = keyof FeatureConfig;

export type FeatureChangeListener = (config: FeatureConfig) => void;

const DEFAULT_FEATURE_CONFIG: FeatureConfig = {
  incomeExpense: true,
  transfers: true,
  savingsGoals: true,
  investments: true,
  loansDebts: true,
  creditCards: true,
  installments: true,
  budgetsForecasting: true,
  sixJars: true,
  envelopeBudgeting: true,
  kakeiboJournal: true,
  snowballAvalanche: true,
  fireTracking: true,
  multiSpaces: true,
  aiInsights: true,
  voiceInput: true,
  ocrReceipt: true,
  googleDriveBackup: true
};

let globalFeatureConfig: FeatureConfig = { ...DEFAULT_FEATURE_CONFIG };
let globalListeners: Set<FeatureChangeListener> = new Set();

export class FeatureToggleRegistry {
  private static instance: FeatureToggleRegistry;

  public get config(): FeatureConfig {
    return { ...globalFeatureConfig };
  }

  public set config(newConfig: FeatureConfig) {
    globalFeatureConfig = { ...(newConfig || DEFAULT_FEATURE_CONFIG) };
  }

  public static getInstance(): FeatureToggleRegistry {
    if (!FeatureToggleRegistry.instance) {
      FeatureToggleRegistry.instance = new FeatureToggleRegistry();
    }
    return FeatureToggleRegistry.instance;
  }

  public isEnabled = (feature: FeatureKey): boolean => {
    return Boolean(globalFeatureConfig && globalFeatureConfig[feature]);
  };

  public enableFeature = (feature: FeatureKey): void => {
    if (!globalFeatureConfig[feature]) {
      globalFeatureConfig = { ...globalFeatureConfig, [feature]: true };
      this.notifyListeners();
    }
  };

  public disableFeature = (feature: FeatureKey): void => {
    if (globalFeatureConfig[feature]) {
      globalFeatureConfig = { ...globalFeatureConfig, [feature]: false };
      this.notifyListeners();
    }
  };

  public toggleFeature = (feature: FeatureKey): boolean => {
    const newValue = !globalFeatureConfig[feature];
    globalFeatureConfig = { ...globalFeatureConfig, [feature]: newValue };
    this.notifyListeners();
    return newValue;
  };

  public updateConfig = (newConfig: Partial<FeatureConfig>): void => {
    globalFeatureConfig = { ...globalFeatureConfig, ...(newConfig || {}) };
    this.notifyListeners();
  };

  public getConfig = (): FeatureConfig => {
    return { ...globalFeatureConfig };
  };

  public subscribe = (listener: FeatureChangeListener): (() => void) => {
    if (!globalListeners) {
      globalListeners = new Set();
    }
    globalListeners.add(listener);
    try {
      listener(this.getConfig());
    } catch (err) {
      console.error('Error in FeatureToggleRegistry subscribe listener:', err);
    }
    return () => {
      globalListeners?.delete(listener);
    };
  };

  private notifyListeners(): void {
    const currentConfig = this.getConfig();
    if (!globalListeners) return;
    globalListeners.forEach((listener) => {
      try {
        listener(currentConfig);
      } catch (err) {
        console.error('Error in FeatureToggleRegistry listener:', err);
      }
    });
  }
}
