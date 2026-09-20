/**
 * Daily Finance 3.0 - AI Proxy Hardening & Safety Test Suite (AI-001D)
 * Comprehensive verification of:
 * 1. AI input contract & sanitization
 * 2. Financial Truth grounding
 * 3. Space isolation & adversarial cross-space checks
 * 4. Fund isolation & adversarial cross-fund checks
 * 5. Lifecycle filtering (draft, pending, soft_deleted, archived, deletedAt)
 * 6. Mutation confirmation & Two-Phase Commit enforcement
 * 7. Server/API validation & fail-fast safety
 * 8. Malformed AI output resilience
 * 9. Empty financial dataset clean slate handling
 * 10. Multi-space partitioning
 * 11. Multi-fund partitioning
 * 12. Regression of existing AI functionality
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { AIPayloadValidator, RawAITransaction, RawAIBudget } from '../domain/AIPayloadValidator';
import { VoiceCommandParser } from '../domain/VoiceCommandParser';
import { AICoachEngine, FinancialSnapshotInput } from '../domain/AICoachEngine';
import { FinancialIntelligenceEngine } from '../domain/FinancialIntelligenceEngine';
import { CompositionRoot } from '../di/CompositionRoot';

describe('AI-001D: AI Proxy Hardening, Isolation & Financial Grounding', () => {
  let root: CompositionRoot;

  beforeEach(() => {
    root = CompositionRoot.getInstance();
  });

  // =================================================================
  // 1. AI INPUT CONTRACT & SANITIZATION
  // =================================================================
  describe('1. AI Input Contract', () => {
    it('sanitizes untrusted raw transactions and discards malformed non-object inputs', () => {
      const rawInputs = [
        null,
        undefined,
        'malicious string',
        12345,
        {
          id: 'tx_valid_1',
          type: 'income',
          amount: 25000000,
          currency: 'vnd',
          category: 'Salary',
          spaceId: 'sp_personal',
          status: 'confirmed',
          date: '2026-08-01T10:00:00Z',
          note: 'Monthly Salary'
        },
        {
          id: 'tx_invalid_amount',
          type: 'expense',
          amount: -500000, // Negative amount must be excluded
          spaceId: 'sp_personal',
          status: 'confirmed'
        },
        {
          id: 'tx_nan_amount',
          type: 'expense',
          amount: 'not_a_number',
          spaceId: 'sp_personal',
          status: 'confirmed'
        }
      ];

      const { sanitized, excluded } = AIPayloadValidator.sanitizeTransactions(
        rawInputs,
        'sp_personal'
      );

      expect(sanitized.length).toBe(1);
      expect(sanitized[0].id).toBe('tx_valid_1');
      expect(sanitized[0].amount).toBe(25000000);
      expect(sanitized[0].currency).toBe('VND');
      expect(excluded.invalidAmountCount).toBe(6); // 4 malformed non-objects + 2 invalid numbers
      expect(excluded.totalExcluded).toBe(6);
    });

    it('preserves high numerical precision without rounding distortion during sanitization', () => {
      const rawInputs: RawAITransaction[] = [
        {
          id: 'tx_precise',
          type: 'income',
          amount: 1234567.891,
          currency: 'USD',
          spaceId: 'sp_personal',
          status: 'confirmed'
        }
      ];

      const { sanitized } = AIPayloadValidator.sanitizeTransactions(rawInputs, 'sp_personal');
      expect(sanitized.length).toBe(1);
      expect(sanitized[0].amount).toBe(1234567.891);
    });
  });

  // =================================================================
  // 2. FINANCIAL TRUTH GROUNDING
  // =================================================================
  describe('2. Financial Truth Grounding', () => {
    it('computes authoritative financial grounding metrics without allowing AI calculation variance', () => {
      const rawTxs: RawAITransaction[] = [
        { id: 'tx_inc_1', type: 'income', amount: 50000000, spaceId: 'sp_personal', status: 'confirmed' },
        { id: 'tx_exp_1', type: 'expense', amount: 15000000, spaceId: 'sp_personal', status: 'confirmed' },
        { id: 'tx_exp_2', type: 'expense', amount: 5000000, spaceId: 'sp_personal', status: 'confirmed' }
      ];
      const rawBudgets: RawAIBudget[] = [
        { id: 'b_1', category: 'Living', amount: 20000000, spaceId: 'sp_personal' },
        { id: 'b_2', category: 'Shopping', amount: 5000000, spaceId: 'sp_personal' }
      ];

      const result = AIPayloadValidator.prepareInsightsPayload({
        transactions: rawTxs,
        budgets: rawBudgets,
        spaceId: 'sp_personal'
      });

      expect(result.grounding.totalIncome).toBe(50000000);
      expect(result.grounding.totalExpense).toBe(20000000);
      expect(result.grounding.netCashFlow).toBe(30000000);
      expect(result.grounding.activeTransactionCount).toBe(3);
      expect(result.grounding.activeBudgetCount).toBe(2);
      expect(result.grounding.totalBudgetLimit).toBe(25000000);

      // Prompt snippet must contain immutable grounding directives
      expect(result.groundedPromptSnippet).toContain('AUTHORITATIVE FINANCIAL TRUTH');
      expect(result.groundedPromptSnippet).toContain('50000000');
      expect(result.groundedPromptSnippet).toContain('20000000');
      expect(result.groundedPromptSnippet).toContain('30000000');
    });

    it('generates non-mutating deterministic fallback grounded in verified numbers', () => {
      const grounding = {
        spaceId: 'sp_personal',
        totalIncome: 40000000,
        totalExpense: 15000000,
        netCashFlow: 25000000,
        activeTransactionCount: 2,
        activeBudgetCount: 1,
        totalBudgetLimit: 20000000,
        currency: 'VND',
        excludedAudit: {
          mismatchedSpaceCount: 0,
          mismatchedFundCount: 0,
          inactiveLifecycleCount: 0,
          invalidAmountCount: 0,
          totalExcluded: 0
        }
      };

      const fallbackVi = AIPayloadValidator.generateSafeFallback(grounding, 'vi');
      expect(fallbackVi.summary).toContain('sp_personal');
      expect(fallbackVi.insights.some(i => i.description.includes('40000000'))).toBe(true);
      expect(fallbackVi.insights.some(i => i.description.includes('25000000'))).toBe(true);

      const fallbackEn = AIPayloadValidator.generateSafeFallback(grounding, 'en');
      expect(fallbackEn.summary).toContain('sp_personal');
      expect(fallbackEn.insights.some(i => i.description.includes('40000000'))).toBe(true);
    });
  });

  // =================================================================
  // 3. SPACE ISOLATION (INCLUDING ADVERSARIAL CASES)
  // =================================================================
  describe('3. Space Isolation', () => {
    it('ADVERSARIAL: Space A = 10,000, Space B = 100,000. AI in Space A receives strictly 10,000', () => {
      const rawTxs: RawAITransaction[] = [
        { id: 'tx_spA', type: 'income', amount: 10000, spaceId: 'sp_spaceA', status: 'confirmed' },
        { id: 'tx_spB', type: 'income', amount: 100000, spaceId: 'sp_spaceB', status: 'confirmed' }
      ];

      // Query AI for Space A
      const resultA = AIPayloadValidator.prepareInsightsPayload({
        transactions: rawTxs,
        spaceId: 'sp_spaceA'
      });

      expect(resultA.grounding.spaceId).toBe('sp_spaceA');
      expect(resultA.grounding.totalIncome).toBe(10000);
      expect(resultA.grounding.activeTransactionCount).toBe(1);
      expect(resultA.sanitizedTransactions.length).toBe(1);
      expect(resultA.sanitizedTransactions[0].id).toBe('tx_spA');
      expect(resultA.grounding.excludedAudit.mismatchedSpaceCount).toBe(1);

      // Query AI for Space B
      const resultB = AIPayloadValidator.prepareInsightsPayload({
        transactions: rawTxs,
        spaceId: 'sp_spaceB'
      });

      expect(resultB.grounding.spaceId).toBe('sp_spaceB');
      expect(resultB.grounding.totalIncome).toBe(100000);
      expect(resultB.grounding.activeTransactionCount).toBe(1);
      expect(resultB.sanitizedTransactions.length).toBe(1);
      expect(resultB.sanitizedTransactions[0].id).toBe('tx_spB');
      expect(resultB.grounding.excludedAudit.mismatchedSpaceCount).toBe(1);
    });

    it('rejects transactions without spaceId from entering AI context', () => {
      const rawTxs: RawAITransaction[] = [
        { id: 'tx_no_space', type: 'expense', amount: 500000, status: 'confirmed' }
      ];

      const { sanitized, excluded } = AIPayloadValidator.sanitizeTransactions(
        rawTxs,
        'sp_personal'
      );

      expect(sanitized.length).toBe(0);
      expect(excluded.mismatchedSpaceCount).toBe(1);
    });

    it('isolates budgets by spaceId', () => {
      const rawBudgets: RawAIBudget[] = [
        { id: 'b_spA', category: 'Food', amount: 3000000, spaceId: 'sp_spaceA' },
        { id: 'b_spB', category: 'Luxury', amount: 50000000, spaceId: 'sp_spaceB' }
      ];

      const sanitizedBudgetsA = AIPayloadValidator.sanitizeBudgets(rawBudgets, 'sp_spaceA');
      expect(sanitizedBudgetsA.length).toBe(1);
      expect(sanitizedBudgetsA[0].id).toBe('b_spA');
      expect(sanitizedBudgetsA[0].amount).toBe(3000000);
    });
  });

  // =================================================================
  // 4. FUND ISOLATION (INCLUDING ADVERSARIAL CASES)
  // =================================================================
  describe('4. Fund Isolation', () => {
    it('ADVERSARIAL: Fund A = 5,000, Fund B = 50,000 within same Space. Query Fund A returns only Fund A', () => {
      const rawTxs: RawAITransaction[] = [
        { id: 'tx_fundA', type: 'income', amount: 5000, spaceId: 'sp_shared', fundId: 'fund_alpha', status: 'confirmed' },
        { id: 'tx_fundB', type: 'income', amount: 50000, spaceId: 'sp_shared', fundId: 'fund_beta', status: 'confirmed' }
      ];

      const result = AIPayloadValidator.prepareInsightsPayload({
        transactions: rawTxs,
        spaceId: 'sp_shared',
        fundId: 'fund_alpha'
      });

      expect(result.grounding.fundId).toBe('fund_alpha');
      expect(result.grounding.totalIncome).toBe(5000);
      expect(result.grounding.activeTransactionCount).toBe(1);
      expect(result.sanitizedTransactions[0].id).toBe('tx_fundA');
      expect(result.grounding.excludedAudit.mismatchedFundCount).toBe(1);
    });

    it('isolates budgets by fundId when target fundId is specified', () => {
      const rawBudgets: RawAIBudget[] = [
        { id: 'b_fundA', category: 'Operations', amount: 10000000, spaceId: 'sp_company', fundId: 'fund_ops' },
        { id: 'b_fundB', category: 'R&D', amount: 40000000, spaceId: 'sp_company', fundId: 'fund_rnd' }
      ];

      const sanitizedBudgets = AIPayloadValidator.sanitizeBudgets(rawBudgets, 'sp_company', 'fund_ops');
      expect(sanitizedBudgets.length).toBe(1);
      expect(sanitizedBudgets[0].id).toBe('b_fundA');
      expect(sanitizedBudgets[0].amount).toBe(10000000);
    });
  });

  // =================================================================
  // 5. TRANSACTION LIFECYCLE FILTERING
  // =================================================================
  describe('5. Transaction Lifecycle Filtering', () => {
    it('excludes draft, pending, soft_deleted, archived, and deleted transactions from active AI context', () => {
      const rawTxs: RawAITransaction[] = [
        { id: 'tx_active', type: 'expense', amount: 200000, spaceId: 'sp_personal', status: 'confirmed' },
        { id: 'tx_draft', type: 'expense', amount: 500000, spaceId: 'sp_personal', status: 'draft' },
        { id: 'tx_pending', type: 'expense', amount: 700000, spaceId: 'sp_personal', status: 'pending' },
        { id: 'tx_soft_deleted', type: 'expense', amount: 900000, spaceId: 'sp_personal', status: 'soft_deleted' },
        { id: 'tx_archived', type: 'expense', amount: 1100000, spaceId: 'sp_personal', status: 'archived' },
        { id: 'tx_flag_deleted', type: 'expense', amount: 1300000, spaceId: 'sp_personal', isDeleted: true, status: 'confirmed' },
        { id: 'tx_flag_soft_del', type: 'expense', amount: 1500000, spaceId: 'sp_personal', isSoftDeleted: true, status: 'confirmed' },
        { id: 'tx_deleted_at', type: 'expense', amount: 1700000, spaceId: 'sp_personal', deletedAt: '2026-08-01T12:00:00Z', status: 'confirmed' }
      ];

      const { sanitized, excluded } = AIPayloadValidator.sanitizeTransactions(rawTxs, 'sp_personal');

      expect(sanitized.length).toBe(1);
      expect(sanitized[0].id).toBe('tx_active');
      expect(sanitized[0].amount).toBe(200000);
      expect(excluded.inactiveLifecycleCount).toBe(7);
      expect(excluded.totalExcluded).toBe(7);
    });

    it('verifies AIPayloadValidator.isTransactionActive helper accuracy across all states', () => {
      expect(AIPayloadValidator.isTransactionActive({ status: 'confirmed' })).toBe(true);
      expect(AIPayloadValidator.isTransactionActive({ status: 'posted' })).toBe(true);
      expect(AIPayloadValidator.isTransactionActive({ status: 'draft' })).toBe(false);
      expect(AIPayloadValidator.isTransactionActive({ status: 'pending' })).toBe(false);
      expect(AIPayloadValidator.isTransactionActive({ status: 'soft_deleted' })).toBe(false);
      expect(AIPayloadValidator.isTransactionActive({ status: 'archived' })).toBe(false);
      expect(AIPayloadValidator.isTransactionActive({ isDeleted: true })).toBe(false);
      expect(AIPayloadValidator.isTransactionActive({ isSoftDeleted: true })).toBe(false);
      expect(AIPayloadValidator.isTransactionActive({ deletedAt: '2026-05-01' })).toBe(false);
    });
  });

  // =================================================================
  // 6. MUTATION SAFETY & TWO-PHASE COMMIT ENFORCEMENT
  // =================================================================
  describe('6. Mutation Safety & Two-Phase Commit', () => {
    it('ensures VoiceCommandParser produces unconfirmed proposals requiring explicit confirmation', () => {
      const parsed = VoiceCommandParser.parse('Chi 250k tiền ăn trưa', 'vi');
      expect(parsed).toBeDefined();
      expect(parsed.intent).toBe('add_expense');
      const readOnlyRes = VoiceCommandParser.executeReadOnly(parsed, {} as any, 'vi');
      expect(readOnlyRes.requiresConfirmation).toBe(true);
    });

    it('ensures Transfer commands by voice assistant require two-phase confirmation', () => {
      const parsedTransfer = VoiceCommandParser.parse('Chuyển 2 triệu từ ví w_main sang ví w_savings', 'vi');
      expect(parsedTransfer.intent).toBe('transfer_money');
      const readOnlyRes = VoiceCommandParser.executeReadOnly(parsedTransfer, {} as any, 'vi');
      expect(readOnlyRes.requiresConfirmation).toBe(true);
    });
  });

  // =================================================================
  // 7. SERVER/API VALIDATION & FAIL-FAST SAFETY
  // =================================================================
  describe('7. Server / API Validation & Fail-Fast', () => {
    it('sanitizes malicious or malformed spaceId strings to safe defaults', () => {
      expect(AIPayloadValidator.validateSpaceId(undefined)).toBe('sp_personal');
      expect(AIPayloadValidator.validateSpaceId(null)).toBe('sp_personal');
      expect(AIPayloadValidator.validateSpaceId('')).toBe('sp_personal');
      expect(AIPayloadValidator.validateSpaceId('   ')).toBe('sp_personal');
      expect(AIPayloadValidator.validateSpaceId('../../../etc/passwd')).toBe('sp_personal');
      expect(AIPayloadValidator.validateSpaceId('<script>alert(1)</script>')).toBe('sp_personal');
      expect(AIPayloadValidator.validateSpaceId('sp_family_valid')).toBe('sp_family_valid');
    });

    it('validates and sanitizes fundId parameters safely', () => {
      expect(AIPayloadValidator.validateFundId(undefined)).toBeUndefined();
      expect(AIPayloadValidator.validateFundId('')).toBeUndefined();
      expect(AIPayloadValidator.validateFundId('   ')).toBeUndefined();
      expect(AIPayloadValidator.validateFundId('fund_emergency')).toBe('fund_emergency');
      expect(AIPayloadValidator.validateFundId('fund$invalid;drop')).toBeUndefined();
    });
  });

  // =================================================================
  // 8. MALFORMED AI OUTPUT RESILIENCE
  // =================================================================
  describe('8. Malformed AI Output Resilience', () => {
    it('generates fully structured fallback with zero exception when given empty grounding', () => {
      const fallback = AIPayloadValidator.generateSafeFallback({
        spaceId: 'sp_personal',
        totalIncome: 0,
        totalExpense: 0,
        netCashFlow: 0,
        activeTransactionCount: 0,
        activeBudgetCount: 0,
        totalBudgetLimit: 0,
        currency: 'VND',
        excludedAudit: {
          mismatchedSpaceCount: 0,
          mismatchedFundCount: 0,
          inactiveLifecycleCount: 0,
          invalidAmountCount: 0,
          totalExcluded: 0
        }
      }, 'vi');

      expect(fallback.summary).toBeDefined();
      expect(fallback.insights.length).toBeGreaterThan(0);
      expect(fallback.fireProgressNote).toBeDefined();
    });
  });

  // =================================================================
  // 9. EMPTY FINANCIAL DATASET (CLEAN SLATE)
  // =================================================================
  describe('9. Empty Financial Dataset Handling', () => {
    it('handles clean slate state gracefully without hallucinating records', () => {
      const result = AIPayloadValidator.prepareInsightsPayload({
        transactions: [],
        budgets: [],
        spaceId: 'sp_empty'
      });

      expect(result.grounding.spaceId).toBe('sp_empty');
      expect(result.grounding.totalIncome).toBe(0);
      expect(result.grounding.totalExpense).toBe(0);
      expect(result.grounding.netCashFlow).toBe(0);
      expect(result.grounding.activeTransactionCount).toBe(0);
      expect(result.sanitizedTransactions.length).toBe(0);

      const fallback = AIPayloadValidator.generateSafeFallback(result.grounding, 'vi');
      expect(fallback.insights[0].title).toBe('Không Gian Chưa Có Giao Dịch');
    });
  });

  // =================================================================
  // 10. MULTI-SPACE DATASET PARTITIONING
  // =================================================================
  describe('10. Multi-Space Dataset Partitioning', () => {
    it('strictly partitions a heterogeneous multi-space dataset across 4 spaces', () => {
      const multiSpaceTxs: RawAITransaction[] = [
        { id: 'tx_p1', type: 'income', amount: 30000000, spaceId: 'sp_personal', status: 'confirmed' },
        { id: 'tx_p2', type: 'expense', amount: 10000000, spaceId: 'sp_personal', status: 'confirmed' },
        { id: 'tx_f1', type: 'income', amount: 50000000, spaceId: 'sp_family', status: 'confirmed' },
        { id: 'tx_f2', type: 'expense', amount: 25000000, spaceId: 'sp_family', status: 'confirmed' },
        { id: 'tx_b1', type: 'income', amount: 120000000, spaceId: 'sp_business', status: 'confirmed' },
        { id: 'tx_b2', type: 'expense', amount: 80000000, spaceId: 'sp_business', status: 'confirmed' },
        { id: 'tx_i1', type: 'income', amount: 15000000, spaceId: 'sp_invest', status: 'confirmed' }
      ];

      const pResult = AIPayloadValidator.prepareInsightsPayload({ transactions: multiSpaceTxs, spaceId: 'sp_personal' });
      const fResult = AIPayloadValidator.prepareInsightsPayload({ transactions: multiSpaceTxs, spaceId: 'sp_family' });
      const bResult = AIPayloadValidator.prepareInsightsPayload({ transactions: multiSpaceTxs, spaceId: 'sp_business' });
      const iResult = AIPayloadValidator.prepareInsightsPayload({ transactions: multiSpaceTxs, spaceId: 'sp_invest' });

      expect(pResult.grounding.totalIncome).toBe(30000000);
      expect(pResult.grounding.totalExpense).toBe(10000000);
      expect(pResult.grounding.activeTransactionCount).toBe(2);

      expect(fResult.grounding.totalIncome).toBe(50000000);
      expect(fResult.grounding.totalExpense).toBe(25000000);
      expect(fResult.grounding.activeTransactionCount).toBe(2);

      expect(bResult.grounding.totalIncome).toBe(120000000);
      expect(bResult.grounding.totalExpense).toBe(80000000);
      expect(bResult.grounding.activeTransactionCount).toBe(2);

      expect(iResult.grounding.totalIncome).toBe(15000000);
      expect(iResult.grounding.totalExpense).toBe(0);
      expect(iResult.grounding.activeTransactionCount).toBe(1);
    });
  });

  // =================================================================
  // 11. MULTI-FUND DATASET PARTITIONING
  // =================================================================
  describe('11. Multi-Fund Dataset Partitioning', () => {
    it('strictly partitions multiple funds within the same space', () => {
      const multiFundTxs: RawAITransaction[] = [
        { id: 'tx_f_daily', type: 'expense', amount: 200000, spaceId: 'sp_personal', fundId: 'fund_daily', status: 'confirmed' },
        { id: 'tx_f_invest', type: 'expense', amount: 5000000, spaceId: 'sp_personal', fundId: 'fund_invest', status: 'confirmed' },
        { id: 'tx_f_emergency', type: 'income', amount: 10000000, spaceId: 'sp_personal', fundId: 'fund_emergency', status: 'confirmed' }
      ];

      const dailyResult = AIPayloadValidator.prepareInsightsPayload({
        transactions: multiFundTxs,
        spaceId: 'sp_personal',
        fundId: 'fund_daily'
      });
      const investResult = AIPayloadValidator.prepareInsightsPayload({
        transactions: multiFundTxs,
        spaceId: 'sp_personal',
        fundId: 'fund_invest'
      });
      const emergResult = AIPayloadValidator.prepareInsightsPayload({
        transactions: multiFundTxs,
        spaceId: 'sp_personal',
        fundId: 'fund_emergency'
      });

      expect(dailyResult.grounding.totalExpense).toBe(200000);
      expect(dailyResult.grounding.totalIncome).toBe(0);
      expect(dailyResult.grounding.activeTransactionCount).toBe(1);

      expect(investResult.grounding.totalExpense).toBe(5000000);
      expect(investResult.grounding.totalIncome).toBe(0);
      expect(investResult.grounding.activeTransactionCount).toBe(1);

      expect(emergResult.grounding.totalIncome).toBe(10000000);
      expect(emergResult.grounding.totalExpense).toBe(0);
      expect(emergResult.grounding.activeTransactionCount).toBe(1);
    });
  });

  // =================================================================
  // 12. REGRESSION OF EXISTING AI FUNCTIONALITY
  // =================================================================
  describe('12. Regression of Existing AI Functionality', () => {
    it('AICoachEngine.analyzeHealth maintains consistent behavior without calculation drift', () => {
      const snapshot: FinancialSnapshotInput = {
        netWorth: 250000000,
        monthlyIncome: 30000000,
        monthlyExpense: 12000000,
        monthlySavings: 10000000,
        monthlyInvestment: 8000000,
        totalDebt: 0,
        totalAssets: 250000000,
        totalSavingsBalance: 60000000,
        activeBudgetsCount: 4,
        overspentBudgetsCount: 0,
        fireProgressPercent: 55,
        fireYearsRemaining: 8,
        sixJarsCompliant: true,
        recentTransactionCount: 20
      };

      const health = AICoachEngine.analyzeHealth(snapshot, 'vi');
      expect(health).toBeDefined();
      expect(health.overallScore).toBeGreaterThanOrEqual(70);
      expect(Object.keys(health.categories).length).toBe(8);
    });

    it('FinancialIntelligenceEngine maintains space context and authoritative snapshot consumption', async () => {
      const snapshot = await root.snapshotUseCase.execute('sp_personal', 'vi');
      const intelligence = FinancialIntelligenceEngine.analyze(snapshot, 'vi');

      expect(intelligence).toBeDefined();
      expect(intelligence.spaceId).toBe('sp_personal');
      expect(intelligence.summary).toBeDefined();
      expect(intelligence.summary.financialHealthRating).toBeDefined();
      expect(intelligence.insights).toBeDefined();
    });
  });
});
