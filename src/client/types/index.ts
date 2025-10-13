// Core data types for Stonks Portfolio application

export interface Holding {
  id: number;
  name: string;
  code: string;
  quantity: number;
  target_weight?: number;
  visible?: number;
}

export interface Quote {
  current: number;
  previous_close: number;
  change: number;
  percent_change: number;
  high: number;
  low: number;
  open: number;
  timestamp: number;
}

export interface HoldingWithQuote extends Holding {
  quote?: Quote;
  error?: string;
  currentValue?: number;
  gainLoss?: number;
  gainLossPercent?: number;
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
  holding_name: string;
  holding_code: string;
  total_quantity: number;
  total_cost: number;
  total_proceeds: number;
  realized_gain_loss: number;
  realized_gain_loss_percent: number;
  first_transaction_date: string;
  last_transaction_date: string;
}

export interface PricesData {
  holdings: HoldingWithQuote[];
  closedPositions: ClosedPosition[];
  cashAmount: number;
  portfolioTotal: number;
  totalGainLoss: number;
  totalGainLossPercent: number;
  currency: string;
  portfolioName: string;
}

export interface ConfigData {
  visibleHoldings: Holding[];
  hiddenHoldings: Holding[];
  transactions: Transaction[];
  cashAmount: number;
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
