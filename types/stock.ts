export interface Stock {
  code: string;
  name: string;
  englishName: string;
}

export interface DatabaseStock {
  id: number;
  code: string;
  name: string;
  english_name: string;
  market: Market;
  created_at: string;
  updated_at: string;
}

export type Market = 'TW' | 'CN' | 'US';

export interface StockFormData {
  code: string;
  name: string;
  englishName: string;
  market: Market;
}

export interface StockWithYahooLink extends DatabaseStock {
  yahooFinanceUrl: string;
}

export interface StockWithRealTimeData extends DatabaseStock {
  yahooFinanceUrl:string;
  currentPrice?: number;
  dayHigh?: number;
  dayLow?: number;
  fiftyTwoWeekHigh?: number;
  fiftyTwoWeekLow?: number;
} 