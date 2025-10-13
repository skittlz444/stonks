import { HoldingWithQuote, RebalanceRecommendation, RebalanceData } from '../types';

/**
 * Calculate rebalancing recommendations for holdings
 */
export function calculateRebalancing(
  holdings: HoldingWithQuote[],
  cashAmount: number,
  portfolioTotal: number
): RebalanceData {
  const recommendations: RebalanceRecommendation[] = [];
  
  for (const holding of holdings) {
    if (!holding.quote || holding.error) {
      continue;
    }
    
    const currentPrice = holding.quote.current;
    const currentQuantity = holding.quantity;
    const currentValue = currentPrice * currentQuantity;
    const currentWeight = portfolioTotal > 0 ? (currentValue / portfolioTotal) * 100 : 0;
    const targetWeight = holding.target_weight || 0;
    
    recommendations.push({
      ...holding,
      currentQuantity,
      currentValue,
      currentWeight,
      targetWeight,
      targetQuantity: currentQuantity,
      targetValue: currentValue,
      quantityChange: 0,
      valueChange: 0,
      newWeight: currentWeight,
      action: 'HOLD'
    });
  }
  
  const totalTargetWeight = recommendations.reduce((sum, r) => sum + r.targetWeight, 0);
  
  if (totalTargetWeight === 0) {
    return {
      recommendations,
      newCash: cashAmount,
      cashChange: 0
    };
  }
  
  let totalCashNeeded = 0;
  
  for (const rec of recommendations) {
    const currentPrice = rec.quote!.current;
    const idealTargetValue = (rec.targetWeight / 100) * portfolioTotal;
    const targetQuantity = Math.round(idealTargetValue / currentPrice);
    const targetValue = targetQuantity * currentPrice;
    const quantityChange = targetQuantity - rec.currentQuantity;
    const valueChange = targetValue - rec.currentValue;
    
    let action: 'BUY' | 'SELL' | 'HOLD' = 'HOLD';
    if (quantityChange > 0) {
      action = 'BUY';
      totalCashNeeded += valueChange;
    } else if (quantityChange < 0) {
      action = 'SELL';
      totalCashNeeded += valueChange;
    }
    
    const newWeight = portfolioTotal > 0 ? (targetValue / portfolioTotal) * 100 : 0;
    
    rec.targetQuantity = targetQuantity;
    rec.targetValue = targetValue;
    rec.quantityChange = quantityChange;
    rec.valueChange = valueChange;
    rec.newWeight = newWeight;
    rec.action = action;
  }
  
  const newCash = cashAmount - totalCashNeeded;
  
  return {
    recommendations,
    newCash: newCash,
    cashChange: -totalCashNeeded
  };
}
