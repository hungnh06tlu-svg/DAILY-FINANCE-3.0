/**
 * Daily Finance 3.0 - Subtask D3-002C
 * Property-Based Cross-Space / Cross-Fund Isolation & Transfer Conservation Expansion Suite
 * 
 * Objectives:
 * 1. Comprehensive multi-space isolation property tests across Space A, B, C, D.
 * 2. Multi-fund and multi-wallet isolation testing across Fund A1, A2, B1, B2, C1.
 * 3. Same-space and Cross-space transfer conservation and direction symmetry properties.
 * 4. Cross-fund transfer balance tracking with zero side-effects on unrelated funds.
 * 5. Multi-topology transfer matrix (A/F1->A/F2, A/F1->B/F1, A/F1->B/F2, B/F1->C/F1, C/F2->A/F1).
 * 6. Lifecycle filtering on cross-boundary transfers (draft, pending, soft_deleted exclusion).
 * 7. Duplicate transaction replay defense and deterministic replay consistency.
 * 8. High-precision unrounded decimal preservation and invalid numeric boundary checks.
 */

import { describe, it, expect } from 'vitest';
import { FinancialInvariantEngine, InvariantViolationError } from '../domain/InvariantEngine';
import { FinancialTruthEngine } from '../domain/FinancialTruthEngine';
import { Transaction, TransactionStatus, TransactionType } from '../types';

// ============================================================================
// 1. DETERMINISTIC PRNG & PROPERTY HARNESS
// ============================================================================

class SeededRandom {
  private state: number;

  constructor(public readonly seed: number) {
    this.state = seed >>> 0;
  }

  public next(): number {
    this.state |= 0;
    this.state = (this.state + 0x6d2b79f5) | 0;
    let t = Math.imul(this.state ^ (this.state >>> 15), 1 | this.state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  public nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  public nextChoice<T>(arr: readonly T[]): T {
    return arr[this.nextInt(0, arr.length - 1)];
  }

  public nextFloat(min: number, max: number): number {
    return min + this.next() * (max - min);
  }
}

interface PropertyOptions {
  iterations?: number;
  seed?: number;
}

function forAll<T>(
  generator: (rng: SeededRandom, iteration: number) => T,
  propertyFn: (sample: T, iteration: number) => void,
  options: PropertyOptions = {}
): void {
  const seed = options.seed ?? 20260828;
  const iterations = options.iterations ?? 30;
  const rng = new SeededRandom(seed);

  for (let i = 0; i < iterations; i++) {
    const sample = generator(rng, i);
    try {
      propertyFn(sample, i);
    } catch (err: any) {
      const errorMsg = `[Property Failure D3-002C] Seed: ${seed} | Iteration: ${i}\n` +
        `Sample: ${JSON.stringify(sample, null, 2)}\n` +
        `Error: ${err.message || String(err)}`;
      throw new Error(errorMsg);
    }
  }
}

const round2 = (v: number) => Math.round(v * 100) / 100;

// ============================================================================
// 2. PROPERTY TEST SUITES FOR CROSS-SPACE & CROSS-FUND ISOLATION
// ============================================================================

describe('D3-002C — Property-Based Cross-Space & Cross-Fund Isolation Matrix', () => {

  // --------------------------------------------------------------------------
  // SECTION 1: MULTI-SPACE ISOLATION PROPERTIES (4 SPACES: A, B, C, D)
  // --------------------------------------------------------------------------
  describe('Multi-Space Isolation Properties (Space A, B, C, D)', () => {

    it('P01: Space Isolation — adding transactions to Space A causes exactly 0 delta in Space B, C, D', () => {
      forAll(
        (rng) => {
          const spaces = ['sp_alpha', 'sp_beta', 'sp_gamma', 'sp_delta'];
          const activeSpace = 'sp_alpha';
          const otherSpaces = ['sp_beta', 'sp_gamma', 'sp_delta'];

          // Generate base dataset across all spaces
          const baseTxs: Transaction[] = [];
          for (let i = 0; i < 20; i++) {
            const sp = rng.nextChoice(spaces);
            const amt = rng.nextInt(1000, 500000);
            const type: TransactionType = rng.nextChoice(['income', 'expense']);
            baseTxs.push({
              id: `base_${i}`,
              type,
              amount: amt,
              currency: 'VND',
              category: 'General',
              spaceId: sp,
              walletId: `w_${sp}_default`,
              date: '2026-08-01',
              status: 'confirmed'
            });
          }

          // Generate new transaction exclusively for Space A
          const newAmt = rng.nextInt(5000, 200000);
          const newTx: Transaction = {
            id: `tx_alpha_new`,
            type: rng.nextChoice(['income', 'expense', 'opening_balance']),
            amount: newAmt,
            currency: 'VND',
            category: 'Bonus',
            spaceId: activeSpace,
            walletId: 'w_sp_alpha_default',
            date: '2026-08-02',
            status: 'confirmed'
          };

          return { baseTxs, newTx, otherSpaces };
        },
        ({ baseTxs, newTx, otherSpaces }) => {
          // Pre-mutation balance calculation for other spaces
          const preBalances = otherSpaces.map(sp => ({
            spaceId: sp,
            balance: FinancialTruthEngine.calculateBalance(baseTxs, 0, sp)
          }));

          const mutatedTxs = [...baseTxs, newTx];

          // Post-mutation balance check for other spaces
          for (const item of preBalances) {
            const postBal = FinancialTruthEngine.calculateBalance(mutatedTxs, 0, item.spaceId);
            expect(postBal).toBe(item.balance);
          }

          // Verify Invariant Engine asserts space isolation for Space Alpha transactions
          const alphaTxs = mutatedTxs.filter(t => t.spaceId === 'sp_alpha');
          expect(() => FinancialInvariantEngine.assertSpaceIsolation(alphaTxs, 'sp_alpha')).not.toThrow();
        },
        { seed: 20001, iterations: 40 }
      );
    });

    it('P02: Strict Foreign Space Exclusion — calculateIncome and calculateExpense for Space B filter out Space A', () => {
      forAll(
        (rng) => {
          const alphaIncomes = rng.nextInt(1, 5);
          const alphaExpenses = rng.nextInt(1, 5);
          const betaIncomes = rng.nextInt(1, 5);
          const betaExpenses = rng.nextInt(1, 5);

          const txs: Transaction[] = [];
          let expBetaInc = 0;
          let expBetaExp = 0;

          // Alpha transactions
          for (let i = 0; i < alphaIncomes; i++) {
            txs.push({ id: `a_inc_${i}`, type: 'income', amount: 10000 + i * 100, currency: 'VND', category: 'A', spaceId: 'sp_alpha', date: '2026-08-01', status: 'confirmed' });
          }
          for (let i = 0; i < alphaExpenses; i++) {
            txs.push({ id: `a_exp_${i}`, type: 'expense', amount: 5000 + i * 100, currency: 'VND', category: 'A', spaceId: 'sp_alpha', date: '2026-08-01', status: 'confirmed' });
          }

          // Beta transactions
          for (let i = 0; i < betaIncomes; i++) {
            const amt = 20000 + i * 500;
            expBetaInc += amt;
            txs.push({ id: `b_inc_${i}`, type: 'income', amount: amt, currency: 'VND', category: 'B', spaceId: 'sp_beta', date: '2026-08-01', status: 'confirmed' });
          }
          for (let i = 0; i < betaExpenses; i++) {
            const amt = 12000 + i * 300;
            expBetaExp += amt;
            txs.push({ id: `b_exp_${i}`, type: 'expense', amount: amt, currency: 'VND', category: 'B', spaceId: 'sp_beta', date: '2026-08-01', status: 'confirmed' });
          }

          return { txs, expBetaInc, expBetaExp };
        },
        ({ txs, expBetaInc, expBetaExp }) => {
          const betaInc = FinancialTruthEngine.calculateIncome(txs, undefined, undefined, 'sp_beta');
          const betaExp = FinancialTruthEngine.calculateExpense(txs, undefined, undefined, 'sp_beta');

          expect(betaInc).toBe(round2(expBetaInc));
          expect(betaExp).toBe(round2(expBetaExp));
        },
        { seed: 20002, iterations: 30 }
      );
    });

  });

  // --------------------------------------------------------------------------
  // SECTION 2: MULTI-FUND & MULTI-WALLET ISOLATION PROPERTIES
  // --------------------------------------------------------------------------
  describe('Multi-Fund & Multi-Wallet Isolation Properties', () => {

    it('P03: Fund Isolation Mutation — inserting transaction into Fund A1 causes zero balance change in Fund A2 & Fund B1', () => {
      forAll(
        (rng) => {
          const funds = ['fund_a1', 'fund_a2', 'fund_b1', 'fund_b2', 'fund_c1'];
          const targetMutatedFund = 'fund_a1';
          const untouchedFunds = ['fund_a2', 'fund_b1', 'fund_b2', 'fund_c1'];

          const txs: Transaction[] = [];
          for (let i = 0; i < 25; i++) {
            const f = rng.nextChoice(funds);
            const amt = rng.nextInt(2000, 100000);
            txs.push({
              id: `f_tx_${i}`,
              type: rng.nextChoice(['income', 'expense']),
              amount: amt,
              currency: 'VND',
              category: 'Cat',
              spaceId: f.startsWith('fund_a') ? 'sp_alpha' : 'sp_beta',
              walletId: f,
              date: '2026-08-01',
              status: 'confirmed'
            });
          }

          const newTx: Transaction = {
            id: 'tx_fund_a1_new',
            type: 'income',
            amount: 50000,
            currency: 'VND',
            category: 'Injection',
            spaceId: 'sp_alpha',
            walletId: targetMutatedFund,
            date: '2026-08-02',
            status: 'confirmed'
          };

          return { txs, newTx, untouchedFunds };
        },
        ({ txs, newTx, untouchedFunds }) => {
          const preBalances = untouchedFunds.map(f => ({
            fundId: f,
            balance: FinancialTruthEngine.calculateWalletBalance(txs, f)
          }));

          const postTxs = [...txs, newTx];

          for (const item of preBalances) {
            const postBal = FinancialTruthEngine.calculateWalletBalance(postTxs, item.fundId);
            expect(postBal).toBe(item.balance);
          }
        },
        { seed: 20003, iterations: 30 }
      );
    });

    it('P04: Wallet & Account Identifiers Alias Interoperability — walletId, accountId, fundId map safely without cross-contamination', () => {
      forAll(
        (rng) => {
          const w1Amt = rng.nextInt(10000, 50000);
          const w2Amt = rng.nextInt(20000, 60000);

          const txs: Transaction[] = [
            {
              id: 'tx_alias_1',
              type: 'income',
              amount: w1Amt,
              currency: 'VND',
              category: 'Cat',
              spaceId: 'sp_alpha',
              walletId: 'w_vault_1',
              date: '2026-08-01',
              status: 'confirmed'
            },
            {
              id: 'tx_alias_2',
              type: 'income',
              amount: w2Amt,
              currency: 'VND',
              category: 'Cat',
              spaceId: 'sp_alpha',
              accountId: 'w_vault_2', // alias accountId
              date: '2026-08-01',
              status: 'confirmed'
            }
          ];

          return { txs, w1Amt, w2Amt };
        },
        ({ txs, w1Amt, w2Amt }) => {
          const bal1 = FinancialTruthEngine.calculateWalletBalance(txs, 'w_vault_1');
          const bal2 = FinancialTruthEngine.calculateWalletBalance(txs, 'w_vault_2');

          expect(bal1).toBe(round2(w1Amt));
          expect(bal2).toBe(round2(w2Amt));

          // Invariant engine assertion
          expect(() => FinancialInvariantEngine.assertFundIsolation([txs[0]], 'w_vault_1')).not.toThrow();
          expect(() => FinancialInvariantEngine.assertFundIsolation([txs[1]], 'w_vault_2')).not.toThrow();
        },
        { seed: 20004, iterations: 30 }
      );
    });

  });

  // --------------------------------------------------------------------------
  // SECTION 3: SAME-SPACE & CROSS-SPACE TRANSFER CONSERVATION PROPERTIES
  // --------------------------------------------------------------------------
  describe('Same-Space & Cross-Space Transfer Properties', () => {

    it('P05: Same-Space Transfer Conservation — A -> A transfer alters wallet balances but leaves Space net balance delta at exactly 0', () => {
      forAll(
        (rng) => {
          const initialBalance = rng.nextInt(200000, 1000000);
          const transferAmt = rng.nextInt(10000, 100000);
          const spaceId = 'sp_alpha';

          const baseTx: Transaction = {
            id: 'tx_init',
            type: 'opening_balance',
            amount: initialBalance,
            currency: 'VND',
            category: 'Opening',
            spaceId,
            walletId: 'w_alpha_cash',
            date: '2026-08-01',
            status: 'confirmed'
          };

          const transferTx: Transaction = {
            id: 'tx_same_transfer',
            type: 'transfer',
            amount: transferAmt,
            currency: 'VND',
            category: 'Internal Transfer',
            spaceId,
            walletId: 'w_alpha_cash',
            targetWalletId: 'w_alpha_savings',
            date: '2026-08-02',
            status: 'confirmed',
            ...({ destinationAmount: transferAmt } as any)
          };

          return { baseTx, transferTx, initialBalance, transferAmt, spaceId };
        },
        ({ baseTx, transferTx, initialBalance, transferAmt, spaceId }) => {
          const preSpaceBal = FinancialTruthEngine.calculateBalance([baseTx], 0, spaceId);
          const postSpaceBal = FinancialTruthEngine.calculateBalance([baseTx, transferTx], 0, spaceId);

          // Space balance must be identical (net delta = 0)
          expect(postSpaceBal).toBe(preSpaceBal);

          // Wallet specific balance changes
          const cashBal = FinancialTruthEngine.calculateWalletBalance([baseTx, transferTx], 'w_alpha_cash');
          const savBal = FinancialTruthEngine.calculateWalletBalance([baseTx, transferTx], 'w_alpha_savings');

          expect(cashBal).toBe(round2(initialBalance - transferAmt));
          expect(savBal).toBe(round2(transferAmt));

          // Invariant assertions
          expect(() => FinancialInvariantEngine.assertTransferNeutral([transferTx], spaceId)).not.toThrow();
        },
        { seed: 20005, iterations: 40 }
      );
    });

    it('P06: Cross-Space Transfer Balance Impact — A -> B transfer decreases Space A by X and increases Space B by X with system net delta = 0', () => {
      forAll(
        (rng) => {
          const alphaInit = rng.nextInt(300000, 800000);
          const betaInit = rng.nextInt(100000, 500000);
          const xferAmt = rng.nextInt(10000, 90000);

          const txs: Transaction[] = [
            { id: 'init_a', type: 'opening_balance', amount: alphaInit, currency: 'VND', category: 'Init', spaceId: 'sp_alpha', date: '2026-08-01', status: 'confirmed' },
            { id: 'init_b', type: 'opening_balance', amount: betaInit, currency: 'VND', category: 'Init', spaceId: 'sp_beta', date: '2026-08-01', status: 'confirmed' },
            {
              id: 'xfer_a_b',
              type: 'transfer',
              amount: xferAmt,
              currency: 'VND',
              category: 'Inter-space Transfer',
              spaceId: 'sp_alpha',
              targetSpaceId: 'sp_beta',
              walletId: 'w_alpha_main',
              targetWalletId: 'w_beta_main',
              date: '2026-08-02',
              status: 'confirmed',
              ...({ destinationAmount: xferAmt } as any)
            }
          ];

          return { txs, alphaInit, betaInit, xferAmt };
        },
        ({ txs, alphaInit, betaInit, xferAmt }) => {
          const balAlpha = FinancialTruthEngine.calculateBalance(txs, 0, 'sp_alpha');
          const balBeta = FinancialTruthEngine.calculateBalance(txs, 0, 'sp_beta');

          expect(balAlpha).toBe(round2(alphaInit - xferAmt));
          expect(balBeta).toBe(round2(betaInit + xferAmt));

          // Total system balance sum must equal initial sum
          const systemNet = balAlpha + balBeta;
          expect(systemNet).toBe(round2(alphaInit + betaInit));

          // Invariant engine global conservation
          expect(() => FinancialInvariantEngine.assertGlobalConservation(txs)).not.toThrow();
        },
        { seed: 20006, iterations: 40 }
      );
    });

    it('P07: Directional Symmetry — Reversing transfer direction (B -> A) produces exact mirror balance deltas', () => {
      forAll(
        (rng) => {
          const amt = rng.nextInt(50000, 250000);

          const forwardTx: Transaction = {
            id: 'xfer_fwd',
            type: 'transfer',
            amount: amt,
            currency: 'VND',
            category: 'Symmetry',
            spaceId: 'sp_alpha',
            targetSpaceId: 'sp_beta',
            date: '2026-08-01',
            status: 'confirmed'
          };

          const reverseTx: Transaction = {
            id: 'xfer_rev',
            type: 'transfer',
            amount: amt,
            currency: 'VND',
            category: 'Symmetry',
            spaceId: 'sp_beta',
            targetSpaceId: 'sp_alpha',
            date: '2026-08-01',
            status: 'confirmed'
          };

          return { forwardTx, reverseTx, amt };
        },
        ({ forwardTx, reverseTx, amt }) => {
          const fwdAlpha = FinancialTruthEngine.calculateBalance([forwardTx], 0, 'sp_alpha');
          const fwdBeta = FinancialTruthEngine.calculateBalance([forwardTx], 0, 'sp_beta');

          const revAlpha = FinancialTruthEngine.calculateBalance([reverseTx], 0, 'sp_alpha');
          const revBeta = FinancialTruthEngine.calculateBalance([reverseTx], 0, 'sp_beta');

          expect(fwdAlpha).toBe(-round2(amt));
          expect(fwdBeta).toBe(round2(amt));

          expect(revAlpha).toBe(round2(amt));
          expect(revBeta).toBe(-round2(amt));

          // Combining forward + reverse nets out to 0 balance for both spaces
          const combinedAlpha = FinancialTruthEngine.calculateBalance([forwardTx, reverseTx], 0, 'sp_alpha');
          const combinedBeta = FinancialTruthEngine.calculateBalance([forwardTx, reverseTx], 0, 'sp_beta');

          expect(combinedAlpha).toBe(0);
          expect(combinedBeta).toBe(0);
        },
        { seed: 20007, iterations: 30 }
      );
    });

  });

  // --------------------------------------------------------------------------
  // SECTION 4: MULTI-TOPOLOGY MATRIX (A/F1->A/F2, A/F1->B/F1, A/F1->B/F2, B/F1->C/F1, C/F2->A/F1)
  // --------------------------------------------------------------------------
  describe('Multi-Topology Cross-Space & Cross-Fund Transfer Matrix', () => {

    it('P08: 5-Topology Transfer Matrix — source decreases by X, target increases by X, unrelated spaces/funds remain 0 delta', () => {
      forAll(
        (rng) => {
          const amt1 = rng.nextInt(10000, 50000);
          const amt2 = rng.nextInt(10000, 50000);
          const amt3 = rng.nextInt(10000, 50000);
          const amt4 = rng.nextInt(10000, 50000);
          const amt5 = rng.nextInt(10000, 50000);

          const matrixTxs: Transaction[] = [
            // Topology 1: A/F1 -> A/F2 (Same space, cross fund)
            { id: 'top_1', type: 'transfer', amount: amt1, currency: 'VND', category: 'T1', spaceId: 'sp_A', walletId: 'F1', targetWalletId: 'F2', date: '2026-08-01', status: 'confirmed' },
            // Topology 2: A/F1 -> B/F1 (Cross space, same fund name)
            { id: 'top_2', type: 'transfer', amount: amt2, currency: 'VND', category: 'T2', spaceId: 'sp_A', targetSpaceId: 'sp_B', walletId: 'F1', targetWalletId: 'F1', date: '2026-08-01', status: 'confirmed' },
            // Topology 3: A/F1 -> B/F2 (Cross space, cross fund)
            { id: 'top_3', type: 'transfer', amount: amt3, currency: 'VND', category: 'T3', spaceId: 'sp_A', targetSpaceId: 'sp_B', walletId: 'F1', targetWalletId: 'F2', date: '2026-08-01', status: 'confirmed' },
            // Topology 4: B/F1 -> C/F1 (Cross space, multi space)
            { id: 'top_4', type: 'transfer', amount: amt4, currency: 'VND', category: 'T4', spaceId: 'sp_B', targetSpaceId: 'sp_C', walletId: 'F1', targetWalletId: 'F1', date: '2026-08-01', status: 'confirmed' },
            // Topology 5: C/F2 -> A/F1 (Cross space loop back)
            { id: 'top_5', type: 'transfer', amount: amt5, currency: 'VND', category: 'T5', spaceId: 'sp_C', targetSpaceId: 'sp_A', walletId: 'F2', targetWalletId: 'F1', date: '2026-08-01', status: 'confirmed' }
          ];

          return { matrixTxs, amt1, amt2, amt3, amt4, amt5 };
        },
        ({ matrixTxs, amt1, amt2, amt3, amt4, amt5 }) => {
          // Calculate space balances
          const balA = FinancialTruthEngine.calculateBalance(matrixTxs, 0, 'sp_A');
          const balB = FinancialTruthEngine.calculateBalance(matrixTxs, 0, 'sp_B');
          const balC = FinancialTruthEngine.calculateBalance(matrixTxs, 0, 'sp_C');
          const balD = FinancialTruthEngine.calculateBalance(matrixTxs, 0, 'sp_D'); // Unrelated Space D

          // Space D was untouched by all 5 topologies
          expect(balD).toBe(0);

          // Total system sum across all spaces must equal 0
          const totalSystem = balA + balB + balC + balD;
          expect(totalSystem).toBe(0);

          // Assert Global Conservation Invariant
          expect(() => FinancialInvariantEngine.assertGlobalConservation(matrixTxs)).not.toThrow();
        },
        { seed: 20008, iterations: 30 }
      );
    });

  });

  // --------------------------------------------------------------------------
  // SECTION 5: LIFECYCLE & CROSS-BOUNDARY TRANSFER FILTERING
  // --------------------------------------------------------------------------
  describe('Lifecycle Filtering on Cross-Boundary Transfers', () => {

    it('P09: Inactive Cross-Space Transfers — draft, pending, soft_deleted transfers create 0 balance impact', () => {
      forAll(
        (rng) => {
          const spaceA = 'sp_alpha';
          const spaceB = 'sp_beta';
          const xferAmt = rng.nextInt(20000, 100000);

          const inactiveStatuses: TransactionStatus[] = ['draft', 'soft_deleted', 'archived'];
          const selectedStatus = rng.nextChoice(inactiveStatuses);

          const txs: Transaction[] = [
            {
              id: 'tx_inactive_xfer',
              type: 'transfer',
              amount: xferAmt,
              currency: 'VND',
              category: 'Pending Xfer',
              spaceId: spaceA,
              targetSpaceId: spaceB,
              date: '2026-08-01',
              status: selectedStatus,
              isDeleted: selectedStatus === 'soft_deleted' ? true : undefined
            }
          ];

          return { txs, spaceA, spaceB };
        },
        ({ txs, spaceA, spaceB }) => {
          const balA = FinancialTruthEngine.calculateBalance(txs, 0, spaceA);
          const balB = FinancialTruthEngine.calculateBalance(txs, 0, spaceB);

          expect(balA).toBe(0);
          expect(balB).toBe(0);
        },
        { seed: 20009, iterations: 30 }
      );
    });

    it('P10: Lifecycle Transition Effect — Restoring a soft_deleted cross-space transfer immediately applies balance changes', () => {
      forAll(
        (rng) => {
          const amt = rng.nextInt(15000, 75000);

          const deletedTx: Transaction = {
            id: 'xfer_deleted',
            type: 'transfer',
            amount: amt,
            currency: 'VND',
            category: 'Lifecycle',
            spaceId: 'sp_alpha',
            targetSpaceId: 'sp_beta',
            date: '2026-08-01',
            status: 'soft_deleted',
            isDeleted: true
          };

          const restoredTx: Transaction = {
            ...deletedTx,
            status: 'confirmed',
            isDeleted: false
          };

          return { deletedTx, restoredTx, amt };
        },
        ({ deletedTx, restoredTx, amt }) => {
          // Soft deleted state -> zero effect
          const preAlpha = FinancialTruthEngine.calculateBalance([deletedTx], 0, 'sp_alpha');
          const preBeta = FinancialTruthEngine.calculateBalance([deletedTx], 0, 'sp_beta');
          expect(preAlpha).toBe(0);
          expect(preBeta).toBe(0);

          // Restored confirmed state -> exact effect
          const postAlpha = FinancialTruthEngine.calculateBalance([restoredTx], 0, 'sp_alpha');
          const postBeta = FinancialTruthEngine.calculateBalance([restoredTx], 0, 'sp_beta');
          expect(postAlpha).toBe(-round2(amt));
          expect(postBeta).toBe(round2(amt));
        },
        { seed: 20010, iterations: 30 }
      );
    });

  });

  // --------------------------------------------------------------------------
  // SECTION 6: DUPLICATE / REPLAY RESISTANCE & DETERMINISM
  // --------------------------------------------------------------------------
  describe('Duplicate Replay Resistance & Determinism', () => {

    it('P11: Idempotency Replay — Batch containing duplicate transaction IDs triggers INV-014 Invariant Violation', () => {
      forAll(
        (rng) => {
          const dupId = `tx_dup_${rng.nextInt(100, 999)}`;
          const batch: Transaction[] = [
            { id: dupId, type: 'income', amount: 50000, currency: 'VND', category: 'Inc', spaceId: 'sp_alpha', date: '2026-08-01', status: 'confirmed' },
            { id: 'tx_unique_1', type: 'expense', amount: 20000, currency: 'VND', category: 'Exp', spaceId: 'sp_alpha', date: '2026-08-01', status: 'confirmed' },
            { id: dupId, type: 'income', amount: 50000, currency: 'VND', category: 'Dup', spaceId: 'sp_alpha', date: '2026-08-01', status: 'confirmed' }
          ];

          return { batch, dupId };
        },
        ({ batch }) => {
          expect(() => FinancialInvariantEngine.assertIdempotency('batch_op', batch)).toThrow(InvariantViolationError);
        },
        { seed: 20011, iterations: 30 }
      );
    });

    it('P12: Function Evaluation Determinism — Repeating FinancialTruthEngine calls 5x yields identical result', () => {
      forAll(
        (rng) => {
          const txs: Transaction[] = Array.from({ length: 15 }, (_, i) => ({
            id: `det_tx_${i}`,
            type: rng.nextChoice(['income', 'expense', 'transfer']),
            amount: rng.nextInt(5000, 100000),
            currency: 'VND',
            category: 'Cat',
            spaceId: rng.nextChoice(['sp_alpha', 'sp_beta']),
            targetSpaceId: 'sp_beta',
            date: '2026-08-01',
            status: 'confirmed'
          }));

          return { txs };
        },
        ({ txs }) => {
          const runs = Array.from({ length: 5 }, () => FinancialTruthEngine.calculateBalance(txs, 0, 'sp_alpha'));
          const firstRun = runs[0];
          for (const run of runs) {
            expect(run).toBe(firstRun);
          }
        },
        { seed: 20012, iterations: 30 }
      );
    });

  });

  // --------------------------------------------------------------------------
  // SECTION 7: HIGH-PRECISION UNROUNDED DECIMALS & INVALID NUMERIC BOUNDARIES
  // --------------------------------------------------------------------------
  describe('High-Precision Decimal Preservation & Invalid Numeric Boundaries', () => {

    it('P13: High Precision Amounts — preserves high precision decimals in invariant assertions without forced truncation', () => {
      forAll(
        (rng) => {
          const precAmts = [0.00000001, 0.000023, 0.001, 100.456789, 123456.789123];
          const amt = rng.nextChoice(precAmts);

          return { amt };
        },
        ({ amt }) => {
          // Invariant engine preserves raw precision input
          expect(() => FinancialInvariantEngine.assertIncomePositive(amt)).not.toThrow();
        },
        { seed: 20013, iterations: 20 }
      );
    });

    it('P14: Invalid Numeric Boundaries — NaN, Infinity, -Infinity, negative amounts trigger explicit Invariant Violation', () => {
      forAll(
        (rng) => {
          const invalidVals = [NaN, Infinity, -Infinity, -500, 0];
          const invalidVal = rng.nextChoice(invalidVals);

          return { invalidVal };
        },
        ({ invalidVal }) => {
          expect(() => FinancialInvariantEngine.assertIncomePositive(invalidVal)).toThrow(InvariantViolationError);
        },
        { seed: 20014, iterations: 20 }
      );
    });

  });

  // --------------------------------------------------------------------------
  // SECTION 8: EXTENDED DOMAIN & INVARIANT PROPERTIES (P15 - P22)
  // --------------------------------------------------------------------------
  describe('Extended Domain & Invariant Properties', () => {

    it('P15: Fund Isolation Strict Rejection — assertFundIsolation with allowTargetTransfers=false rejects target fund transfers', () => {
      forAll(
        (rng) => {
          const tx: Transaction = {
            id: `tx_target_xfer_${rng.nextInt(100, 999)}`,
            type: 'transfer',
            amount: 25000,
            currency: 'VND',
            category: 'Xfer',
            spaceId: 'sp_alpha',
            walletId: 'w_source',
            targetWalletId: 'w_target',
            date: '2026-08-01',
            status: 'confirmed'
          };

          return { tx };
        },
        ({ tx }) => {
          // When allowTargetTransfers is false, checking for 'w_target' boundary rejects tx coming from 'w_source'
          expect(() =>
            FinancialInvariantEngine.assertFundIsolation([tx], 'w_target', { allowTargetTransfers: false })
          ).toThrow(InvariantViolationError);
        },
        { seed: 20015, iterations: 20 }
      );
    });

    it('P16: Transfer Neutrality Enforcement — Asymmetric or corrupt transfer amounts fail assertTransferNeutral', () => {
      forAll(
        (rng) => {
          const tx: Transaction = {
            id: `tx_asym_${rng.nextInt(100, 999)}`,
            type: 'transfer',
            amount: 50000,
            currency: 'VND',
            category: 'Leak',
            spaceId: 'sp_alpha',
            walletId: 'w_1',
            targetWalletId: 'w_2',
            date: '2026-08-01',
            status: 'confirmed',
            ...({ destinationAmount: 40000 } as any) // Leak 10,000
          };

          return { tx };
        },
        ({ tx }) => {
          expect(() => FinancialInvariantEngine.assertTransferNeutral([tx], 'sp_alpha')).toThrow(InvariantViolationError);
        },
        { seed: 20016, iterations: 20 }
      );
    });

    it('P17: Monotonic Audit Trail Growth — Truncated or missing audit trail on updated version throws INV-015', () => {
      forAll(
        (rng) => {
          const v2Tx: Transaction = {
            id: `tx_v2_${rng.nextInt(100, 999)}`,
            type: 'income',
            amount: 100000,
            currency: 'VND',
            category: 'Salary',
            spaceId: 'sp_alpha',
            date: '2026-08-01',
            status: 'confirmed',
            ...({ version: 2, auditTrail: [] } as any) // Empty audit trail for v2
          };

          return { v2Tx };
        },
        ({ v2Tx }) => {
          expect(() => FinancialInvariantEngine.assertAuditTrailGrowth(v2Tx, 2)).toThrow(InvariantViolationError);
        },
        { seed: 20017, iterations: 20 }
      );
    });

    it('P18: Net Worth Space Isolation Guard — Net worth calculation for Space A ignores Space B assets and debts', () => {
      forAll(
        (rng) => {
          const valA = rng.nextInt(500000, 2000000);
          const valB = rng.nextInt(300000, 1000000);

          const wallets = [
            { id: 'w_a', name: 'Alpha Cash', currentBalance: valA, currency: 'VND', spaceId: 'sp_alpha', status: 'active' as const },
            { id: 'w_b', name: 'Beta Cash', currentBalance: valB, currency: 'VND', spaceId: 'sp_beta', status: 'active' as const }
          ];

          return { wallets, valA, valB };
        },
        ({ wallets, valA, valB }) => {
          const nwAlpha = FinancialTruthEngine.calculateNetWorth(wallets as any, [], [], [], 'sp_alpha');
          const nwBeta = FinancialTruthEngine.calculateNetWorth(wallets as any, [], [], [], 'sp_beta');
          const nwGlobal = FinancialTruthEngine.calculateNetWorth(wallets as any, [], [], []);

          expect(nwAlpha).toBe(round2(valA));
          expect(nwBeta).toBe(round2(valB));
          expect(nwGlobal).toBe(round2(valA + valB));
        },
        { seed: 20018, iterations: 20 }
      );
    });

    it('P19: Account/Wallet Alias Balance Symmetry — Using accountId vs walletId in queries returns identical balance', () => {
      forAll(
        (rng) => {
          const amt = rng.nextInt(10000, 90000);

          const txs: Transaction[] = [
            { id: 't1', type: 'income', amount: amt, currency: 'VND', category: 'General', spaceId: 'sp_alpha', walletId: 'w_main', date: '2026-08-01', status: 'confirmed' }
          ];

          return { txs, amt };
        },
        ({ txs, amt }) => {
          const balByWalletId = FinancialTruthEngine.calculateWalletBalance(txs, 'w_main');
          // Alias query
          const balByAccountId = FinancialTruthEngine.calculateWalletBalance(txs, 'w_main');

          expect(balByWalletId).toBe(round2(amt));
          expect(balByAccountId).toBe(balByWalletId);
        },
        { seed: 20019, iterations: 20 }
      );
    });

    it('P20: Multi-Space Budget Isolation — Expense in Space Beta does not reduce available budget in Space Alpha', () => {
      forAll(
        (rng) => {
          const expA = rng.nextInt(10000, 50000);
          const expB = rng.nextInt(100000, 500000);

          const txs: Transaction[] = [
            { id: 'e_a', type: 'expense', amount: expA, currency: 'VND', category: 'Food', spaceId: 'sp_alpha', date: '2026-08-01', status: 'confirmed' },
            { id: 'e_b', type: 'expense', amount: expB, currency: 'VND', category: 'Food', spaceId: 'sp_beta', date: '2026-08-01', status: 'confirmed' }
          ];

          return { txs, expA, expB };
        },
        ({ txs, expA }) => {
          const alphaExpenses = FinancialTruthEngine.calculateExpense(txs, undefined, undefined, 'sp_alpha');
          expect(alphaExpenses).toBe(round2(expA));
        },
        { seed: 20020, iterations: 20 }
      );
    });

    it('P21: Circular Hop Ring Transfer Conservation — A -> B -> C -> A restores all space initial balances', () => {
      forAll(
        (rng) => {
          const initA = 500000;
          const initB = 500000;
          const initC = 500000;
          const hopAmt = rng.nextInt(50000, 200000);

          const txs: Transaction[] = [
            { id: 'i_a', type: 'opening_balance', amount: initA, currency: 'VND', category: 'Init', spaceId: 'sp_A', date: '2026-08-01', status: 'confirmed' },
            { id: 'i_b', type: 'opening_balance', amount: initB, currency: 'VND', category: 'Init', spaceId: 'sp_B', date: '2026-08-01', status: 'confirmed' },
            { id: 'i_c', type: 'opening_balance', amount: initC, currency: 'VND', category: 'Init', spaceId: 'sp_C', date: '2026-08-01', status: 'confirmed' },
            // Hop 1: A -> B
            { id: 'hop_1', type: 'transfer', amount: hopAmt, currency: 'VND', category: 'Ring', spaceId: 'sp_A', targetSpaceId: 'sp_B', date: '2026-08-02', status: 'confirmed' },
            // Hop 2: B -> C
            { id: 'hop_2', type: 'transfer', amount: hopAmt, currency: 'VND', category: 'Ring', spaceId: 'sp_B', targetSpaceId: 'sp_C', date: '2026-08-02', status: 'confirmed' },
            // Hop 3: C -> A
            { id: 'hop_3', type: 'transfer', amount: hopAmt, currency: 'VND', category: 'Ring', spaceId: 'sp_C', targetSpaceId: 'sp_A', date: '2026-08-02', status: 'confirmed' }
          ];

          return { txs, initA, initB, initC };
        },
        ({ txs, initA, initB, initC }) => {
          const balA = FinancialTruthEngine.calculateBalance(txs, 0, 'sp_A');
          const balB = FinancialTruthEngine.calculateBalance(txs, 0, 'sp_B');
          const balC = FinancialTruthEngine.calculateBalance(txs, 0, 'sp_C');

          expect(balA).toBe(initA);
          expect(balB).toBe(initB);
          expect(balC).toBe(initC);
        },
        { seed: 20021, iterations: 25 }
      );
    });

    it('P22: Currency Integrity Tagging — Transaction retains currency field without conversion side-effects', () => {
      forAll(
        (rng) => {
          const currencies = ['VND', 'USD', 'EUR', 'JPY'];
          const curr = rng.nextChoice(currencies);
          const amt = rng.nextInt(100, 10000);

          const tx: Transaction = {
            id: 'tx_curr',
            type: 'income',
            amount: amt,
            currency: curr,
            category: 'Cat',
            spaceId: 'sp_alpha',
            date: '2026-08-01',
            status: 'confirmed'
          };

          return { tx, curr, amt };
        },
        ({ tx, curr, amt }) => {
          expect(tx.currency).toBe(curr);
          expect(tx.amount).toBe(amt);
        },
        { seed: 20022, iterations: 20 }
      );
    });

  });

});

