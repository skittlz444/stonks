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
      // Get individual holdings
      const holdingsResult = await this.db.prepare(
        'SELECT id, name, code, quantity, created_at, updated_at FROM portfolio_holdings ORDER BY id'
      ).all();
      
      const holdings = holdingsResult.results || [];
      
      // Get portfolio settings
      const settingsResult = await this.db.prepare(
        'SELECT key, value FROM portfolio_settings'
      ).all();
      
      const settings = {};
      (settingsResult.results || []).forEach(row => {
        settings[row.key] = row.value;
      });
      
      // Build dynamic portfolio from holdings with BATS codes
      const portfolioHoldings = holdings.filter(h => h.code && h.code.startsWith('BATS:'));
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
        const individualHoldings = holdings.map(holding => ({
          id: holding.id,
          name: holding.name,
          symbol: holding.code,
          created_at: holding.created_at,
          updated_at: holding.updated_at
        }));
        
        return [dynamicPortfolio, ...individualHoldings];
      }
      
      // Fallback to individual holdings only
      return holdings.map(holding => ({
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
   * Add a new portfolio holding
   */
  async addPortfolioHolding(name, code, quantity) {
    try {
      const result = await this.db.prepare(
        'INSERT INTO portfolio_holdings (name, code, quantity) VALUES (?, ?, ?)'
      ).bind(name, code, quantity).run();
      
      return result.success;
    } catch (error) {
      console.error('Error adding portfolio holding:', error);
      return false;
    }
  }

  /**
   * Update an existing portfolio holding
   */
  async updatePortfolioHolding(id, name, code, quantity) {
    try {
      const result = await this.db.prepare(
        'UPDATE portfolio_holdings SET name = ?, code = ?, quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
      ).bind(name, code, quantity, id).run();
      
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


}

/**
 * Mock D1 database for local development
 */
export class MockD1Database {
  constructor() {
    const now = new Date().toISOString();
    
    // Mock portfolio holdings data
    this.portfolioHoldings = [
      { id: 1, name: "Vgrd S&P 500", code: "BATS:VOO", quantity: 2, created_at: now, updated_at: now },
      { id: 2, name: "GS Gold", code: "BATS:AAAU", quantity: 27, created_at: now, updated_at: now },
      { id: 3, name: "Vgrd Ex US", code: "BATS:VXUS", quantity: 13, created_at: now, updated_at: now },
      { id: 4, name: "Vgrd S&P 500 Value", code: "BATS:VOOV", quantity: 3, created_at: now, updated_at: now },
      { id: 5, name: "Vgrd Mid Cap", code: "BATS:VO", quantity: 2, created_at: now, updated_at: now },
      { id: 6, name: "GOP", code: "BATS:GOP", quantity: 8, created_at: now, updated_at: now }
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
    // Portfolio holdings queries
    if (this.query.includes('SELECT * FROM portfolio_holdings') || 
        this.query.includes('SELECT id, name, code, quantity, created_at, updated_at FROM portfolio_holdings')) {
      return {
        results: this.mockDb.portfolioHoldings,
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
    
    return null;
  }

  async run() {
    // Handle INSERT operations for portfolio holdings
    if (this.query.includes('INSERT INTO portfolio_holdings')) {
      const [name, code, quantity] = this.bindings;
      const newId = Math.max(...this.mockDb.portfolioHoldings.map(h => h.id), 0) + 1;
      const now = new Date().toISOString();
      
      this.mockDb.portfolioHoldings.push({
        id: newId,
        name,
        code,
        quantity,
        created_at: now,
        updated_at: now
      });
      
      return { success: true };
    }
    
    // Handle UPDATE operations for portfolio holdings
    if (this.query.includes('UPDATE portfolio_holdings SET')) {
      const [name, code, quantity, id] = this.bindings;
      const holdingIndex = this.mockDb.portfolioHoldings.findIndex(h => h.id === id);
      
      if (holdingIndex !== -1) {
        this.mockDb.portfolioHoldings[holdingIndex] = {
          ...this.mockDb.portfolioHoldings[holdingIndex],
          name,
          code,
          quantity,
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