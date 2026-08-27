import { FinancialSpace, Transaction, Budget, SavingsGoal, CreditCard, DebtItem, Installment, SixJar, FireConfig, FeatureModulesState } from '../types';

export const INITIAL_SPACES: FinancialSpace[] = [
  {
    id: 'sp_personal',
    name: 'Ví Cá Nhân (Personal)',
    type: 'personal',
    balance: 48500000,
    currency: 'VND',
    cardColor: 'from-blue-600 via-indigo-600 to-slate-900',
    iconName: 'User',
    ownerName: 'Nguyễn Văn Hùng',
    membersCount: 1,
    isPrimary: true,
  },
  {
    id: 'sp_family',
    name: 'Quỹ Gia Đình (Family)',
    type: 'family',
    balance: 125000000,
    currency: 'VND',
    cardColor: 'from-emerald-600 via-teal-600 to-stone-900',
    iconName: 'Home',
    ownerName: 'Hùng & Trang',
    membersCount: 4,
  },
  {
    id: 'sp_company',
    name: 'Công Ty Startup (Company)',
    type: 'company',
    balance: 350000000,
    currency: 'VND',
    cardColor: 'from-amber-600 via-orange-600 to-zinc-900',
    iconName: 'Briefcase',
    ownerName: 'TechVision Co.',
    membersCount: 8,
  },
  {
    id: 'sp_class',
    name: 'Quỹ Lớp K58 (Class Fund)',
    type: 'class',
    balance: 8200000,
    currency: 'VND',
    cardColor: 'from-purple-600 via-pink-600 to-neutral-900',
    iconName: 'GraduationCap',
    ownerName: 'Ban Cán Sự',
    membersCount: 35,
  }
];

export const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: 'tx_1',
    type: 'expense',
    amount: 1450000,
    currency: 'VND',
    category: 'Ăn uống (Food & Dining)',
    spaceId: 'sp_personal',
    date: '2026-07-30T19:30:00',
    note: 'Bữa tối họp mặt gia đình tại King BBQ',
    merchant: 'King BBQ Vincom',
    method: 'credit_card',
    tags: ['Family', 'DiningOut']
  },
  {
    id: 'tx_2',
    type: 'income',
    amount: 38000000,
    currency: 'VND',
    category: 'Lương (Salary)',
    spaceId: 'sp_personal',
    date: '2026-07-28T09:00:00',
    note: 'Thanh toán lương tháng 7/2026',
    merchant: 'Công ty TechVision',
    method: 'bank',
    tags: ['PrimaryIncome']
  },
  {
    id: 'tx_3',
    type: 'transfer',
    amount: 10000000,
    currency: 'VND',
    category: 'Chuyển quỹ (Space Transfer)',
    spaceId: 'sp_personal',
    targetSpaceId: 'sp_family',
    date: '2026-07-28T10:15:00',
    note: 'Đóng góp sinh hoạt phí gia đình hàng tháng',
    method: 'bank'
  },
  {
    id: 'tx_4',
    type: 'expense',
    amount: 2850000,
    currency: 'VND',
    category: 'Mua sắm (Shopping)',
    spaceId: 'sp_family',
    date: '2026-07-27T15:45:00',
    note: 'Mua thực phẩm tuần & vật dụng gia đình tại Co.opmart',
    merchant: 'Co.opmart Hà Nội',
    method: 'e_wallet',
    tags: ['Groceries']
  },
  {
    id: 'tx_5',
    type: 'expense',
    amount: 6500000,
    currency: 'VND',
    category: 'Đầu tư (Investment)',
    spaceId: 'sp_personal',
    date: '2026-07-25T14:00:00',
    note: 'Tích lũy chứng chỉ quỹ VN30 định kỳ',
    merchant: 'Dragon Capital ETF',
    method: 'bank',
    tags: ['FFA', 'Invest']
  },
  {
    id: 'tx_6',
    type: 'income',
    amount: 5000000,
    currency: 'VND',
    category: 'Thưởng (Bonus & Side Hustle)',
    spaceId: 'sp_personal',
    date: '2026-07-20T16:20:00',
    note: 'Dự án Freelance UI/UX Mobile App',
    merchant: 'Upwork Client',
    method: 'bank',
    tags: ['SideIncome']
  }
];

export const INITIAL_BUDGETS: Budget[] = [
  {
    id: 'b_food',
    category: 'Ăn uống (Food & Dining)',
    allocatedAmount: 8000000,
    spentAmount: 5450000,
    currency: 'VND',
    period: 'monthly',
    warningThreshold: 0.8
  },
  {
    id: 'b_shopping',
    category: 'Mua sắm (Shopping)',
    allocatedAmount: 5000000,
    spentAmount: 4200000,
    currency: 'VND',
    period: 'monthly',
    warningThreshold: 0.8
  },
  {
    id: 'b_utilities',
    category: 'Hóa đơn & Tiện ích (Bills & Utilities)',
    allocatedAmount: 4000000,
    spentAmount: 2800000,
    currency: 'VND',
    period: 'monthly',
    warningThreshold: 0.85
  },
  {
    id: 'b_edu',
    category: 'Giáo dục & Phát triển (Education)',
    allocatedAmount: 3500000,
    spentAmount: 1200000,
    currency: 'VND',
    period: 'monthly',
    warningThreshold: 0.8
  }
];

export const INITIAL_SAVINGS_GOALS: SavingsGoal[] = [
  {
    id: 'sg_emergency',
    title: 'Quỹ Khẩn Cấp (Emergency Fund - 6 Months)',
    targetAmount: 120000000,
    currentAmount: 95000000,
    deadline: '2026-12-31',
    category: 'emergency',
    icon: 'ShieldCheck'
  },
  {
    id: 'sg_house',
    title: 'Tiền Đặt Cọc Mua Căn Hộ (House Deposit)',
    targetAmount: 500000000,
    currentAmount: 280000000,
    deadline: '2027-06-30',
    category: 'house',
    icon: 'Building'
  },
  {
    id: 'sg_travel',
    title: 'Du Lịch Nhật Bản Mùa Thu (Japan Trip)',
    targetAmount: 65000000,
    currentAmount: 42000000,
    deadline: '2026-10-15',
    category: 'travel',
    icon: 'Plane'
  }
];

export const INITIAL_CREDIT_CARDS: CreditCard[] = [
  {
    id: 'cc_techcombank',
    cardName: 'Techcombank Signature Visa',
    bankName: 'Techcombank',
    creditLimit: 100000000,
    currentBalance: 24500000,
    statementDate: 20,
    dueDate: 5,
    cashbackPercent: 2.5,
    cardColor: 'from-red-600 via-rose-700 to-black'
  },
  {
    id: 'cc_hsbc',
    cardName: 'HSBC Live+ Platinum Cash Back',
    bankName: 'HSBC Vietnam',
    creditLimit: 80000000,
    currentBalance: 12000000,
    statementDate: 15,
    dueDate: 30,
    cashbackPercent: 8.0,
    cardColor: 'from-slate-800 via-zinc-900 to-red-900'
  }
];

export const INITIAL_DEBTS: DebtItem[] = [
  {
    id: 'd_car_loan',
    title: 'Vay Mua Xe Ô Tô (Car Loan)',
    type: 'debt',
    originalAmount: 400000000,
    remainingAmount: 180000000,
    interestRate: 8.5,
    minimumMonthlyPayment: 7200000,
    counterparty: 'Ngân hàng VIB',
    dueDate: '2027-08-15'
  },
  {
    id: 'd_personal_borrow',
    title: 'Nợ Thẻ Tín Dụng Lãi Cao (High Interest Card)',
    type: 'debt',
    originalAmount: 35000000,
    remainingAmount: 24500000,
    interestRate: 22.0,
    minimumMonthlyPayment: 2500000,
    counterparty: 'Techcombank Credit Card',
    dueDate: '2026-08-05'
  },
  {
    id: 'd_lent_friend',
    title: 'Cho Bạn Nam Vay Mua Laptop (Loaned to Friend)',
    type: 'loan',
    originalAmount: 15000000,
    remainingAmount: 10000000,
    interestRate: 0,
    minimumMonthlyPayment: 2000000,
    counterparty: 'Trần Văn Nam',
    dueDate: '2026-09-30'
  }
];

export const INITIAL_INSTALLMENTS: Installment[] = [
  {
    id: 'ins_macbook',
    itemTitle: 'MacBook Pro M3 Max 16 inch (0% Interest)',
    totalAmount: 64900000,
    monthlyAmount: 5408333,
    paidMonths: 7,
    totalMonths: 12,
    nextDueDate: '2026-08-10',
    creditCardId: 'cc_techcombank'
  },
  {
    id: 'ins_iphone',
    itemTitle: 'iPhone 15 Pro Max 256GB',
    totalAmount: 34000000,
    monthlyAmount: 2833333,
    paidMonths: 10,
    totalMonths: 12,
    nextDueDate: '2026-08-15',
    creditCardId: 'cc_hsbc'
  }
];

export const INITIAL_SIX_JARS: SixJar[] = [
  {
    id: 'jar_nec',
    key: 'NEC',
    nameVi: 'Thiết Yếu (Necessities)',
    nameEn: 'Necessities',
    percent: 55,
    currentBalance: 21175000,
    color: '#3B82F6', // Blue
    descriptionVi: 'Ăn uống, thuê nhà, hóa đơn, y tế, di chuyển bắt buộc.',
    descriptionEn: 'Rent, food, utilities, health, essential transport.'
  },
  {
    id: 'jar_ffa',
    key: 'FFA',
    nameVi: 'Tự Do Tài Chính (Financial Freedom)',
    nameEn: 'Financial Freedom',
    percent: 10,
    currentBalance: 3850000,
    color: '#10B981', // Emerald
    descriptionVi: 'Đầu tư cổ phiếu, quỹ mở, bất động sản sinh lời, không tiêu rút.',
    descriptionEn: 'Investments, stocks, real estate, cashflow generating assets.'
  },
  {
    id: 'jar_ltss',
    key: 'LTSS',
    nameVi: 'Tiết Kiệm Dài Hạn (Long-term Savings)',
    nameEn: 'Long-term Savings',
    percent: 10,
    currentBalance: 3850000,
    color: '#F59E0B', // Amber
    descriptionVi: 'Mua nhà, mua xe, ứng phó rủi ro lớn, dự phòng tương lai.',
    descriptionEn: 'House deposit, car purchase, future large purchases.'
  },
  {
    id: 'jar_edu',
    key: 'EDU',
    nameVi: 'Giáo Dục & Bản Thân (Education)',
    nameEn: 'Education',
    percent: 10,
    currentBalance: 3850000,
    color: '#8B5CF6', // Purple
    descriptionVi: 'Sách, khóa học, hội thảo, chứng chỉ chuyên môn.',
    descriptionEn: 'Books, courses, workshops, career growth certifications.'
  },
  {
    id: 'jar_play',
    key: 'PLAY',
    nameVi: 'Hưởng Thụ (Play / Reward)',
    nameEn: 'Play',
    percent: 10,
    currentBalance: 3850000,
    color: '#EC4899', // Pink
    descriptionVi: 'Thư giãn, du lịch, nhà hàng sang trọng, nuông chiều bản thân.',
    descriptionEn: 'Entertainment, luxury dining, hobbies, guilt-free reward.'
  },
  {
    id: 'jar_give',
    key: 'GIVE',
    nameVi: 'Cho Đi (Give / Charity)',
    nameEn: 'Give',
    percent: 5,
    currentBalance: 1925000,
    color: '#14B8A6', // Teal
    descriptionVi: 'Biếu bố mẹ, từ thiện, quà tặng bạn bè, giúp đỡ cộng đồng.',
    descriptionEn: 'Family support, charity, gifts, community help.'
  }
];

export const INITIAL_FIRE_CONFIG: FireConfig = {
  currentAge: 31,
  targetRetirementAge: 45,
  currentNetWorth: 528500000,
  monthlyExpense: 22000000,
  expectedAnnualReturn: 8.5,
  safeWithdrawalRate: 4.0,
  inflationRate: 3.2
};

export const DEFAULT_FEATURE_MODULES: FeatureModulesState = {
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
  googleDriveBackup: true,
  // D2-003S5 Financial Methods Suite
  advancedJarUI: true,
  advancedFireUI: true,
  fiftyThirtyTwentyUI: true,
  ruleOf72UI: true,
  advancedDebtUI: true,
  zeroBasedBudgetUI: true,
  sinkingFundUI: true,
  payYourselfFirstUI: true,
  fiftyTwoWeekUI: true,
  dcaUI: true
};

export const UI_STRINGS = {
  vi: {
    appName: 'Daily Finance 2.0',
    tagline: 'Quản Lý Tài Chính Cá Nhân & Gia Đình Thế Hệ Mới',
    prototypeTab: 'Mô Phỏng Ứng Dụng Android (Prototype)',
    blueprintTab: 'Tài Liệu Thiết Kế & Kiến Trúc (Blueprint)',
    selectViewport: 'Màn hình thiết bị:',
    phoneView: 'Điện Thoại (Phone)',
    foldableView: 'Màn Hình Gập (Foldable)',
    tabletView: 'Máy Tính Bảng (Tablet)',
    selectTheme: 'Triết lý giao diện:',
    m3Theme: 'Material 3 Expressive',
    appleTheme: 'Apple Wallet Style',
    googleTheme: 'Google Wallet Style',
    spacesTitle: 'Không Gian Tài Chính (Financial Spaces)',
    transferBetweenSpaces: 'Chuyển Quỹ / Space Transfer',
    totalBalance: 'Tổng Tài Sản Thực Có',
    netWorth: 'Giá Trị Tài Sản Ròng (Net Worth)',
    monthlyCashflow: 'Dòng Tiền Tháng Này',
    income: 'Thu Nhập',
    expense: 'Chi Phí',
    transfer: 'Chuyển Khoản',
    initialBalance: 'Số Dư Ban Đầu',
    quickAdd: 'Thêm Giao Dịch Nhanh',
    voiceInputBtn: 'Nhập Bằng Giọng Nói AI',
    ocrScanBtn: 'Quét Hóa Đơn OCR',
    aiCoachTitle: 'Cố Vấn Tài Chính AI Gemini',
    getAiAdvice: 'Phân Tích Dòng Tiền Vài Giây',
    sixJarsTitle: 'Phương Pháp 6 Hũ Tài Chính (Six Jars)',
    envelopeTitle: 'Ngân Sách Phong Bì (Envelope)',
    kakeiboTitle: 'Sổ Sách Kakeibo Nhật Bản',
    fireTitle: 'Độc Lập Tài Chính FIRE & Khẩn Cấp',
    debtStrategyTitle: 'Chiến Lược Trả Nợ: Snowball vs Avalanche',
    snowballMethod: 'Tuyết Lăn (Snowball - Ưu tiên nợ nhỏ)',
    avalancheMethod: 'Lở Tuyết (Avalanche - Ưu tiên lãi cao)',
    featureCustomizer: 'Cấu Hình Tính Năng Module (Tùy Chọn)',
    backupStatus: 'Google Drive Sync: Đồng bộ hóa lúc 01:45 sáng',
    creditCardAlert: 'Cảnh báo hạn mức thẻ tín dụng & ngày chốt sổ',
  },
  en: {
    appName: 'Daily Finance 2.0',
    tagline: 'Next-Gen Personal & Family Finance Manager for Android',
    prototypeTab: 'Interactive Android Prototype',
    blueprintTab: 'Design System & Architecture Specs',
    selectViewport: 'Device Viewport:',
    phoneView: 'Phone',
    foldableView: 'Foldable (Unfolded)',
    tabletView: 'Tablet / Widescreen',
    selectTheme: 'Design Philosophy:',
    m3Theme: 'Material 3 Expressive',
    appleTheme: 'Apple Wallet Physics',
    googleTheme: 'Google Wallet M3',
    spacesTitle: 'Financial Spaces',
    transferBetweenSpaces: 'Space Transfer',
    totalBalance: 'Total Liquid Balance',
    netWorth: 'Net Worth Total',
    monthlyCashflow: 'Monthly Cash Flow',
    income: 'Income',
    expense: 'Expense',
    transfer: 'Transfer',
    initialBalance: 'Initial Balance',
    quickAdd: 'Quick Add Transaction',
    voiceInputBtn: 'AI Voice Input',
    ocrScanBtn: 'OCR Receipt Scan',
    aiCoachTitle: 'Gemini AI Financial Coach',
    getAiAdvice: 'Analyze Cashflow & Get Insights',
    sixJarsTitle: 'Six Jars Method',
    envelopeTitle: 'Envelope Budgeting System',
    kakeiboTitle: 'Kakeibo Japanese Journal',
    fireTitle: 'FIRE (Financial Independence, Retire Early)',
    debtStrategyTitle: 'Debt Payoff: Snowball vs Avalanche',
    snowballMethod: 'Debt Snowball (Smallest Balance First)',
    avalancheMethod: 'Debt Avalanche (Highest Interest First)',
    featureCustomizer: 'Modular Feature Customizer',
    backupStatus: 'Google Drive Sync: Synced at 01:45 AM',
    creditCardAlert: 'Credit card utilization & billing cycle reminders',
  }
};
