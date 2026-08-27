/**
 * Daily Finance 3.0 - FinancialTimelineUseCase
 * Clean Architecture UseCase for retrieving the FinancialTimeline historical read model.
 * Dashboard, Analytics, Forecast Engine, Planning Center, & AI Coach consume ONLY this UseCase for timeline projections.
 * Adheres strictly to DF3-004 Timeline Architecture.
 */

import { GetFinancialSnapshotUseCase } from './FinancialSnapshotUseCase';
import { FinancialSnapshot } from '../domain/FinancialSnapshot';
import { FinancialTimeline, TimelineGranularity } from '../domain/FinancialTimeline';
import { TimelineBuilder } from '../domain/TimelineBuilder';
import { Language } from '../types';

export class GetFinancialTimelineUseCase {
  constructor(private readonly getSnapshotUseCase: GetFinancialSnapshotUseCase) {
    if (!getSnapshotUseCase) {
      throw new Error('[GetFinancialTimelineUseCase] Fail-Fast: GetFinancialSnapshotUseCase is required');
    }
  }

  /**
   * Retrieves or builds historical FinancialTimeline for a given space and granularity.
   */
  async execute(
    spaceId: string = 'sp_personal',
    granularity: TimelineGranularity = 'monthly',
    language: Language = 'vi'
  ): Promise<FinancialTimeline> {
    const currentSnapshot = await this.getSnapshotUseCase.execute(spaceId, language);
    
    // Assembles timeline using current snapshot + projected historical snapshot points
    return TimelineBuilder.build({
      spaceId,
      granularity,
      language,
      snapshots: [currentSnapshot]
    });
  }

  /**
   * Assembles FinancialTimeline from an array of pre-built FinancialSnapshots.
   */
  executeFromSnapshots(
    snapshots: FinancialSnapshot[],
    granularity: TimelineGranularity = 'monthly',
    language: Language = 'vi'
  ): FinancialTimeline {
    return TimelineBuilder.build({
      granularity,
      language,
      snapshots
    });
  }
}
