/**
 * Daily Finance 3.0 - FinancialIntelligenceUseCase
 * Clean Architecture UseCase for building/retrieving the FinancialIntelligence analysis.
 * ViewModels & Domain Engines consume ONLY this UseCase or FinancialSnapshot.
 * Adheres strictly to DF3-003 Analysis Architecture.
 */

import { GetFinancialSnapshotUseCase } from './FinancialSnapshotUseCase';
import { FinancialSnapshot } from '../domain/FinancialSnapshot';
import { FinancialIntelligence } from '../domain/FinancialIntelligence';
import { FinancialIntelligenceEngine } from '../domain/FinancialIntelligenceEngine';
import { Language } from '../types';

export class GetFinancialIntelligenceUseCase {
  constructor(private readonly getSnapshotUseCase: GetFinancialSnapshotUseCase) {
    if (!getSnapshotUseCase) {
      throw new Error('[GetFinancialIntelligenceUseCase] Fail-Fast: GetFinancialSnapshotUseCase is required');
    }
  }

  /**
   * Generates pure FinancialIntelligence from underlying snapshot or repositories.
   */
  async execute(spaceId: string = 'sp_personal', language: Language = 'vi'): Promise<FinancialIntelligence> {
    const snapshot = await this.getSnapshotUseCase.execute(spaceId, language);
    return FinancialIntelligenceEngine.analyze(snapshot, language);
  }

  /**
   * Generates pure FinancialIntelligence directly from an existing FinancialSnapshot.
   */
  executeFromSnapshot(snapshot: FinancialSnapshot, language: Language = 'vi'): FinancialIntelligence {
    return FinancialIntelligenceEngine.analyze(snapshot, language);
  }
}
