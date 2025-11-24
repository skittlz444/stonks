/**
 * API handlers for form submissions and data mutations
 */

/**
 * Handle configuration form submissions (add/update/delete holdings, transactions, settings)
 */
export async function handleConfigSubmission(request, databaseService) {
  let redirectUrl = '/config';
  const isAjax = request.headers.get('Accept')?.includes('application/json');
  
  try {
    const formData = await request.formData();
    const action = formData.get('action');
    switch (action) {
      case 'update_settings':
        const portfolioName = formData.get('portfolio_name');
        const cashAmount = parseFloat(formData.get('cash_amount'));
        
        await databaseService.updateCashAmount(cashAmount);
        
        // Update portfolio name
        await databaseService.db.prepare(
          'INSERT OR REPLACE INTO portfolio_settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)'
        ).bind('portfolio_name', portfolioName).run();
        
        break;
        
      case 'add_holding':
        const addName = formData.get('name');
        const addCode = formData.get('code');
        const addTargetWeight = formData.get('target_weight');
        const addTargetWeightValue = addTargetWeight && addTargetWeight.trim() !== '' ? parseFloat(addTargetWeight) : null;
        
        await databaseService.addPortfolioHolding(addName, addCode, addTargetWeightValue);
        break;
        
      case 'update_holding':
        const updateId = parseInt(formData.get('holding_id'));
        const updateName = formData.get('name');
        const updateCode = formData.get('code');
        const updateTargetWeight = formData.get('target_weight');
        const updateTargetWeightValue = updateTargetWeight && updateTargetWeight.trim() !== '' ? parseFloat(updateTargetWeight) : null;
        
        await databaseService.updatePortfolioHolding(updateId, updateName, updateCode, updateTargetWeightValue);
        break;
        
      case 'delete_holding':
        const deleteId = parseInt(formData.get('holding_id'));
        await databaseService.deletePortfolioHolding(deleteId);
        break;
        
      case 'toggle_visibility':
        const toggleId = parseInt(formData.get('holding_id'));
        await databaseService.toggleHoldingVisibility(toggleId);
        break;
        
      case 'add_transaction':
        const txnCode = formData.get('code');
        const txnType = formData.get('type');
        const txnDate = formData.get('date');
        const txnQuantity = parseFloat(formData.get('quantity'));
        const txnValue = parseFloat(formData.get('value'));
        const txnFee = parseFloat(formData.get('fee') || 0);
        
        await databaseService.addTransaction(txnCode, txnType, txnDate, txnQuantity, txnValue, txnFee);
        break;
        
      case 'delete_transaction':
        const deleteTxnId = parseInt(formData.get('transaction_id'));
        await databaseService.deleteTransaction(deleteTxnId);
        break;
        
      default:
        throw new Error('Invalid action');
    }
    
    // Return JSON response for AJAX requests, redirect for regular form submissions
    if (isAjax) {
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
  } catch (error) {
    console.error('Config submission error:', error);
    
    if (isAjax) {
      return new Response(JSON.stringify({ success: false, error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
  
  // Return redirect for regular form submissions (without query params)
  return new Response(null, {
    status: 302,
    headers: {
      'Location': redirectUrl
    }
  });
}
