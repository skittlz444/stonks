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
   * Get all holdings as structured objects
   */
  async getHoldings() {
    try {
      const result = await this.db.prepare(
        'SELECT id, name, symbol, created_at, updated_at FROM holdings ORDER BY id'
      ).all();
      
      return result.results || [];
      
    } catch (error) {
      console.error('Error fetching holdings:', error);
      return [];
    }
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
   * Add a new holding
   */
  async addHolding(name, symbol) {
    try {
      const result = await this.db.prepare(
        'INSERT INTO holdings (name, symbol) VALUES (?, ?)'
      ).bind(name, symbol).run();
      
      return result.success;
    } catch (error) {
      console.error('Error adding holding:', error);
      return false;
    }
  }

  /**
   * Update an existing holding
   */
  async updateHolding(id, name, symbol) {
    try {
      const result = await this.db.prepare(
        'UPDATE holdings SET name = ?, symbol = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
      ).bind(name, symbol, id).run();
      
      return result.success;
    } catch (error) {
      console.error('Error updating holding:', error);
      return false;
    }
  }

  /**
   * Delete a holding
   */
  async deleteHolding(id) {
    try {
      const result = await this.db.prepare(
        'DELETE FROM holdings WHERE id = ?'
      ).bind(id).run();
      
      return result.success;
    } catch (error) {
      console.error('Error deleting holding:', error);
      return false;
    }
  }


}

/**
 * Mock D1 database for local development
 */
export class MockD1Database {
  constructor() {
    const now = new Date().toISOString();
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
    return new MockPreparedStatement(query, this.holdings);
  }
}

class MockPreparedStatement {
  constructor(query, holdings) {
    this.query = query;
    this.holdings = holdings;
    this.bindings = [];
  }

  bind(...args) {
    this.bindings = args;
    return this;
  }

  async all() {
    if (this.query.includes('SELECT id, name, symbol, created_at, updated_at FROM holdings') || 
        this.query.includes('SELECT name, symbol FROM holdings')) {
      return {
        results: this.holdings,
        success: true
      };
    }
    return { results: [], success: true };
  }

  async run() {
    return { success: true };
  }
}