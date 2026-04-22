// Core data types for Stonks Portfolio application

export type CashBalances = Record<string, number>;

export interface Holding {
  id: number;
  name: string;
  code: string;
  currency: string;
  quantity: number;
  target_weight?: number;
  visible?: number;
}

export interface Quote {
  currency?: string;
  current: number;
  previous_close: number;
  change: number;
  percent_change: number;
  changePercent: number;  // Alias for percent_change
  high: number;
  low: number;
  open: number;
  timestamp: number;
}

export interface HoldingWithQuote extends Holding {
  quote?: Quote;
  error?: string;
  marketValue: number;
  costBasis: number;
  gain: number;
  gainPercent: number;
}

export interface Transaction {
  id: number;
  holding_id: number;
  holding_name?: string;
  holding_code?: string;
  type: 'buy' | 'sell';
  quantity: number;
  price: number;
  date: string;
  notes?: string;
}

export interface ClosedPosition {
  name: string;
  code: string;
  currency?: string;
  totalCost: number;
  totalRevenue: number;
  profitLoss: number;
  profitLossPercent: number;
  transactions: number;
}

export interface CacheStats {
  size: number;
  oldestTimestamp?: number;
}

export interface PricesData {
  holdings: HoldingWithQuote[];
  closedPositions: ClosedPosition[];
  cashAmount: number;
  cashBalances?: CashBalances;
  portfolioTotal: number;
  totalGainLoss: number;
  totalGainLossPercent: number;
  currency: string;
  portfolioName: string;
  fxAvailable?: boolean;
  fxRate?: number;
  alternateCurrency?: string;
  alternateFxRate?: number;
  fxRates?: Record<string, number>;
  cacheStats?: CacheStats;
}

export interface ConfigData {
  visibleHoldings: Holding[];
  hiddenHoldings: Holding[];
  transactions: Transaction[];
  cashAmount: number;
  cashBalances: CashBalances;
  portfolioName: string;
  totalTargetWeight: number;
}

export interface RebalanceRecommendation extends HoldingWithQuote {
  currentQuantity: number;
  currentValue: number;
  currentWeight: number;
  targetWeight: number;
  targetQuantity: number;
  targetValue: number;
  quantityChange: number;
  valueChange: number;
  newWeight: number;
  action: 'BUY' | 'SELL' | 'HOLD';
}

export interface RebalanceData {
  recommendations: RebalanceRecommendation[];
  newCash: number;
  cashChange: number;
}

export type SortDirection = 'asc' | 'desc';

export interface SortState {
  column: number;
  direction: SortDirection;
}

export interface ChartSymbol {
  symbol: string;
  name: string;
}
