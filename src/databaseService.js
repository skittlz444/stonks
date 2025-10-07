/**
 * Database utilities for D1 operations
 */

/**
 * Database service class to handle D1 operations
 */
export class DatabaseService {
  constructor(db) {
    this.db = db;
  }

  /**
   * Get all holdings including dynamically constructed portfolio
   */
  async getHoldings() {
    try {
      // Get individual holdings with calculated quantities
      const holdingsWithQuantity = await this.getPortfolioHoldings();
      
      // Get portfolio settings
      const settingsResult = await this.db.prepare(
        'SELECT key, value FROM portfolio_settings'
      ).all();
      
      const settings = {};
      (settingsResult.results || []).forEach(row => {
        settings[row.key] = row.value;
      });
      
      // Build dynamic portfolio from holdings with BATS codes
      const portfolioHoldings = holdingsWithQuantity.filter(h => h.code && h.code.startsWith('BATS:') && h.quantity > 0);
      if (portfolioHoldings.length > 0) {
        const portfolioSymbol = this.buildPortfolioSymbol(portfolioHoldings, settings.cash_amount || '0');
        const portfolioName = settings.portfolio_name || 'My Portfolio';
        
        // Create the dynamic portfolio entry
        const dynamicPortfolio = {
          id: 0,
          name: portfolioName,
          symbol: portfolioSymbol,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        // Create individual holdings with symbol format for compatibility
        const individualHoldings = holdingsWithQuantity.map(holding => ({
          id: holding.id,
          name: holding.name,
          symbol: holding.code,
          created_at: holding.created_at,
          updated_at: holding.updated_at
        }));
        
        return [dynamicPortfolio, ...individualHoldings];
      }
      
      // Fallback to individual holdings only
      return holdingsWithQuantity.map(holding => ({
        id: holding.id,
        name: holding.name,
        symbol: holding.code,
        created_at: holding.created_at,
        updated_at: holding.updated_at
      }));
      
    } catch (error) {
      console.error('Error fetching holdings:', error);
      return [];
    }
  }

  /**
   * Get only visible holdings (for ticker and charts)
   */
  async getVisibleHoldings() {
    try {
      // Get only visible holdings with calculated quantities
      const holdingsWithQuantity = await this.getVisiblePortfolioHoldings();
      
      // Get portfolio settings
      const settingsResult = await this.db.prepare(
        'SELECT key, value FROM portfolio_settings'
      ).all();
      
      const settings = {};
      (settingsResult.results || []).forEach(row => {
        settings[row.key] = row.value;
      });
      
      // Build dynamic portfolio from visible holdings with BATS codes
      const portfolioHoldings = holdingsWithQuantity.filter(h => h.code && h.code.startsWith('BATS:') && h.quantity > 0);
      if (portfolioHoldings.length > 0) {
        const portfolioSymbol = this.buildPortfolioSymbol(portfolioHoldings, settings.cash_amount || '0');
        const portfolioName = settings.portfolio_name || 'My Portfolio';
        
        // Create the dynamic portfolio entry
        const dynamicPortfolio = {
          id: 0,
          name: portfolioName,
          symbol: portfolioSymbol,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        // Create individual holdings with symbol format for compatibility
        const individualHoldings = holdingsWithQuantity.map(holding => ({
          id: holding.id,
          name: holding.name,
          symbol: holding.code,
          created_at: holding.created_at,
          updated_at: holding.updated_at
        }));
        
        return [dynamicPortfolio, ...individualHoldings];
      }
      
      // Fallback to individual holdings only
      return holdingsWithQuantity.map(holding => ({
        id: holding.id,
        name: holding.name,
        symbol: holding.code,
        created_at: holding.created_at,
        updated_at: holding.updated_at
      }));
      
    } catch (error) {
      console.error('Error fetching visible holdings:', error);
      return [];
    }
  }
  
  /**
   * Build the portfolio symbol from individual holdings and cash
   */
  buildPortfolioSymbol(holdings, cashAmount) {
    const components = holdings.map(h => `${h.quantity}*${h.code}`);
    if (cashAmount && parseFloat(cashAmount) > 0) {
      components.push(cashAmount);
    }
    return components.join('+');
  }

  /**
   * @deprecated Use getHoldings() instead - this is for backward compatibility only
   * Returns data in the pipe-separated format for legacy compatibility
   */
  async getCurrentHoldings() {
    try {
      const holdings = await this.getHoldings();
      
      if (!holdings || holdings.length === 0) {
        return null;
      }
      
      // Convert to the pipe-separated format for backward compatibility
      const holdingStrings = holdings.map(row => `"${row.name}","${row.symbol}"`);
      return holdingStrings.join('|');
      
    } catch (error) {
      console.error('Error fetching holdings:', error);
      return null;
    }
  }

  /**
   * Add a new portfolio holding (without quantity - use transactions instead)
   */
  async addPortfolioHolding(name, code, targetWeight = null) {
    try {
      const result = await this.db.prepare(
        'INSERT INTO portfolio_holdings (name, code, target_weight) VALUES (?, ?, ?)'
      ).bind(name, code, targetWeight).run();
      
      return result.success;
    } catch (error) {
      console.error('Error adding portfolio holding:', error);
      return false;
    }
  }

  /**
   * Update an existing portfolio holding (without quantity - use transactions instead)
   */
  async updatePortfolioHolding(id, name, code, targetWeight = null) {
    try {
      const result = await this.db.prepare(
        'UPDATE portfolio_holdings SET name = ?, code = ?, target_weight = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
      ).bind(name, code, targetWeight, id).run();
      
      return result.success;
    } catch (error) {
      console.error('Error updating portfolio holding:', error);
      return false;
    }
  }

  /**
   * Delete a portfolio holding
   */
  async deletePortfolioHolding(id) {
    try {
      const result = await this.db.prepare(
        'DELETE FROM portfolio_holdings WHERE id = ?'
      ).bind(id).run();
      
      return result.success;
    } catch (error) {
      console.error('Error deleting portfolio holding:', error);
      return false;
    }
  }

  /**
   * Update portfolio cash amount
   */
  async updateCashAmount(amount) {
    try {
      const result = await this.db.prepare(
        'INSERT OR REPLACE INTO portfolio_settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)'
      ).bind('cash_amount', amount.toString()).run();
      
      return result.success;
    } catch (error) {
      console.error('Error updating cash amount:', error);
      return false;
    }
  }

  /**
   * Get portfolio cash amount
   */
  async getCashAmount() {
    try {
      const result = await this.db.prepare(
        'SELECT value FROM portfolio_settings WHERE key = ?'
      ).bind('cash_amount').first();
      
      return result ? parseFloat(result.value) : 0;
    } catch (error) {
      console.error('Error getting cash amount:', error);
      return 0;
    }
  }

  /**
   * Add a new transaction (buy or sell)
   */
  async addTransaction(code, type, date, quantity, value, fee = 0) {
    try {
      const result = await this.db.prepare(
        'INSERT INTO transactions (code, type, date, quantity, value, fee) VALUES (?, ?, ?, ?, ?, ?)'
      ).bind(code, type, date, quantity, value, fee).run();
      
      return result.success;
    } catch (error) {
      console.error('Error adding transaction:', error);
      return false;
    }
  }

  /**
   * Get all transactions
   */
  async getTransactions() {
    try {
      const result = await this.db.prepare(
        'SELECT id, code, type, date, quantity, value, fee, created_at FROM transactions ORDER BY date DESC, id DESC'
      ).all();
      
      return result.results || [];
    } catch (error) {
      console.error('Error fetching transactions:', error);
      return [];
    }
  }

  /**
   * Get transactions for a specific stock code
   */
  async getTransactionsByCode(code) {
    try {
      const result = await this.db.prepare(
        'SELECT id, code, type, date, quantity, value, fee, created_at FROM transactions WHERE code = ? ORDER BY date ASC, id ASC'
      ).bind(code).all();
      
      return result.results || [];
    } catch (error) {
      console.error('Error fetching transactions by code:', error);
      return [];
    }
  }

  /**
   * Get all transactions grouped by stock code (optimized for bulk fetching)
   * @returns {Promise<Object>} Object with code as key, array of transactions as value
   */
  async getAllTransactionsGroupedByCode() {
    try {
      const result = await this.db.prepare(
        'SELECT id, code, type, date, quantity, value, fee, created_at FROM transactions ORDER BY code, date ASC, id ASC'
      ).all();
      
      const grouped = {};
      for (const transaction of result.results || []) {
        if (!grouped[transaction.code]) {
          grouped[transaction.code] = [];
        }
        grouped[transaction.code].push(transaction);
      }
      
      return grouped;
    } catch (error) {
      console.error('Error fetching all transactions grouped by code:', error);
      return {};
    }
  }

  /**
   * Delete a transaction
   */
  async deleteTransaction(id) {
    try {
      const result = await this.db.prepare(
        'DELETE FROM transactions WHERE id = ?'
      ).bind(id).run();
      
      return result.success;
    } catch (error) {
      console.error('Error deleting transaction:', error);
      return false;
    }
  }

  /**
   * Calculate current quantity for a stock from transactions
   */
  async calculateCurrentQuantity(code) {
    try {
      const transactions = await this.getTransactionsByCode(code);
      
      let quantity = 0;
      for (const transaction of transactions) {
        if (transaction.type === 'buy') {
          quantity += parseFloat(transaction.quantity);
        } else if (transaction.type === 'sell') {
          quantity -= parseFloat(transaction.quantity);
        }
      }
      
      return quantity;
    } catch (error) {
      console.error('Error calculating current quantity:', error);
      return 0;
    }
  }

  /**
   * Get all portfolio holdings with calculated quantities from transactions
   */
  async getPortfolioHoldings() {
    try {
      // Get all holdings
      const holdingsResult = await this.db.prepare(
        'SELECT id, name, code, target_weight, hidden, created_at, updated_at FROM portfolio_holdings ORDER BY id'
      ).all();
      
      const holdings = holdingsResult.results || [];
      
      // Calculate quantity for each holding
      const holdingsWithQuantity = await Promise.all(
        holdings.map(async (holding) => {
          const quantity = await this.calculateCurrentQuantity(holding.code);
          return {
            ...holding,
            quantity
          };
        })
      );
      
      return holdingsWithQuantity;
    } catch (error) {
      console.error('Error fetching portfolio holdings:', error);
      return [];
    }
  }

  /**
   * Get visible portfolio holdings (hidden = 0) with quantities
   */
  async getVisiblePortfolioHoldings() {
    try {
      const holdingsResult = await this.db.prepare(
        'SELECT id, name, code, target_weight, hidden, created_at, updated_at FROM portfolio_holdings WHERE hidden = 0 ORDER BY id'
      ).all();
      
      const holdings = holdingsResult.results || [];
      
      // Calculate quantity for each holding
      const holdingsWithQuantity = await Promise.all(
        holdings.map(async (holding) => {
          const quantity = await this.calculateCurrentQuantity(holding.code);
          return {
            ...holding,
            quantity
          };
        })
      );
      
      return holdingsWithQuantity;
    } catch (error) {
      console.error('Error fetching visible portfolio holdings:', error);
      return [];
    }
  }

  /**
   * Get hidden portfolio holdings (hidden = 1) with quantities
   */
  async getHiddenPortfolioHoldings() {
    try {
      const holdingsResult = await this.db.prepare(
        'SELECT id, name, code, target_weight, hidden, created_at, updated_at FROM portfolio_holdings WHERE hidden = 1 ORDER BY id'
      ).all();
      
      const holdings = holdingsResult.results || [];
      
      // Calculate quantity for each holding
      const holdingsWithQuantity = await Promise.all(
        holdings.map(async (holding) => {
          const quantity = await this.calculateCurrentQuantity(holding.code);
          return {
            ...holding,
            quantity
          };
        })
      );
      
      return holdingsWithQuantity;
    } catch (error) {
      console.error('Error fetching hidden portfolio holdings:', error);
      return [];
    }
  }

  /**
   * Toggle visibility of a portfolio holding
   */
  async toggleHoldingVisibility(id) {
    try {
      const result = await this.db.prepare(
        'UPDATE portfolio_holdings SET hidden = CASE WHEN hidden = 0 THEN 1 ELSE 0 END, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
      ).bind(id).run();
      
      return result.success;
    } catch (error) {
      console.error('Error toggling holding visibility:', error);
      return false;
    }
  }

  /**
   * Get closed positions (stocks that were fully sold)
   */
  async getClosedPositions() {
    try {
      // Get all unique codes from transactions
      const codesResult = await this.db.prepare(
        'SELECT DISTINCT code FROM transactions ORDER BY code'
      ).all();
      
      const codes = codesResult.results || [];
      const closedPositions = [];
      
      for (const { code } of codes) {
        const transactions = await this.getTransactionsByCode(code);
        const currentQuantity = await this.calculateCurrentQuantity(code);
        
        // Check if position is closed (quantity is 0 and there are transactions)
        if (currentQuantity === 0 && transactions.length > 0) {
          // Calculate total buy cost and total sell revenue
          let totalBuyCost = 0;
          let totalBuyFees = 0;
          let totalSellRevenue = 0;
          let totalSellFees = 0;
          
          for (const transaction of transactions) {
            if (transaction.type === 'buy') {
              totalBuyCost += parseFloat(transaction.value);
              totalBuyFees += parseFloat(transaction.fee);
            } else if (transaction.type === 'sell') {
              totalSellRevenue += parseFloat(transaction.value);
              totalSellFees += parseFloat(transaction.fee);
            }
          }
          
          const totalCost = totalBuyCost + totalBuyFees;
          const totalRevenue = totalSellRevenue - totalSellFees;
          const profitLoss = totalRevenue - totalCost;
          const profitLossPercent = totalCost > 0 ? (profitLoss / totalCost) * 100 : 0;
          
          // Try to get name from portfolio_holdings
          const holdingResult = await this.db.prepare(
            'SELECT name FROM portfolio_holdings WHERE code = ?'
          ).bind(code).first();
          
          closedPositions.push({
            code,
            name: holdingResult?.name || code,
            totalCost,
            totalRevenue,
            profitLoss,
            profitLossPercent,
            transactions: transactions.length
          });
        }
      }
      
      return closedPositions;
    } catch (error) {
      console.error('Error fetching closed positions:', error);
      return [];
    }
  }


}

/**
 * Mock D1 database for local development
 */
export class MockD1Database {
  constructor() {
    const now = new Date().toISOString();
    
    // Mock portfolio holdings data (without quantity - derived from transactions)
    this.portfolioHoldings = [
      { id: 1, name: "Vgrd S&P 500", code: "BATS:VOO", target_weight: null, hidden: 0, created_at: now, updated_at: now },
      { id: 2, name: "GS Gold", code: "BATS:AAAU", target_weight: null, hidden: 0, created_at: now, updated_at: now },
      { id: 3, name: "Vgrd Ex US", code: "BATS:VXUS", target_weight: null, hidden: 0, created_at: now, updated_at: now },
      { id: 4, name: "Vgrd S&P 500 Value", code: "BATS:VOOV", target_weight: null, hidden: 0, created_at: now, updated_at: now },
      { id: 5, name: "Vgrd Mid Cap", code: "BATS:VO", target_weight: null, hidden: 0, created_at: now, updated_at: now },
      { id: 6, name: "GOP", code: "BATS:GOP", target_weight: null, hidden: 0, created_at: now, updated_at: now }
    ];
    
    // Mock transactions data (initial buy transactions from migration)
    this.transactions = [
      { id: 1, code: "BATS:VOO", type: "buy", date: now.split('T')[0], quantity: 2, value: 0, fee: 0, created_at: now },
      { id: 2, code: "BATS:AAAU", type: "buy", date: now.split('T')[0], quantity: 27, value: 0, fee: 0, created_at: now },
      { id: 3, code: "BATS:VXUS", type: "buy", date: now.split('T')[0], quantity: 13, value: 0, fee: 0, created_at: now },
      { id: 4, code: "BATS:VOOV", type: "buy", date: now.split('T')[0], quantity: 3, value: 0, fee: 0, created_at: now },
      { id: 5, code: "BATS:VO", type: "buy", date: now.split('T')[0], quantity: 2, value: 0, fee: 0, created_at: now },
      { id: 6, code: "BATS:GOP", type: "buy", date: now.split('T')[0], quantity: 8, value: 0, fee: 0, created_at: now }
    ];
    
    this.portfolioSettings = {
      cash_amount: 101.8,
      portfolio_name: "My Portfolio"
    };
    
    // Legacy holdings for backwards compatibility
    this.holdings = [
      { id: 1, name: 'My Portfolio', symbol: '2*BATS:VOO+27*BATS:AAAU+13*BATS:VXUS+3*BATS:VOOV+2*BATS:VO+8*BATS:GOP+101.8', created_at: now, updated_at: now },
      { id: 2, name: 'Vgrd S&P 500', symbol: 'AMEX:VOO', created_at: now, updated_at: now },
      { id: 3, name: 'GS Gold', symbol: 'CBOE:AAAU', created_at: now, updated_at: now },
      { id: 4, name: 'Vgrd Ex US', symbol: 'NASDAQ:VXUS', created_at: now, updated_at: now },
      { id: 5, name: 'Vgrd S&P 500 Value', symbol: 'AMEX:VOOV', created_at: now, updated_at: now },
      { id: 6, name: 'Vgrd Mid Cap', symbol: 'AMEX:VO', created_at: now, updated_at: now },
      { id: 7, name: 'GOP', symbol: 'CBOE:GOP', created_at: now, updated_at: now }
    ];
  }

  prepare(query) {
    return new MockPreparedStatement(query, this);
  }
}

class MockPreparedStatement {
  constructor(query, mockDb) {
    this.query = query;
    this.mockDb = mockDb;
    this.bindings = [];
  }

  bind(...args) {
    this.bindings = args;
    return this;
  }

  async all() {
    // Portfolio holdings queries (new structure with hidden column)
    if (this.query.includes('SELECT id, name, code, target_weight, hidden, created_at, updated_at FROM portfolio_holdings')) {
      // Check if filtering for visible holdings only
      if (this.query.includes('WHERE hidden = 0')) {
        return {
          results: this.mockDb.portfolioHoldings.filter(h => h.hidden === 0),
          success: true
        };
      }
      // Check if filtering for hidden holdings only
      if (this.query.includes('WHERE hidden = 1')) {
        return {
          results: this.mockDb.portfolioHoldings.filter(h => h.hidden === 1),
          success: true
        };
      }
      return {
        results: this.mockDb.portfolioHoldings,
        success: true
      };
    }

    // Old portfolio holdings queries (without hidden - for backwards compatibility)
    if (this.query.includes('SELECT id, name, code, target_weight, created_at, updated_at FROM portfolio_holdings')) {
      return {
        results: this.mockDb.portfolioHoldings,
        success: true
      };
    }

    // Old portfolio holdings queries (with quantity - for backwards compatibility during migration)
    if (this.query.includes('SELECT * FROM portfolio_holdings') || 
        this.query.includes('SELECT id, name, code, quantity, created_at, updated_at FROM portfolio_holdings')) {
      return {
        results: this.mockDb.portfolioHoldings,
        success: true
      };
    }

    // Transactions queries
    if (this.query.includes('SELECT id, code, type, date, quantity, value, fee, created_at FROM transactions')) {
      if (this.query.includes('WHERE code = ?')) {
        const code = this.bindings[0];
        return {
          results: this.mockDb.transactions.filter(t => t.code === code),
          success: true
        };
      }
      return {
        results: this.mockDb.transactions,
        success: true
      };
    }

    // Distinct codes from transactions
    if (this.query.includes('SELECT DISTINCT code FROM transactions')) {
      const uniqueCodes = [...new Set(this.mockDb.transactions.map(t => t.code))];
      return {
        results: uniqueCodes.map(code => ({ code })),
        success: true
      };
    }

    // Portfolio settings queries (all settings)
    if (this.query.includes('SELECT key, value FROM portfolio_settings')) {
      return {
        results: [
          { key: 'cash_amount', value: this.mockDb.portfolioSettings.cash_amount.toString() },
          { key: 'portfolio_name', value: this.mockDb.portfolioSettings.portfolio_name }
        ],
        success: true
      };
    }
    
    // Legacy holdings queries
    if (this.query.includes('SELECT id, name, symbol, created_at, updated_at FROM holdings') || 
        this.query.includes('SELECT name, symbol FROM holdings')) {
      return {
        results: this.mockDb.holdings,
        success: true
      };
    }
    
    return { results: [], success: true };
  }

  async first() {
    // Portfolio settings queries
    if (this.query.includes('SELECT value FROM portfolio_settings WHERE key = ?')) {
      const key = this.bindings[0];
      if (key === 'cash_amount') {
        return { value: this.mockDb.portfolioSettings.cash_amount.toString() };
      }
      if (key === 'portfolio_name') {
        return { value: this.mockDb.portfolioSettings.portfolio_name };
      }
    }
    
    // Portfolio holdings name lookup
    if (this.query.includes('SELECT name FROM portfolio_holdings WHERE code = ?')) {
      const code = this.bindings[0];
      const holding = this.mockDb.portfolioHoldings.find(h => h.code === code);
      return holding ? { name: holding.name } : null;
    }
    
    return null;
  }

  async run() {
    // Handle INSERT operations for transactions
    if (this.query.includes('INSERT INTO transactions')) {
      const [code, type, date, quantity, value, fee] = this.bindings;
      const newId = Math.max(...this.mockDb.transactions.map(t => t.id), 0) + 1;
      const now = new Date().toISOString();
      
      this.mockDb.transactions.push({
        id: newId,
        code,
        type,
        date,
        quantity,
        value,
        fee,
        created_at: now
      });
      
      return { success: true };
    }

    // Handle DELETE operations for transactions
    if (this.query.includes('DELETE FROM transactions WHERE id = ?')) {
      const id = this.bindings[0];
      this.mockDb.transactions = this.mockDb.transactions.filter(t => t.id !== id);
      return { success: true };
    }

    // Handle INSERT operations for portfolio holdings (new structure without quantity)
    if (this.query.includes('INSERT INTO portfolio_holdings')) {
      const [name, code, targetWeight] = this.bindings;
      const newId = Math.max(...this.mockDb.portfolioHoldings.map(h => h.id), 0) + 1;
      const now = new Date().toISOString();
      
      this.mockDb.portfolioHoldings.push({
        id: newId,
        name,
        code,
        target_weight: targetWeight,
        created_at: now,
        updated_at: now
      });
      
      return { success: true };
    }
    
    // Handle UPDATE operations for toggling hidden status (CASE WHEN version)
    if (this.query.includes('UPDATE portfolio_holdings SET hidden = CASE WHEN hidden')) {
      const id = this.bindings[0];
      const holdingIndex = this.mockDb.portfolioHoldings.findIndex(h => h.id === id);
      
      if (holdingIndex !== -1) {
        this.mockDb.portfolioHoldings[holdingIndex] = {
          ...this.mockDb.portfolioHoldings[holdingIndex],
          hidden: this.mockDb.portfolioHoldings[holdingIndex].hidden === 0 ? 1 : 0,
          updated_at: new Date().toISOString()
        };
      }
      
      return { success: true };
    }
    
    // Handle UPDATE operations for setting hidden status (simple version)
    if (this.query.includes('UPDATE portfolio_holdings SET hidden = ?')) {
      const [hidden, id] = this.bindings;
      const holdingIndex = this.mockDb.portfolioHoldings.findIndex(h => h.id === id);
      
      if (holdingIndex !== -1) {
        this.mockDb.portfolioHoldings[holdingIndex] = {
          ...this.mockDb.portfolioHoldings[holdingIndex],
          hidden,
          updated_at: new Date().toISOString()
        };
      }
      
      return { success: true };
    }
    
    // Handle UPDATE operations for portfolio holdings (new structure)
    if (this.query.includes('UPDATE portfolio_holdings SET')) {
      const [name, code, targetWeight, id] = this.bindings;
      const holdingIndex = this.mockDb.portfolioHoldings.findIndex(h => h.id === id);
      
      if (holdingIndex !== -1) {
        this.mockDb.portfolioHoldings[holdingIndex] = {
          ...this.mockDb.portfolioHoldings[holdingIndex],
          name,
          code,
          target_weight: targetWeight,
          updated_at: new Date().toISOString()
        };
      }
      
      return { success: true };
    }
    
    // Handle DELETE operations for portfolio holdings
    if (this.query.includes('DELETE FROM portfolio_holdings WHERE id = ?')) {
      const id = this.bindings[0];
      this.mockDb.portfolioHoldings = this.mockDb.portfolioHoldings.filter(h => h.id !== id);
      return { success: true };
    }
    
    // Handle INSERT OR REPLACE for portfolio settings
    if (this.query.includes('INSERT OR REPLACE INTO portfolio_settings')) {
      const [key, value] = this.bindings;
      this.mockDb.portfolioSettings[key] = value;
      return { success: true };
    }
    
    return { success: true };
  }
}