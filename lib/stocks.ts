import { SupabaseClient } from '@supabase/supabase-js';
import { DatabaseStock, Market, StockFormData, StockWithYahooLink, StockWithRealTimeData } from '@/types/stock';
import yahooFinance from 'yahoo-finance2';

export class StocksService {
  constructor(private supabase: SupabaseClient) {}

  async getStocksByMarket(market: Market): Promise<DatabaseStock[]> {
    const { data, error } = await this.supabase
      .from('stocks')
      .select('*')
      .eq('market', market)
      .order('code');

    if (error) {
      throw new Error(`Failed to fetch ${market} stocks: ${error.message}`);
    }

    return data || [];
  }

  async getAllStocks(): Promise<DatabaseStock[]> {
    const { data, error } = await this.supabase
      .from('stocks')
      .select('*')
      .order('market, code');

    if (error) {
      throw new Error(`Failed to fetch stocks: ${error.message}`);
    }

    return data || [];
  }

  async createStock(stockData: StockFormData): Promise<DatabaseStock> {
    const { data, error } = await this.supabase
      .from('stocks')
      .insert({
        code: stockData.code,
        name: stockData.name,
        english_name: stockData.englishName,
        market: stockData.market,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create stock: ${error.message}`);
    }

    return data;
  }

  async updateStock(id: number, stockData: Partial<StockFormData>): Promise<DatabaseStock> {
    const updateData: {
      updated_at: string;
      code?: string;
      name?: string;
      english_name?: string;
      market?: Market;
    } = {
      updated_at: new Date().toISOString()
    };

    if (stockData.code) updateData.code = stockData.code;
    if (stockData.name) updateData.name = stockData.name;
    if (stockData.englishName) updateData.english_name = stockData.englishName;
    if (stockData.market) updateData.market = stockData.market;

    const { data, error } = await this.supabase
      .from('stocks')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update stock: ${error.message}`);
    }

    return data;
  }

  async deleteStock(id: number): Promise<void> {
    const { error } = await this.supabase
      .from('stocks')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete stock: ${error.message}`);
    }
  }

  async getStockByCode(code: string): Promise<DatabaseStock | null> {
    const { data, error } = await this.supabase
      .from('stocks')
      .select('*')
      .eq('code', code)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // No rows found
      }
      throw new Error(`Failed to fetch stock: ${error.message}`);
    }

    return data;
  }

  /**
   * Generate Yahoo Finance URL for a stock based on its market and code
   * @param stock - The stock object containing code and market information
   * @returns Yahoo Finance URL string
   */
  private generateYahooFinanceUrl(stock: DatabaseStock): string {
    const baseUrl = 'https://finance.yahoo.com/quote/';
    
    switch (stock.market) {
      case 'US':
        return `${baseUrl}${stock.code}`;
      case 'TW':
        // Taiwan stocks typically use .TW suffix
        return `${baseUrl}${stock.code}.TW`;
      case 'CN':
        // Chinese stocks may use different suffixes depending on exchange
        // Assuming Shanghai (.SS) for now, but could be customized
        return `${baseUrl}${stock.code}.SS`;
      default:
        return `${baseUrl}${stock.code}`;
    }
  }

  /**
   * Get all stocks with their Yahoo Finance URLs - like a TODO list
   * @returns Array of stocks with Yahoo Finance URLs
   */
  async getStocksWithYahooLinks(): Promise<StockWithYahooLink[]> {
    const stocks = await this.getAllStocks();
    
    return stocks.map(stock => ({
      ...stock,
      yahooFinanceUrl: this.generateYahooFinanceUrl(stock)
    }));
  }

  /**
   * Get stocks by market with their Yahoo Finance URLs
   * @param market - The market to filter by
   * @returns Array of stocks from the specified market with Yahoo Finance URLs
   */
  async getStocksByMarketWithYahooLinks(market: Market): Promise<StockWithYahooLink[]> {
    const stocks = await this.getStocksByMarket(market);
    
    return stocks.map(stock => ({
      ...stock,
      yahooFinanceUrl: this.generateYahooFinanceUrl(stock)
    }));
  }

  /**
   * Get a single stock's Yahoo Finance URL
   * @param code - Stock code
   * @returns Yahoo Finance URL or null if stock not found
   */
  async getStockYahooFinanceUrl(code: string): Promise<string | null> {
    const stock = await this.getStockByCode(code);
    
    if (!stock) {
      return null;
    }
    
    return this.generateYahooFinanceUrl(stock);
  }

  private async _fetchRealTimeData(stockCode: string) {
    try {
      const quote = await yahooFinance.quote(stockCode);
      return {
        currentPrice: quote.regularMarketPrice,
        dayHigh: quote.regularMarketDayHigh,
        dayLow: quote.regularMarketDayLow,
        fiftyTwoWeekHigh: quote.fiftyTwoWeekHigh,
        fiftyTwoWeekLow: quote.fiftyTwoWeekLow,
      };
    } catch (error) {
      console.error(`Failed to fetch real-time data for ${stockCode}:`, error);
      return {}; // Return empty object on failure
    }
  }

  async getStocksWithRealTimeData(market: Market): Promise<StockWithRealTimeData[]> {
    const stocksWithLinks = await this.getStocksByMarketWithYahooLinks(market);

    const stocksWithRealTimeData = await Promise.all(
      stocksWithLinks.map(async (stock) => {
        const yahooCode = stock.yahooFinanceUrl.split('/').pop()!;
        const realTimeData = await this._fetchRealTimeData(yahooCode);
        return {
          ...stock,
          ...realTimeData,
        };
      })
    );

    return stocksWithRealTimeData;
  }

  async getStockWithRealTimeData(code: string): Promise<StockWithRealTimeData | null> {
    const stock = await this.getStockByCode(code);
    if (!stock) {
      return null;
    }

    const yahooFinanceUrl = this.generateYahooFinanceUrl(stock);
    const yahooCode = yahooFinanceUrl.split('/').pop()!;
    const realTimeData = await this._fetchRealTimeData(yahooCode);

    return {
      ...stock,
      yahooFinanceUrl,
      ...realTimeData,
    };
  }
} 