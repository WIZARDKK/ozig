// Test script to verify exchange analytics endpoint
const API_BASE_URL = 'http://localhost:4000/api';

async function testExchangeAnalytics() {
  try {
    console.log('Testing exchange analytics endpoint...');
    
    const response = await fetch(`${API_BASE_URL}/exchanges/analytics/dashboard`);
    
    if (!response.ok) {
      console.error('Response not OK:', response.status, response.statusText);
      return;
    }
    
    const data = await response.json();
    console.log('Exchange Analytics Data:', JSON.stringify(data, null, 2));
    
    if (data.success) {
      console.log('\n✅ Success! Analytics data received:');
      console.log(`Total Exchanges: ${data.data.totalExchanges}`);
      console.log(`Total Value: ${data.data.totalValue}`);
      console.log(`Average Value: ${data.data.avgExchangeValue}`);
      console.log(`Exchange Rate: ${(data.data.exchangeRate * 100).toFixed(1)}%`);
    } else {
      console.log('❌ Request failed:', data.error);
    }
    
  } catch (error) {
    console.error('❌ Error testing endpoint:', error);
  }
}

// Run the test
testExchangeAnalytics();