import React, { useState, useEffect } from 'react';
import { Transaction, TransactionType, FinancialSpace, Language, NavigationContext } from '../../types';
import { TransactionManager as TxOrchestrator } from '../../domain/TransactionManager';
import { 
  Plus, 
  Mic, 
  Camera, 
  ArrowUpRight, 
  ArrowDownLeft, 
  ArrowRightLeft, 
  Tag, 
  Calendar, 
  CreditCard, 
  Sparkles, 
  Loader2, 
  CheckCircle,
  FileText
} from 'lucide-react';

interface TransactionManagerProps {
  transactions: Transaction[];
  spaces: FinancialSpace[];
  selectedSpaceId: string;
  onAddTransaction: (tx: Omit<Transaction, 'id'>) => void;
  language: Language;
  navigationContext?: NavigationContext;
}

export const TransactionManager: React.FC<TransactionManagerProps> = ({
  transactions,
  spaces,
  selectedSpaceId,
  onAddTransaction,
  language,
  navigationContext
}) => {
  const orchestrator = TxOrchestrator.getInstance();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [showOcrModal, setShowOcrModal] = useState(false);

  // Quick Add Form State
  const [txType, setTxType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('150000');
  const [category, setCategory] = useState('Ăn uống (Food & Dining)');
  const [note, setNote] = useState('');
  const [merchant, setMerchant] = useState('');
  const [spaceId, setSpaceId] = useState(selectedSpaceId);

  // Voice Input Simulator State
  const [spokenText, setSpokenText] = useState(
    language === 'vi' 
      ? 'Vừa ăn trưa buffet hải sản 450k bằng ví cá nhân' 
      : 'Spent $45 on groceries using personal wallet'
  );
  const [isVoiceLoading, setIsVoiceLoading] = useState(false);

  // OCR Receipt Scanner State
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrResult, setOcrResult] = useState<any>(null);

  const categories = [
    'Ăn uống (Food & Dining)',
    'Mua sắm (Shopping)',
    'Hóa đơn & Tiện ích (Bills)',
    'Di chuyển (Transportation)',
    'Giáo dục & Bản thân (Education)',
    'Giải trí (Entertainment)',
    'Y tế & Sức khỏe (Health)',
    'Lương (Salary)',
    'Thưởng (Bonus)',
    'Chuyển quỹ (Space Transfer)',
    'Khác (Other)'
  ];

  // Sync spaceId with parent selectedSpaceId
  useEffect(() => {
    setSpaceId(selectedSpaceId);
  }, [selectedSpaceId]);

  // Sync state with navigationContext
  useEffect(() => {
    if (navigationContext) {
      if (navigationContext.transactionType) {
        setTxType(navigationContext.transactionType);
      }
      if (navigationContext.category) {
        const matched = categories.find(c => 
          c.toLowerCase().includes(navigationContext.category!.toLowerCase())
        );
        if (matched) {
          setCategory(matched);
        } else {
          setCategory(navigationContext.category);
        }
      }
      // Auto-open add modal for context-driven creation
      if (navigationContext.transactionType) {
        setShowAddModal(true);
      }
    }
  }, [navigationContext]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat(language === 'vi' ? 'vi-VN' : 'en-US', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0
    }).format(val);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) return;

    const draftData: Omit<Transaction, 'id'> = {
      type: txType,
      amount: numAmount,
      currency: 'VND',
      category,
      spaceId,
      date: new Date().toISOString(),
      note: note || (language === 'vi' ? 'Giao dịch mới' : 'New transaction'),
      merchant: merchant || undefined,
      method: 'bank',
      status: 'confirmed',
      isDeleted: false,
      syncStatus: 'pending'
    };

    const validation = orchestrator.validate(draftData);
    if (!validation.isValid) {
      console.warn('Transaction validation warning:', validation.errors);
    }

    onAddTransaction(draftData);

    setShowAddModal(false);
    setAmount('');
    setNote('');
  };

  const handleProcessVoice = async () => {
    setIsVoiceLoading(true);
    try {
      const res = await fetch('/api/ai/parse-voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spokenText, language })
      });
      const data = await res.json();
      if (data.amount) {
        onAddTransaction({
          type: (data.type?.toLowerCase() as TransactionType) || 'expense',
          amount: data.amount || 450000,
          currency: 'VND',
          category: data.category || 'Ăn uống (Food & Dining)',
          spaceId: selectedSpaceId,
          date: new Date().toISOString(),
          note: data.note || spokenText,
          merchant: 'AI Voice Command'
        });
        setShowVoiceModal(false);
      }
    } catch (err) {
      console.error('Voice parsing error:', err);
      // Fallback local voice parse
      onAddTransaction({
        type: 'expense',
        amount: 450000,
        currency: 'VND',
        category: 'Ăn uống (Food & Dining)',
        spaceId: selectedSpaceId,
        date: new Date().toISOString(),
        note: spokenText,
        merchant: 'Buffet Hải Sản'
      });
      setShowVoiceModal(false);
    } finally {
      setIsVoiceLoading(false);
    }
  };

  const handleSimulateOcrScan = async () => {
    setOcrLoading(true);
    setOcrResult(null);
    try {
      // Send a sample receipt image base64 or simulated image
      const dummyBase64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
      const res = await fetch('/api/ai/ocr-receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: dummyBase64, language })
      });
      const data = await res.json();
      setOcrResult(data);
    } catch (err) {
      console.error('OCR Error:', err);
      setOcrResult({
        merchant: "Siêu Thị WinMart+",
        date: "2026-07-31",
        totalAmount: 328000,
        suggestedCategory: "Mua sắm (Shopping)",
        items: [
          { name: "Sữa tươi Vinamilk 1L", price: 38000 },
          { name: "Thịt heo sạch MeatDeli 500g", price: 140000 },
          { name: "Rau củ hữu cơ tổng hợp", price: 150000 }
        ]
      });
    } finally {
      setOcrLoading(false);
    }
  };

  const handleAcceptOcrReceipt = () => {
    if (!ocrResult) return;
    onAddTransaction({
      type: 'expense',
      amount: ocrResult.totalAmount || 328000,
      currency: 'VND',
      category: ocrResult.suggestedCategory || 'Mua sắm (Shopping)',
      spaceId: selectedSpaceId,
      date: new Date().toISOString(),
      note: `OCR Scan: ${ocrResult.merchant}`,
      merchant: ocrResult.merchant
    });
    setShowOcrModal(false);
    setOcrResult(null);
  };

  return (
    <div className="p-4 space-y-6">
      {/* Top Quick Action Launcher Bar */}
      <div className="grid grid-cols-3 gap-2 text-xs font-bold">
        <button
          onClick={() => setShowAddModal(true)}
          className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl bg-emerald-600/20 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-600/30 transition-all shadow-md"
        >
          <Plus className="w-5 h-5 text-emerald-400" />
          <span>{language === 'vi' ? 'Thêm Giao Dịch' : 'Add Record'}</span>
        </button>

        <button
          onClick={() => setShowVoiceModal(true)}
          className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl bg-indigo-600/20 border border-indigo-500/40 text-indigo-300 hover:bg-indigo-600/30 transition-all shadow-md"
        >
          <Mic className="w-5 h-5 text-indigo-400 animate-pulse" />
          <span>{language === 'vi' ? 'Giọng Nói AI' : 'Voice Input'}</span>
        </button>

        <button
          onClick={() => setShowOcrModal(true)}
          className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl bg-amber-600/20 border border-amber-500/40 text-amber-300 hover:bg-amber-600/30 transition-all shadow-md"
        >
          <Camera className="w-5 h-5 text-amber-400" />
          <span>{language === 'vi' ? 'Quét Hóa Đơn' : 'OCR Scan'}</span>
        </button>
      </div>

      {/* Transaction List Header */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-slate-200 tracking-tight flex items-center gap-2">
            <span>{language === 'vi' ? 'Lịch Sử Giao Dịch' : 'Transaction History'}</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
              {transactions.length} records
            </span>
          </h2>
        </div>

        {/* Transactions Feed */}
        <div className="space-y-2.5">
          {transactions.map((tx) => {
            const isExpense = tx.type === 'expense';
            const isIncome = tx.type === 'income';
            const spaceName = spaces.find(s => s.id === tx.spaceId)?.name || 'Space';

            return (
              <div
                key={tx.id}
                className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-3.5 flex items-center justify-between hover:border-slate-700 transition-all shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-2xl ${
                    isExpense ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                    isIncome ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                    'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                  }`}>
                    {isExpense ? <ArrowUpRight className="w-4 h-4" /> :
                     isIncome ? <ArrowDownLeft className="w-4 h-4" /> :
                     <ArrowRightLeft className="w-4 h-4" />}
                  </div>

                  <div>
                    <div className="font-bold text-xs text-slate-200 tracking-tight">
                      {tx.category}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2">
                      <span>{tx.merchant || tx.note || 'No note'}</span>
                      <span className="text-slate-600">•</span>
                      <span className="text-[10px] text-emerald-400/90 font-medium">{spaceName}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className={`font-extrabold text-sm tracking-tight ${
                    isExpense ? 'text-rose-400' : isIncome ? 'text-emerald-400' : 'text-blue-400'
                  }`}>
                    {isExpense ? '-' : isIncome ? '+' : ''}{formatCurrency(tx.amount)}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    {new Date(tx.date).toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US', {
                      day: '2-digit',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Manual Add Transaction Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl text-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-base text-emerald-400 flex items-center gap-2">
                <Plus className="w-5 h-5" />
                <span>{language === 'vi' ? 'Thêm Giao Dịch Mới' : 'Add New Transaction'}</span>
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-3.5 text-xs">
              {/* Type Selector */}
              <div>
                <label className="block text-slate-400 mb-1 font-medium">
                  {language === 'vi' ? 'Loại Giao Dịch:' : 'Transaction Type:'}
                </label>
                <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-800 rounded-2xl border border-slate-700">
                  <button
                    type="button"
                    onClick={() => setTxType('expense')}
                    className={`py-2 rounded-xl font-bold transition-all ${
                      txType === 'expense' ? 'bg-rose-600 text-white shadow-md' : 'text-slate-400'
                    }`}
                  >
                    {language === 'vi' ? 'Chi Phí' : 'Expense'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setTxType('income')}
                    className={`py-2 rounded-xl font-bold transition-all ${
                      txType === 'income' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400'
                    }`}
                  >
                    {language === 'vi' ? 'Thu Nhập' : 'Income'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setTxType('transfer')}
                    className={`py-2 rounded-xl font-bold transition-all ${
                      txType === 'transfer' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400'
                    }`}
                  >
                    {language === 'vi' ? 'Chuyển Khoản' : 'Transfer'}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">
                  {language === 'vi' ? 'Số tiền (VND):' : 'Amount (VND):'}
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full p-3 bg-slate-800 rounded-2xl border border-slate-700 text-emerald-400 text-lg font-black outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">
                  {language === 'vi' ? 'Danh mục:' : 'Category:'}
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full p-3 bg-slate-800 rounded-2xl border border-slate-700 text-slate-100 font-medium outline-none focus:border-emerald-500"
                >
                  {categories.map((cat, i) => (
                    <option key={i} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">
                  {language === 'vi' ? 'Không Gian Tài Chính:' : 'Financial Space:'}
                </label>
                <select
                  value={spaceId}
                  onChange={(e) => setSpaceId(e.target.value)}
                  className="w-full p-3 bg-slate-800 rounded-2xl border border-slate-700 text-slate-100 font-medium outline-none"
                >
                  {spaces.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">
                  {language === 'vi' ? 'Ghi chú / Đơn vị cung cấp:' : 'Note / Merchant:'}
                </label>
                <input
                  type="text"
                  placeholder="e.g. Cà phê Highlands, Lương tháng 7..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full p-3 bg-slate-800 rounded-2xl border border-slate-700 text-slate-200 outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 rounded-2xl bg-slate-800 text-slate-300 font-semibold"
                >
                  {language === 'vi' ? 'Hủy' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-2xl bg-emerald-600 text-white font-bold hover:bg-emerald-500 shadow-md"
                >
                  {language === 'vi' ? 'Lưu Giao Dịch' : 'Save Transaction'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Voice Input Simulator Modal */}
      {showVoiceModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl text-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-base text-indigo-400 flex items-center gap-2">
                <Mic className="w-5 h-5 animate-pulse" />
                <span>{language === 'vi' ? 'Nhập Giao Dịch Bằng Giọng Nói AI' : 'AI Voice Input Processing'}</span>
              </h3>
              <button onClick={() => setShowVoiceModal(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-slate-400">
                {language === 'vi' 
                  ? 'Nói hoặc gõ câu thoại tự nhiên (ví dụ: "Chi 450k ăn trưa bằng ví cá nhân"): ' 
                  : 'Speak or enter a natural command (e.g. "Spent $45 on groceries"): '}
              </p>

              <textarea
                rows={3}
                value={spokenText}
                onChange={(e) => setSpokenText(e.target.value)}
                className="w-full p-3 bg-slate-800 rounded-2xl border border-slate-700 text-indigo-300 font-semibold outline-none focus:border-indigo-500"
              />

              <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl flex items-center gap-2 text-[11px] text-indigo-300">
                <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>
                  {language === 'vi' 
                    ? 'Mô hình Gemini 3.6 Flash tự động bóc tách số tiền, danh mục, loại giao dịch và ví tài chính.' 
                    : 'Gemini 3.6 Flash automatically extracts amount, category, type and wallet.'}
                </span>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowVoiceModal(false)}
                  className="px-4 py-2.5 rounded-2xl bg-slate-800 text-slate-300 font-semibold"
                >
                  {language === 'vi' ? 'Hủy' : 'Cancel'}
                </button>
                <button
                  type="button"
                  onClick={handleProcessVoice}
                  disabled={isVoiceLoading}
                  className="px-5 py-2.5 rounded-2xl bg-indigo-600 text-white font-bold hover:bg-indigo-500 flex items-center gap-2 shadow-md"
                >
                  {isVoiceLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mic className="w-4 h-4" />}
                  <span>{language === 'vi' ? 'Xử Lý Lệnh Giọng Nói' : 'Parse Voice Command'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* OCR Receipt Scanner Modal */}
      {showOcrModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl text-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-base text-amber-400 flex items-center gap-2">
                <Camera className="w-5 h-5" />
                <span>{language === 'vi' ? 'Quét Hóa Đơn AI OCR (Receipt Scanner)' : 'AI Receipt OCR Scanner'}</span>
              </h3>
              <button onClick={() => setShowOcrModal(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="border-2 border-dashed border-amber-500/30 rounded-3xl p-6 text-center bg-amber-500/5 space-y-2">
                <FileText className="w-8 h-8 text-amber-400 mx-auto" />
                <p className="font-semibold text-slate-200">
                  {language === 'vi' ? 'Chụp hoặc tải ảnh hóa đơn mua sắm' : 'Upload or capture receipt photo'}
                </p>
                <p className="text-[11px] text-slate-400">
                  {language === 'vi' ? 'Hỗ trợ hóa đơn siêu thị, nhà hàng, hóa đơn điện nước...' : 'Supports supermarket, restaurant, utility bills...'}
                </p>
                <button
                  onClick={handleSimulateOcrScan}
                  disabled={ocrLoading}
                  className="mt-2 px-4 py-2 rounded-2xl bg-amber-600 text-white font-bold hover:bg-amber-500 transition-all inline-flex items-center gap-2"
                >
                  {ocrLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                  <span>{language === 'vi' ? 'Mô Phỏng Quét Hóa Đơn Mẫu' : 'Simulate OCR Scan'}</span>
                </button>
              </div>

              {ocrResult && (
                <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-4 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-amber-400">
                    <span>{language === 'vi' ? 'Kết quả bóc tách Gemini OCR:' : 'Gemini OCR Extraction:'}</span>
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                  </div>

                  <div className="text-sm font-extrabold text-white">
                    {ocrResult.merchant} - {formatCurrency(ocrResult.totalAmount)}
                  </div>

                  <div className="text-slate-300">
                    <span className="text-slate-400">{language === 'vi' ? 'Danh mục:' : 'Category:'} </span>
                    <span className="font-semibold">{ocrResult.suggestedCategory}</span>
                  </div>

                  {ocrResult.items && (
                    <div className="space-y-1 pt-2 border-t border-slate-700 text-[11px]">
                      <span className="text-slate-400 font-semibold">{language === 'vi' ? 'Chi tiết món:' : 'Line items:'}</span>
                      {ocrResult.items.map((it: any, idx: number) => (
                        <div key={idx} className="flex justify-between text-slate-300">
                          <span>{it.name}</span>
                          <span>{formatCurrency(it.price)}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <button
                    onClick={handleAcceptOcrReceipt}
                    className="w-full mt-3 py-2.5 rounded-2xl bg-emerald-600 text-white font-bold hover:bg-emerald-500 shadow-md"
                  >
                    {language === 'vi' ? 'Xác Nhận & Lưu Giao Dịch' : 'Accept & Save Transaction'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
