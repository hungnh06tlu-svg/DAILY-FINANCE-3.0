/**
 * Daily Finance 3.0 — D2-003: FiftyTwoWeekChallengeEngine
 * Safe domain extension for 52-Week Money Savings Challenge.
 * Supports Standard (1..52), Reverse (52..1), Flat, and Flexible progression models.
 */

import {
  FiftyTwoWeekMode,
  FiftyTwoWeekItem,
  FiftyTwoWeekSchedule,
  FiftyTwoWeekProgress
} from './types';

export class FiftyTwoWeekChallengeEngine {
  /**
   * Generates a 52-week savings challenge schedule based on chosen mode and base increment.
   * Total for standard mode = (52 * 53 / 2) * baseIncrement = 1,378 * baseIncrement.
   */
  static generateSchedule(
    baseIncrement: number = 10_000,
    mode: FiftyTwoWeekMode = 'standard',
    startDate: string = new Date().toISOString().slice(0, 10)
  ): FiftyTwoWeekSchedule {
    const validBase = Math.max(1_000, baseIncrement);
    const items: FiftyTwoWeekItem[] = [];
    let cumulative = 0;

    for (let week = 1; week <= 52; week++) {
      let scheduledAmount = 0;
      if (mode === 'standard') {
        scheduledAmount = week * validBase;
      } else if (mode === 'reverse') {
        scheduledAmount = (53 - week) * validBase;
      } else if (mode === 'flat') {
        scheduledAmount = Math.round(26.5 * validBase); // Equal distribution: 26.5 * base per week -> total 1,378 * base
      } else {
        scheduledAmount = week * validBase;
      }

      cumulative += scheduledAmount;

      items.push({
        weekNumber: week,
        scheduledAmount,
        targetCumulativeAmount: cumulative,
        isCompleted: false
      });
    }

    const totalGoal = cumulative;

    return {
      id: `52w_${Date.now()}`,
      title: `Thử thách Tiết kiệm 52 Tuần (${mode})`,
      mode,
      baseIncrement: validBase,
      totalGoal,
      startDate,
      items
    };
  }

  /**
   * Records completed weeks and evaluates completion streak and progress.
   */
  static evaluateProgress(
    schedule: FiftyTwoWeekSchedule,
    completedWeekNumbers: number[]
  ): FiftyTwoWeekProgress {
    const completedSet = new Set(completedWeekNumbers);
    let totalSaved = 0;
    let completedWeeksCount = 0;

    for (const item of schedule.items) {
      if (completedSet.has(item.weekNumber)) {
        totalSaved += item.scheduledAmount;
        completedWeeksCount++;
      }
    }

    const remainingGoal = Math.max(0, schedule.totalGoal - totalSaved);
    const totalWeeksCount = schedule.items.length;
    const progressPercent = schedule.totalGoal > 0
      ? Math.min(100, Math.round((totalSaved / schedule.totalGoal) * 100))
      : 100;

    // Calculate current streak (consecutive weeks starting from week 1)
    let currentStreak = 0;
    for (let w = 1; w <= totalWeeksCount; w++) {
      if (completedSet.has(w)) {
        currentStreak++;
      } else {
        break;
      }
    }

    let status: 'on_track' | 'ahead' | 'behind' | 'completed' = 'on_track';
    if (completedWeeksCount === totalWeeksCount) {
      status = 'completed';
    } else if (progressPercent >= 50) {
      status = 'ahead';
    }

    return {
      totalGoal: schedule.totalGoal,
      totalSaved,
      remainingGoal,
      completedWeeksCount,
      totalWeeksCount,
      progressPercent,
      currentStreak,
      status
    };
  }
}
