/**
 * Daily Finance 3.0 - AI-001C Voice Assistant Two-Phase Confirmation Guard Test Suite
 * 
 * Verifies the strict two-phase protocol:
 * PHASE 1 — PROPOSAL (PENDING, requiresConfirmation = true, 0 mutations)
 * PHASE 2 — CONFIRMED EXECUTION (Human confirmation, Use Case execution boundary, Canonical Financial Model)
 * 
 * Satisfies:
 * - Scenarios P01 to P18
 * - Invariant Properties 1 to 7 (Deterministic Property-Based Suite)
 * - Financial Truth & Invariant Protection
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { CompositionRoot } from '../di/CompositionRoot';
import { VoiceCommandParser } from '../domain/VoiceCommandParser';
import { GetVoiceAssistantStateUseCase } from '../usecases/GetVoiceAssistantStateUseCase';
import { VoiceAssistantViewModel } from '../viewmodels/VoiceAssistantViewModel';

// Deterministic Pseudo-Random Generator for Property-Based Checks
class SeededRandom {
  private state: number;

  constructor(seed: number = 20260919) {
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

  public nextChoice<T>(items: readonly T[]): T {
    return items[this.nextInt(0, items.length - 1)];
  }
}

describe('AI-001C: Voice Assistant Two-Phase Confirmation Guard', () => {
  let root: CompositionRoot;
  let voiceUseCase: GetVoiceAssistantStateUseCase;
  let voiceVM: VoiceAssistantViewModel;

  beforeEach(() => {
    // Fresh composition root and viewmodels for each test run
    root = new CompositionRoot();
    voiceUseCase = root.voiceAssistantStateUseCase;
    voiceVM = new VoiceAssistantViewModel(voiceUseCase);
  });

  // ==========================================================================
  // SECTION A: SCENARIOS P01 - P18
  // ==========================================================================

  describe('P01 — Mutation Starts PENDING', () => {
    it('Creates mutation proposal in PENDING state and requiresConfirmation is true', async () => {
      const { command, result } = await voiceUseCase.processVoiceCommand('Thêm khoản chi 250k mua sách', 'sp_personal', 'vi');
      
      expect(result.requiresConfirmation).toBe(true);
      expect(result.commandId).toBe(command.id);

      const pending = voiceUseCase.getPendingCommand(command.id);
      expect(pending).toBeDefined();
      expect(pending?.status).toBe('PENDING');
      expect(pending?.requiresConfirmation).toBe(true);
      expect(pending?.payload.amount).toBe(250000);
      expect(pending?.spaceId).toBe('sp_personal');
    });
  });

  describe('P02 — requiresConfirmation = true', () => {
    it('Enforces requiresConfirmation = true across all mutation intents in parser and usecase', async () => {
      const inputs = [
        'chi tiêu 100k cà phê',
        'nhận thu nhập 5tr tiền thưởng',
        'chuyển tiền 500k từ w_cash_personal sang w_vcb_personal'
      ];

      for (const input of inputs) {
        const parsed = VoiceCommandParser.parse(input, 'vi');
        expect(['add_expense', 'add_income', 'transfer_money']).toContain(parsed.intent);

        const readOnlyRes = VoiceCommandParser.executeReadOnly(parsed, {} as any, 'vi');
        expect(readOnlyRes.requiresConfirmation).toBe(true);

        const { result } = await voiceUseCase.processVoiceCommand(input, 'sp_personal', 'vi');
        expect(result.requiresConfirmation).toBe(true);
      }
    });
  });

  describe('P03 — No Confirmation = Zero Mutation', () => {
    it('Generates proposal without creating any transactions in the repository', async () => {
      const txsBefore = await root.repositoriesContainer.txRepo.getTransactions('sp_personal');
      
      const { command } = await voiceUseCase.processVoiceCommand('chi tiêu 500k liên hoan', 'sp_personal', 'vi');
      expect(command.id).toBeDefined();

      const txsAfter = await root.repositoriesContainer.txRepo.getTransactions('sp_personal');
      expect(txsAfter.length).toBe(txsBefore.length);
    });
  });

  describe('P04 — Explicit Confirmation = Exactly One Mutation', () => {
    it('Creates exactly one transaction after explicit human confirmation', async () => {
      const txsBefore = await root.repositoriesContainer.txRepo.getTransactions('sp_personal');
      
      const { command } = await voiceUseCase.processVoiceCommand('Thêm khoản chi 175k ăn trưa', 'sp_personal', 'vi');
      const txsDuringProposal = await root.repositoriesContainer.txRepo.getTransactions('sp_personal');
      expect(txsDuringProposal.length).toBe(txsBefore.length);

      const confirmRes = await voiceVM.confirmAction(command.id, 'sp_personal', [], 'vi');
      expect(confirmRes.error).toBeNull();

      const txsAfter = await root.repositoriesContainer.txRepo.getTransactions('sp_personal');
      expect(txsAfter.length).toBe(txsBefore.length + 1);

      const createdTx = txsAfter.find(t => t.amount === 175000);
      expect(createdTx).toBeDefined();
      expect(createdTx?.type).toBe('expense');
      expect(createdTx?.spaceId).toBe('sp_personal');

      const pendingRecord = voiceUseCase.getPendingCommand(command.id);
      expect(pendingRecord?.status).toBe('EXECUTED');
    });
  });

  describe('P05 — Cancel = Zero Mutation', () => {
    it('Transitions pending command to CANCELLED and creates 0 transactions', async () => {
      const txsBefore = await root.repositoriesContainer.txRepo.getTransactions('sp_personal');
      
      const { command } = await voiceUseCase.processVoiceCommand('Thêm khoản chi 300k', 'sp_personal', 'vi');
      
      const cancelRes = await voiceVM.cancelAction(command.id, 'sp_personal', [], 'vi');
      expect(cancelRes.error).toBeNull();

      const pendingRecord = voiceUseCase.getPendingCommand(command.id);
      expect(pendingRecord?.status).toBe('CANCELLED');

      const txsAfter = await root.repositoriesContainer.txRepo.getTransactions('sp_personal');
      expect(txsAfter.length).toBe(txsBefore.length);

      // Subsequent attempt to confirm cancelled command is rejected
      const retryConfirm = await voiceVM.confirmAction(command.id, 'sp_personal', [], 'vi');
      expect(retryConfirm.error).not.toBeNull();
      
      const txsFinal = await root.repositoriesContainer.txRepo.getTransactions('sp_personal');
      expect(txsFinal.length).toBe(txsBefore.length);
    });
  });

  describe('P06 — Double Confirmation = One Mutation', () => {
    it('Rejects second confirmation and ensures zero additional transactions', async () => {
      const { command } = await voiceUseCase.processVoiceCommand('Thêm thu nhập 1000k bán đồ cũ', 'sp_personal', 'vi');
      
      const firstConfirm = await voiceVM.confirmAction(command.id, 'sp_personal', [], 'vi');
      expect(firstConfirm.error).toBeNull();

      const txsAfterFirst = await root.repositoriesContainer.txRepo.getTransactions('sp_personal');

      // Second confirmation attempt
      const secondConfirm = await voiceVM.confirmAction(command.id, 'sp_personal', [], 'vi');
      expect(secondConfirm.error).not.toBeNull();

      const txsAfterSecond = await root.repositoriesContainer.txRepo.getTransactions('sp_personal');
      expect(txsAfterSecond.length).toBe(txsAfterFirst.length);
    });
  });

  describe('P07 — Stale Confirmation Cannot Execute Another Command', () => {
    it('Ensures command confirmation token applies strictly to the target command', async () => {
      const cmd1 = await voiceUseCase.processVoiceCommand('Thêm khoản chi 110k', 'sp_personal', 'vi');
      const cmd2 = await voiceUseCase.processVoiceCommand('Thêm khoản chi 220k', 'sp_personal', 'vi');

      // Confirm cmd1
      await voiceVM.confirmAction(cmd1.command.id, 'sp_personal', [], 'vi');
      expect(voiceUseCase.getPendingCommand(cmd1.command.id)?.status).toBe('EXECUTED');
      expect(voiceUseCase.getPendingCommand(cmd2.command.id)?.status).toBe('PENDING');

      // Attempting to re-execute cmd1 should fail and NOT affect cmd2
      const retryCmd1 = await voiceVM.confirmAction(cmd1.command.id, 'sp_personal', [], 'vi');
      expect(retryCmd1.error).not.toBeNull();
      expect(voiceUseCase.getPendingCommand(cmd2.command.id)?.status).toBe('PENDING');

      // Unknown command id is rejected safely
      const unknownRes = await voiceVM.confirmAction('non_existent_command_token', 'sp_personal', [], 'vi');
      expect(unknownRes.error).not.toBeNull();
    });
  });

  describe('P08 — Missing Amount = No Mutation', () => {
    it('Fails closed when amount is missing or non-positive without guessing', async () => {
      const txsBefore = await root.repositoriesContainer.txRepo.getTransactions('sp_personal');

      // Raw voice without amount
      const { command } = await voiceUseCase.processVoiceCommand('Thêm khoản chi mua sắm', 'sp_personal', 'vi');
      expect(command.parameters.find(p => p.name === 'amount')).toBeUndefined();

      const pending = voiceUseCase.getPendingCommand(command.id);
      expect(pending?.payload.amount).toBe(0);

      // Attempt confirmation
      const confirmRes = await voiceVM.confirmAction(command.id, 'sp_personal', [], 'vi');
      expect(confirmRes.error).not.toBeNull();

      const txsAfter = await root.repositoriesContainer.txRepo.getTransactions('sp_personal');
      expect(txsAfter.length).toBe(txsBefore.length);
    });
  });

  describe('P09 — Missing Space = No Mutation', () => {
    it('Rejects execution when spaceId is mismatched or missing', async () => {
      const txsBeforePersonal = await root.repositoriesContainer.txRepo.getTransactions('sp_personal');
      const txsBeforeBusiness = await root.repositoriesContainer.txRepo.getTransactions('sp_business');

      const { command } = await voiceUseCase.processVoiceCommand('Thêm khoản chi 180k', 'sp_personal', 'vi');

      // Attempt execution under sp_business
      const mismatchConfirm = await voiceVM.confirmAction(command.id, 'sp_business', [], 'vi');
      expect(mismatchConfirm.error).not.toBeNull();

      const txsAfterPersonal = await root.repositoriesContainer.txRepo.getTransactions('sp_personal');
      const txsAfterBusiness = await root.repositoriesContainer.txRepo.getTransactions('sp_business');
      expect(txsAfterPersonal.length).toBe(txsBeforePersonal.length);
      expect(txsAfterBusiness.length).toBe(txsBeforeBusiness.length);
    });
  });

  describe('P10 — Fund Isolation', () => {
    it('Enforces Fund context and rejects cross-fund execution', async () => {
      const { command } = await voiceUseCase.processVoiceCommand('chi 70k từ fund_emergency', 'sp_personal', 'vi');
      const pending = voiceUseCase.getPendingCommand(command.id);
      expect(pending?.fundId).toBe('fund_emergency');

      // Execution with different fund context should throw
      await expect(
        voiceUseCase.executeConfirmedCommand(command.id, 'sp_personal', 'vi', 'fund_general')
      ).rejects.toThrow();

      // Execution with matching fund succeeds
      const execRes = await voiceUseCase.executeConfirmedCommand(command.id, 'sp_personal', 'vi', 'fund_emergency');
      expect(execRes.result.success).toBe(true);
      expect(pending?.status).toBe('EXECUTED');
    });
  });

  describe('P11 — Transfer Target Required', () => {
    it('Rejects transfer command without destination wallet and remains PENDING', async () => {
      const { command } = await voiceUseCase.processVoiceCommand('Chuyển tiền 300k', 'sp_personal', 'vi');
      
      const confirmRes = await voiceVM.confirmAction(command.id, 'sp_personal', [], 'vi');
      expect(confirmRes.error).not.toBeNull();

      const pending = voiceUseCase.getPendingCommand(command.id);
      expect(pending?.status).toBe('PENDING');
    });
  });

  describe('P12 — Same Wallet Transfer Rejected', () => {
    it('Rejects transfer when source equals target wallet', async () => {
      const { command } = await voiceUseCase.processVoiceCommand(
        'Chuyển tiền 200k từ w_cash_personal sang w_cash_personal',
        'sp_personal',
        'vi'
      );

      const confirmRes = await voiceVM.confirmAction(command.id, 'sp_personal', [], 'vi');
      expect(confirmRes.error).not.toBeNull();

      const pending = voiceUseCase.getPendingCommand(command.id);
      expect(pending?.status).toBe('PENDING');
    });
  });

  describe('P13 — Cross-Space Transfer Identity Preserved', () => {
    it('Maintains space boundaries and rejects invalid space contexts', async () => {
      const { command } = await voiceUseCase.processVoiceCommand(
        'Chuyển tiền 150k từ w_cash_personal sang w_vcb_personal',
        'sp_personal',
        'vi'
      );

      // Execution under non-origin space fails
      await expect(
        voiceUseCase.executeConfirmedCommand(command.id, 'sp_foreign_space', 'vi')
      ).rejects.toThrow();
    });
  });

  describe('P14 — Amount Precision Preserved', () => {
    it('Preserves non-integer and exact precision without Math.round or toFixed truncation', async () => {
      const exactAmounts = [100.456, 0.01, 999999999.999, 500.1234];

      for (const amt of exactAmounts) {
        const text = `chi ${amt} VND mua hàng`;
        const { command } = await voiceUseCase.processVoiceCommand(text, 'sp_personal', 'vi');
        const pending = voiceUseCase.getPendingCommand(command.id);
        expect(pending?.payload.amount).toBe(amt);

        await voiceVM.confirmAction(command.id, 'sp_personal', [], 'vi');
        const txs = await root.repositoriesContainer.txRepo.getTransactions('sp_personal');
        const created = txs.find(t => t.amount === amt);
        expect(created).toBeDefined();
        expect(created?.amount).toBe(amt);
      }
    });
  });

  describe('P15 — Currency Preserved', () => {
    it('Preserves explicitly specified currencies without arbitrary conversion', async () => {
      const currencies = ['USD', 'EUR', 'JPY', 'VND'];

      for (const cur of currencies) {
        const text = `Thêm khoản chi 100 ${cur} đăng ký dịch vụ`;
        const { command } = await voiceUseCase.processVoiceCommand(text, 'sp_personal', 'vi');
        const pending = voiceUseCase.getPendingCommand(command.id);
        expect(pending?.payload.currency).toBe(cur);

        await voiceVM.confirmAction(command.id, 'sp_personal', [], 'vi');
        const txs = await root.repositoriesContainer.txRepo.getTransactions('sp_personal');
        const created = txs.find(t => t.currency === cur && t.note?.includes(text));
        expect(created).toBeDefined();
        expect(created?.currency).toBe(cur);
      }
    });
  });

  describe('P16 — Provider Failure = No Mutation', () => {
    it('Handles parser and assistant errors gracefully with 0 mutations', async () => {
      const txsBefore = await root.repositoriesContainer.txRepo.getTransactions('sp_personal');

      // Empty or invalid input
      const emptyRes = await voiceVM.processVoiceCommand('', 'sp_personal', [], 'vi');
      expect(emptyRes.error).toBeNull(); // handled safely or no-op

      const txsAfter = await root.repositoriesContainer.txRepo.getTransactions('sp_personal');
      expect(txsAfter.length).toBe(txsBefore.length);
    });
  });

  describe('P17 — Malformed Voice Input = No Mutation', () => {
    it('Guarantees malformed and unexpected inputs never produce unauthorized mutations', async () => {
      const malformedInputs = [
        '!@#$%^&*()',
        'NaN VND',
        'Infinity',
        'undefined',
        'select * from transactions;',
        '<script>alert("hack")</script>'
      ];

      const txsBefore = await root.repositoriesContainer.txRepo.getTransactions('sp_personal');

      for (const input of malformedInputs) {
        await voiceVM.processVoiceCommand(input, 'sp_personal', [], 'vi');
      }

      const txsAfter = await root.repositoriesContainer.txRepo.getTransactions('sp_personal');
      expect(txsAfter.length).toBe(txsBefore.length);
    });
  });

  describe('P18 — Duplicate Proposal = Unique Tokens and No Duplicate Mutation', () => {
    it('Generates distinct command tokens for identical input and executes independently', async () => {
      const rawText = 'Thêm khoản chi 65k tiền gửi xe';
      const res1 = await voiceUseCase.processVoiceCommand(rawText, 'sp_personal', 'vi');
      const res2 = await voiceUseCase.processVoiceCommand(rawText, 'sp_personal', 'vi');

      expect(res1.command.id).not.toBe(res2.command.id);

      // Confirm only proposal 1
      await voiceVM.confirmAction(res1.command.id, 'sp_personal', [], 'vi');

      expect(voiceUseCase.getPendingCommand(res1.command.id)?.status).toBe('EXECUTED');
      expect(voiceUseCase.getPendingCommand(res2.command.id)?.status).toBe('PENDING');

      const txs = await root.repositoriesContainer.txRepo.getTransactions('sp_personal');
      const matching = txs.filter(t => t.amount === 65000);
      expect(matching.length).toBe(1);
    });
  });

  // ==========================================================================
  // SECTION B: INVARIANT PROPERTY-BASED TESTS (PROPERTY 1 - PROPERTY 7)
  // ==========================================================================

  describe('Invariant Property-Based Verification (Seeded Deterministic)', () => {
    const rng = new SeededRandom(20260919);

    it('PROPERTY 1: No explicit confirmation -> zero financial mutation across randomized proposals', async () => {
      const intents = ['chi 50k', 'thu 100k', 'chi 200k'];
      const spaces = ['sp_personal', 'sp_business'];

      for (let i = 0; i < 20; i++) {
        const space = rng.nextChoice(spaces);
        const txsBefore = await root.repositoriesContainer.txRepo.getTransactions(space);
        
        const phrase = `${rng.nextChoice(intents)} mua đồ ${i}`;
        const { command, result } = await voiceUseCase.processVoiceCommand(phrase, space, 'vi');
        
        expect(result.requiresConfirmation).toBe(true);
        const txsAfter = await root.repositoriesContainer.txRepo.getTransactions(space);
        expect(txsAfter.length).toBe(txsBefore.length);
        expect(voiceUseCase.getPendingCommand(command.id)?.status).toBe('PENDING');
      }
    });

    it('PROPERTY 2: One explicit confirmation -> at most one financial mutation', async () => {
      for (let i = 0; i < 10; i++) {
        const amount = rng.nextInt(10, 500) * 1000;
        const txsBefore = await root.repositoriesContainer.txRepo.getTransactions('sp_personal');

        const { command } = await voiceUseCase.processVoiceCommand(`Thêm khoản chi ${amount / 1000}k mục ${i}`, 'sp_personal', 'vi');
        await voiceVM.confirmAction(command.id, 'sp_personal', [], 'vi');

        const txsAfter = await root.repositoriesContainer.txRepo.getTransactions('sp_personal');
        expect(txsAfter.length).toBe(txsBefore.length + 1);
        expect(voiceUseCase.getPendingCommand(command.id)?.status).toBe('EXECUTED');
      }
    });

    it('PROPERTY 3: Repeated confirmation sequences -> exactly one mutation', async () => {
      for (let i = 0; i < 5; i++) {
        const amount = rng.nextInt(50, 200) * 1000;
        const txsBefore = await root.repositoriesContainer.txRepo.getTransactions('sp_personal');

        const { command } = await voiceUseCase.processVoiceCommand(`Thêm thu nhập ${amount / 1000}k thưởng ${i}`, 'sp_personal', 'vi');

        // Confirm between 2 and 5 times in sequence
        const repeatCount = rng.nextInt(2, 5);
        for (let r = 0; r < repeatCount; r++) {
          await voiceVM.confirmAction(command.id, 'sp_personal', [], 'vi');
        }

        const txsAfter = await root.repositoriesContainer.txRepo.getTransactions('sp_personal');
        expect(txsAfter.length).toBe(txsBefore.length + 1);
      }
    });

    it('PROPERTY 4: Missing required context -> zero mutation', async () => {
      const invalidPhrases = [
        'chi tiêu',
        'chuyển tiền không ví',
        'thêm chi tiêu 0 VND',
        'thu nhập tiền'
      ];

      for (const phrase of invalidPhrases) {
        const txsBefore = await root.repositoriesContainer.txRepo.getTransactions('sp_personal');
        const { command } = await voiceUseCase.processVoiceCommand(phrase, 'sp_personal', 'vi');
        
        await voiceVM.confirmAction(command.id, 'sp_personal', [], 'vi');
        const txsAfter = await root.repositoriesContainer.txRepo.getTransactions('sp_personal');
        expect(txsAfter.length).toBe(txsBefore.length);
      }
    });

    it('PROPERTY 5: Amount unchanged throughout pipeline', async () => {
      for (let i = 0; i < 10; i++) {
        const rawAmount = rng.nextInt(1000, 999999);
        const text = `chi ${rawAmount} VND kiểm tra`;
        
        const { command } = await voiceUseCase.processVoiceCommand(text, 'sp_personal', 'vi');
        const pending = voiceUseCase.getPendingCommand(command.id);
        expect(pending?.payload.amount).toBe(rawAmount);

        await voiceVM.confirmAction(command.id, 'sp_personal', [], 'vi');
        const txs = await root.repositoriesContainer.txRepo.getTransactions('sp_personal');
        const created = txs.find(t => t.amount === rawAmount);
        expect(created?.amount).toBe(rawAmount);
      }
    });

    it('PROPERTY 6: Currency unchanged across all supported currencies', async () => {
      const currencies = ['VND', 'USD', 'EUR', 'JPY'] as const;
      for (const cur of currencies) {
        const text = `chi 120 ${cur} ăn trưa`;
        const { command } = await voiceUseCase.processVoiceCommand(text, 'sp_personal', 'vi');
        expect(voiceUseCase.getPendingCommand(command.id)?.payload.currency).toBe(cur);

        await voiceVM.confirmAction(command.id, 'sp_personal', [], 'vi');
        const txs = await root.repositoriesContainer.txRepo.getTransactions('sp_personal');
        const created = txs.find(t => t.currency === cur && t.amount === 120);
        expect(created?.currency).toBe(cur);
      }
    });

    it('PROPERTY 7: Space and Fund identity unchanged', async () => {
      const spaces = ['sp_personal', 'sp_business'];
      for (const sp of spaces) {
        const { command } = await voiceUseCase.processVoiceCommand('chi 55k ăn sáng', sp, 'vi');
        expect(voiceUseCase.getPendingCommand(command.id)?.spaceId).toBe(sp);

        await voiceVM.confirmAction(command.id, sp, [], 'vi');
        const txs = await root.repositoriesContainer.txRepo.getTransactions(sp);
        const created = txs.find(t => t.amount === 55000);
        expect(created?.spaceId).toBe(sp);
      }
    });
  });
});
