import { SupabaseClient } from '@supabase/supabase-js';
import { DatabaseStock, Market, StockFormData } from '@/types/stock';

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
} 