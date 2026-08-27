/**
 * Daily Finance 2.5 - Formatters
 * Formatter Utilities conforming to ADR-011 Tabular Numbers Specification
 */

import { Language, Money } from '../types';

const numberFormatCache = new Map<string, Intl.NumberFormat>();
const dateTimeFormatCache = new Map<string, Intl.DateTimeFormat>();

function getNumberFormatter(locale: string, options: Intl.NumberFormatOptions): Intl.NumberFormat {
  const key = `${locale}_${JSON.stringify(options)}`;
  let formatter = numberFormatCache.get(key);
  if (!formatter) {
    formatter = new Intl.NumberFormat(locale, options);
    numberFormatCache.set(key, formatter);
  }
  return formatter;
}

function getDateTimeFormatter(locale: string, options: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  const key = `${locale}_${JSON.stringify(options)}`;
  let formatter = dateTimeFormatCache.get(key);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat(locale, options);
    dateTimeFormatCache.set(key, formatter);
  }
  return formatter;
}

export class MoneyFormatter {
  /**
   * Formats numeric amount with currency symbol, locale rules, and optional tabular numbers CSS support
   */
  static format(
    amount: number,
    currencyCode: string = 'VND',
    language: Language = 'vi',
    options?: { showSymbol?: boolean; showSign?: boolean; tabularNums?: boolean }
  ): string {
    const showSymbol = options?.showSymbol !== false;
    const showSign = options?.showSign === true;

    const absAmount = Math.abs(amount || 0);
    const signPrefix = amount > 0 && showSign ? '+' : amount < 0 ? '-' : '';
    const locale = language === 'vi' ? 'vi-VN' : 'en-US';

    if (currencyCode === 'VND') {
      const formattedNumber = getNumberFormatter(locale, {
        maximumFractionDigits: 0
      }).format(absAmount);

      const symbol = showSymbol ? '₫' : '';
      return `${signPrefix}${formattedNumber} ${symbol}`.trim();
    }

    // Default formatting for USD, EUR, JPY, SGD, etc.
    const formattedNumber = getNumberFormatter(locale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(absAmount);

    const currencySymbols: Record<string, string> = {
      USD: '$',
      EUR: '€',
      GBP: '£',
      JPY: '¥',
      SGD: 'S$',
      AUD: 'A$'
    };

    const symbol = showSymbol ? currencySymbols[currencyCode] || currencyCode : '';
    return `${signPrefix}${symbol}${formattedNumber}`.trim();
  }

  /**
   * Formats a Money value object
   */
  static formatMoney(
    money: Money,
    language: Language = 'vi',
    options?: { showSymbol?: boolean; showSign?: boolean }
  ): string {
    return this.format(money.amount, money.currency, language, options);
  }
}

export class CurrencyFormatter {
  static getSymbol(currencyCode: string): string {
    const symbols: Record<string, string> = {
      VND: '₫',
      USD: '$',
      EUR: '€',
      GBP: '£',
      JPY: '¥',
      SGD: 'S$',
      AUD: 'A$'
    };
    return symbols[currencyCode] || currencyCode;
  }

  static getCurrencyName(currencyCode: string, language: Language = 'vi'): string {
    const namesVi: Record<string, string> = {
      VND: 'Việt Nam Đồng',
      USD: 'Đô la Mỹ',
      EUR: 'Đồng Euro',
      JPY: 'Yên Nhật',
      SGD: 'Đô la Singapore'
    };
    const namesEn: Record<string, string> = {
      VND: 'Vietnamese Dong',
      USD: 'US Dollar',
      EUR: 'Euro',
      JPY: 'Japanese Yen',
      SGD: 'Singapore Dollar'
    };

    if (language === 'vi') {
      return namesVi[currencyCode] || currencyCode;
    }
    return namesEn[currencyCode] || currencyCode;
  }
}

export class DateFormatter {
  /**
   * Formats ISO date string (YYYY-MM-DD) or Date object to localized readable date
   */
  static formatDate(
    dateInput: string | Date,
    language: Language = 'vi',
    formatType: 'short' | 'medium' | 'full' = 'medium'
  ): string {
    if (!dateInput) return '';

    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    if (isNaN(date.getTime())) return String(dateInput);

    if (formatType === 'short') {
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      return `${day}/${month}`;
    }

    const locale = language === 'vi' ? 'vi-VN' : 'en-US';

    if (formatType === 'full') {
      return getDateTimeFormatter(locale, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }).format(date);
    }

    // Default medium
    return getDateTimeFormatter(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  }

  /**
   * Relative date string e.g. "Hôm nay", "Hôm qua", "2 ngày trước" or "Today", "Yesterday"
   */
  static formatRelative(dateInput: string | Date, language: Language = 'vi'): string {
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    if (isNaN(date.getTime())) return '';

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    const diffDays = Math.round((today.getTime() - target.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return language === 'vi' ? 'Hôm nay' : 'Today';
    if (diffDays === 1) return language === 'vi' ? 'Hôm qua' : 'Yesterday';
    if (diffDays === -1) return language === 'vi' ? 'Ngày mai' : 'Tomorrow';

    if (diffDays > 1 && diffDays < 7) {
      return language === 'vi' ? `${diffDays} ngày trước` : `${diffDays} days ago`;
    }

    return this.formatDate(date, language, 'medium');
  }
}

export class PercentageFormatter {
  static format(
    value: number,
    decimals: number = 1,
    showSign: boolean = false
  ): string {
    const sign = value > 0 && showSign ? '+' : '';
    return `${sign}${value.toFixed(decimals)}%`;
  }
}

export class CompactNumberFormatter {
  /**
   * Compact numbers format: 1.5M, 250K, 1.2B
   */
  static format(value: number, language: Language = 'vi'): string {
    const absVal = Math.abs(value || 0);
    const sign = value < 0 ? '-' : '';

    if (absVal >= 1_000_000_000) {
      const num = (absVal / 1_000_000_000).toFixed(1).replace(/\.0$/, '');
      return `${sign}${num}${language === 'vi' ? ' tỷ' : 'B'}`;
    }
    if (absVal >= 1_000_000) {
      const num = (absVal / 1_000_000).toFixed(1).replace(/\.0$/, '');
      return `${sign}${num}${language === 'vi' ? ' tr' : 'M'}`;
    }
    if (absVal >= 1_000) {
      const num = (absVal / 1_000).toFixed(1).replace(/\.0$/, '');
      return `${sign}${num}K`;
    }

    return `${sign}${absVal}`;
  }
}
