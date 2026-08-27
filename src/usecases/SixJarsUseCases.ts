/**
 * Daily Finance 2.5 - SixJarsUseCases
 * Use Case implementations for Six Jars domain (TASK 6).
 * Follows Clean Architecture standards with Repository isolation.
 */

import { SixJarsRepository } from '../repositories/contracts';
import { SixJarsEngine } from '../domain/SixJarsEngine';
import { SixJarsValidator } from '../domain/SixJarsValidator';
import {
  Jar,
  JarAllocation,
  JarContribution,
  JarTransfer,
  JarRule,
  JarSummary,
  JarForecast,
  JarStatistics,
  Language
} from '../types';
import { IdGenerator } from '../services/IdGenerator';

export class CreateJarUseCase {
  constructor(private repository: SixJarsRepository) {}

  async execute(jarData: Omit<Jar, 'id'>): Promise<Jar> {
    const existing = await this.repository.getJars(jarData.spaceId);

    if (SixJarsValidator.validateDuplicateJar(existing, jarData.nameVi, jarData.key)) {
      throw new Error(`A jar with name '${jarData.nameVi}' or key '${jarData.key}' already exists.`);
    }

    const validation = SixJarsValidator.validateJarModel(jarData);
    if (!validation.isValid) {
      throw new Error(`Invalid jar data: ${validation.errors.join(', ')}`);
    }

    const jarToCreate: Omit<Jar, 'id'> = {
      ...jarData,
      status: jarData.status || 'active',
      isCustom: jarData.isCustom !== undefined ? jarData.isCustom : true,
      isEnabled: jarData.isEnabled !== false,
      isSoftDeleted: false,
      createdAt: jarData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    return this.repository.addJar(jarToCreate);
  }
}

export class UpdateJarUseCase {
  constructor(private repository: SixJarsRepository) {}

  async execute(jar: Jar): Promise<Jar> {
    const existingJars = await this.repository.getJars(jar.spaceId);
    const existing = existingJars.find((j) => j.id === jar.id);

    if (!existing) {
      throw new Error(`Jar with ID ${jar.id} not found.`);
    }

    const validation = SixJarsValidator.validateJarModel(jar);
    if (!validation.isValid) {
      throw new Error(`Invalid jar data: ${validation.errors.join(', ')}`);
    }

    const updated: Jar = {
      ...existing,
      ...jar,
      updatedAt: new Date().toISOString()
    };

    return this.repository.updateJar(updated);
  }
}

export class DeleteJarUseCase {
  constructor(private repository: SixJarsRepository) {}

  async execute(id: string, spaceId?: string): Promise<boolean> {
    const jars = await this.repository.getJars(spaceId);
    const target = jars.find((j) => j.id === id);

    if (!target) return false;

    // Soft delete per Clean Architecture mandate
    const softDeleted: Jar = {
      ...target,
      isSoftDeleted: true,
      status: 'soft_deleted',
      updatedAt: new Date().toISOString()
    };

    await this.repository.updateJar(softDeleted);
    return true;
  }
}

export class ArchiveJarUseCase {
  constructor(private repository: SixJarsRepository) {}

  async execute(id: string, spaceId?: string): Promise<Jar> {
    const jars = await this.repository.getJars(spaceId);
    const target = jars.find((j) => j.id === id);

    if (!target) {
      throw new Error(`Jar with ID ${id} not found.`);
    }

    const archived: Jar = {
      ...target,
      status: 'archived',
      isEnabled: false,
      updatedAt: new Date().toISOString()
    };

    return this.repository.updateJar(archived);
  }
}

export class AllocateIncomeUseCase {
  constructor(private repository: SixJarsRepository) {}

  async execute(
    incomeAmount: number,
    spaceId?: string,
    language: Language = 'vi'
  ): Promise<{ updatedJars: Jar[]; allocations: JarAllocation[]; contributions: JarContribution[] }> {
    if (incomeAmount <= 0) {
      throw new Error('Income amount must be greater than zero for allocation.');
    }

    let jars = await this.repository.getJars(spaceId);

    if (jars.length === 0) {
      // Seed default jars if empty
      const defaultJars = SixJarsEngine.getDefaultJarsTemplate(spaceId);
      for (const dj of defaultJars) {
        await this.repository.addJar(dj);
      }
      jars = await this.repository.getJars(spaceId);
    }

    const result = SixJarsEngine.orchestrateIncomeAllocation(jars, incomeAmount, language);

    for (const uj of result.updatedJars) {
      await this.repository.updateJar(uj);
    }

    return result;
  }
}

export class TransferBetweenJarsUseCase {
  constructor(private repository: SixJarsRepository) {}

  async execute(
    fromJarId: string,
    toJarId: string,
    amount: number,
    spaceId?: string,
    language: Language = 'vi'
  ): Promise<{ updatedFromJar: Jar; updatedToJar: Jar; transfer: JarTransfer }> {
    const jars = await this.repository.getJars(spaceId);
    const fromJar = jars.find((j) => j.id === fromJarId);
    const toJar = jars.find((j) => j.id === toJarId);

    if (!fromJar || !toJar) {
      throw new Error('Source or target jar not found.');
    }

    const validation = SixJarsValidator.validateTransfer(fromJar, toJar, amount);
    if (!validation.isValid) {
      throw new Error(validation.errors.join(', '));
    }

    const result = SixJarsEngine.orchestrateTransfer(fromJar, toJar, amount, language);

    await this.repository.updateJar(result.updatedFromJar);
    await this.repository.updateJar(result.updatedToJar);

    return result;
  }
}

export class RecordJarContributionUseCase {
  constructor(private repository: SixJarsRepository) {}

  async execute(
    jarId: string,
    amount: number,
    note?: string,
    spaceId?: string,
    language: Language = 'vi'
  ): Promise<{ updatedJar: Jar; contribution: JarContribution }> {
    const jars = await this.repository.getJars(spaceId);
    const jar = jars.find((j) => j.id === jarId);

    if (!jar) {
      throw new Error(`Jar with ID ${jarId} not found.`);
    }

    const validation = SixJarsValidator.validateContribution(jar, amount);
    if (!validation.isValid) {
      throw new Error(validation.errors.join(', '));
    }

    const result = SixJarsEngine.orchestrateContribution(jar, amount, note, language);

    await this.repository.updateJar(result.updatedJar);

    return result;
  }
}

export class UpdateAllocationRuleUseCase {
  constructor(private repository: SixJarsRepository) {}

  async execute(jarId: string, rule: JarRule, spaceId?: string): Promise<Jar> {
    const jars = await this.repository.getJars(spaceId);
    const jar = jars.find((j) => j.id === jarId);

    if (!jar) {
      throw new Error(`Jar with ID ${jarId} not found.`);
    }

    const percentVal = SixJarsValidator.validateAllocationPercentage(rule.percentage);
    if (!percentVal.isValid) {
      throw new Error(percentVal.errors.join(', '));
    }

    const updated: Jar = {
      ...jar,
      percent: rule.percentage,
      ruleType: rule.ruleType,
      fixedAllocationAmount: rule.fixedAmount || 0,
      updatedAt: new Date().toISOString()
    };

    return this.repository.updateJar(updated);
  }
}

export class GetJarSummaryUseCase {
  constructor(private repository: SixJarsRepository) {}

  async execute(
    contributions: JarContribution[] = [],
    transfers: JarTransfer[] = [],
    spaceId?: string,
    language: Language = 'vi'
  ): Promise<JarSummary> {
    const jars = await this.repository.getJars(spaceId);
    return SixJarsEngine.calculateSummary(jars, contributions, transfers, language);
  }
}

export class GetJarForecastUseCase {
  constructor(private repository: SixJarsRepository) {}

  async execute(
    monthlyIncomeEstimate: number = 30000000,
    spaceId?: string,
    language: Language = 'vi'
  ): Promise<JarForecast> {
    const jars = await this.repository.getJars(spaceId);
    return SixJarsEngine.orchestrateForecast(jars, monthlyIncomeEstimate, language);
  }
}

export class GetJarStatisticsUseCase {
  constructor(private repository: SixJarsRepository) {}

  async execute(spaceId?: string): Promise<JarStatistics> {
    const jars = await this.repository.getJars(spaceId);
    return SixJarsEngine.calculateStatistics(jars);
  }
}

export class GetJarsUseCase {
  constructor(private repository: SixJarsRepository) {}

  async execute(spaceId?: string): Promise<Jar[]> {
    let jars = await this.repository.getJars(spaceId);
    if (jars.length === 0) {
      const defaults = SixJarsEngine.getDefaultJarsTemplate(spaceId);
      for (const d of defaults) {
        await this.repository.addJar(d);
      }
      jars = await this.repository.getJars(spaceId);
    }
    return jars;
  }
}
