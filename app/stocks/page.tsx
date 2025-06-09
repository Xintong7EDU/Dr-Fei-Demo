import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StockTable } from '@/components/stock-table';
import { getAllStocks } from './actions';
import { DatabaseStock } from '@/types/stock';
import { MainNav } from '@/components/main-nav';

export default async function StocksPage() {
  try {
    const allStocks = await getAllStocks();
    
    // Group stocks by market
    const taiwanStocks = allStocks.filter((stock: DatabaseStock) => stock.market === 'TW');
    const chinaStocks = allStocks.filter((stock: DatabaseStock) => stock.market === 'CN');
    const usStocks = allStocks.filter((stock: DatabaseStock) => stock.market === 'US');

    return (
      <div className="min-h-screen bg-background">
        {/* Header with Navigation */}
        <header className="border-b">
          <div className="container mx-auto px-4 py-4">
            <MainNav />
          </div>
        </header>

        {/* Main Content */}
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight mb-2">Stock Information</h1>
            <p className="text-muted-foreground">
              Manage stock information for Taiwan, China, and US markets
            </p>
          </div>

          <Tabs defaultValue="tw" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="tw" className="flex items-center gap-2">
                🇹🇼 Taiwan Stock Market
                <span className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 text-xs px-2 py-1 rounded-full">
                  {taiwanStocks.length}
                </span>
              </TabsTrigger>
              <TabsTrigger value="cn" className="flex items-center gap-2">
                🇨🇳 China Stock Market
                <span className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 text-xs px-2 py-1 rounded-full">
                  {chinaStocks.length}
                </span>
              </TabsTrigger>
              <TabsTrigger value="us" className="flex items-center gap-2">
                🇺🇸 US Stock Market
                <span className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 text-xs px-2 py-1 rounded-full">
                  {usStocks.length}
                </span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="tw" className="mt-6">
              <StockTable 
                stocks={taiwanStocks}
                market="TW"
                title="Taiwan Stock Market"
              />
            </TabsContent>

            <TabsContent value="cn" className="mt-6">
              <StockTable 
                stocks={chinaStocks}
                market="CN"
                title="China Stock Market"
              />
            </TabsContent>

            <TabsContent value="us" className="mt-6">
              <StockTable 
                stocks={usStocks}
                market="US"
                title="US Stock Market"
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    );
  } catch (error) {
    return (
      <div className="min-h-screen bg-background">
        {/* Header with Navigation */}
        <header className="border-b">
          <div className="container mx-auto px-4 py-4">
            <MainNav />
          </div>
        </header>

        {/* Error Content */}
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold tracking-tight mb-8">Stock Information</h1>
          <div className="text-red-600 dark:text-red-400">
            Failed to load stock data: {error instanceof Error ? error.message : 'Unknown error'}
          </div>
        </div>
      </div>
    );
  }
} 