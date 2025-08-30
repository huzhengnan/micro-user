const fetch = require('node-fetch');

async function testWebhookSimulation() {
  try {
    console.log('=== Testing Webhook Simulation ===');
    
    // Simulate the webhook payload that Creem would send
    const webhookPayload = {
      event_type: 'checkout.completed',
      checkout_id: 'ch_7U2AfH3n9SlxhIAd1U2ypN',
      request_id: 'sub_1756564359432_8d5f3e6d-193c-42f8-91f3-bec34b74b282',
      status: 'paid',
      amount: 19990,
      currency: 'USD',
      metadata: {
        userId: 'c8093a76-0aa3-41f2-bc4e-57de19216f19',
        planId: '141aabea-3349-46e5-9df8-c3f44a2033d7',
        planName: 'Standard Plan Yearly',
        planDuration: '365',
        monthlyPoints: '250',
        isSubscription: 'true',
        requestId: 'sub_1756564359432_8d5f3e6d-193c-42f8-91f3-bec34b74b282'
      }
    };
    
    console.log('Webhook payload:', JSON.stringify(webhookPayload, null, 2));
    
    const response = await fetch('http://localhost:3000/api/webhooks/creem', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(webhookPayload)
    });
    
    console