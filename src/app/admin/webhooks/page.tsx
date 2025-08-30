'use client';

import { useState, useEffect } from 'react';

interface WebhookConfig {
  webhookUrl: string | null;
  hasSecret: boolean;
  enabled: boolean;
}

export default function WebhookAdminPage() {
  const [config, setConfig] = useState<WebhookConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  const [formData, setFormData] = useState({
    webhookUrl: '',
    webhookSecret: '',
    enabled: true,
  });

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const response = await fetch('/api/webhooks/dingtalk', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setConfig(data);
        setFormData({
          webhookUrl: data.webhookUrl || '',
          webhookSecret: '',
          enabled: data.enabled,
        });
      } else {
        setMessage({ type: 'error', text: 'Failed to load webhook configuration' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to load webhook configuration' });
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch('/api/webhooks/dingtalk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Webhook configuration saved successfully' });
        loadConfig();
      } else {
        const error = await response.json();
        setMessage({ type: 'error', text: error.error || 'Failed to save configuration' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save configuration' });
    } finally {
      setSaving(false);
    }
  };

  const testWebhook = async () => {
    setTesting(true);
    setMessage(null);

    try {
      const response = await fetch('/api/webhooks/dingtalk/test', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        setMessage({ type: 'success', text: 'Test message sent successfully!' });
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to send test message' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to test webhook' });
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading webhook configuration...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">DingTalk Webhook Configuration</h1>
            <p className="mt-2 text-gray-600">
              Configure DingTalk webhook notifications for user events (login, registration, payment, generation)
            </p>
          </div>

          <div className="px-6 py-6">
            {message && (
              <div className={`mb-6 p-4 rounded-md ${
                message.type === 'success' 
                  ? 'bg-green-50 border border-green-200 text-green-800' 
                  : 'bg-red-50 border border-red-200 text-red-800'
              }`}>
                {message.text}
              </div>
            )}

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Webhook URL
                </label>
                <input
                  type="url"
                  value={formData.webhookUrl}
                  onChange={(e) => setFormData({ ...formData, webhookUrl: e.target.value })}
                  placeholder="https://oapi.dingtalk.com/robot/send?access_token=..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="mt-1 text-sm text-gray-500">
                  Your DingTalk robot webhook URL
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Webhook Secret (Optional)
                </label>
                <input
                  type="password"
                  value={formData.webhookSecret}
                  onChange={(e) => setFormData({ ...formData, webhookSecret: e.target.value })}
                  placeholder="Enter webhook secret for additional security"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="mt-1 text-sm text-gray-500">
                  Optional secret for webhook signature verification
                </p>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="enabled"
                  checked={formData.enabled}
                  onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="enabled" className="ml-2 block text-sm text-gray-900">
                  Enable webhook notifications
                </label>
              </div>

              <div className="flex space-x-4">
                <button
                  onClick={saveConfig}
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Saving...' : 'Save Configuration'}
                </button>

                <button
                  onClick={testWebhook}
                  disabled={testing || !formData.webhookUrl}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {testing ? 'Testing...' : 'Test Webhook'}
                </button>
              </div>
            </div>

            <div className="mt-8 border-t border-gray-200 pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Current Status</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 p-4 rounded-md">
                  <div className="text-sm font-medium text-gray-500">Webhook URL</div>
                  <div className="mt-1 text-sm text-gray-900">
                    {config?.webhookUrl ? '✅ Configured' : '❌ Not configured'}
                  </div>
                </div>
                <div className="bg-gray-50 p-4 rounded-md">
                  <div className="text-sm font-medium text-gray-500">Secret</div>
                  <div className="mt-1 text-sm text-gray-900">
                    {config?.hasSecret ? '✅ Configured' : '❌ Not configured'}
                  </div>
                </div>
                <div className="bg-gray-50 p-4 rounded-md">
                  <div className="text-sm font-medium text-gray-500">Status</div>
                  <div className="mt-1 text-sm text-gray-900">
                    {config?.enabled ? '✅ Enabled' : '❌ Disabled'}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 border-t border-gray-200 pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Event Types</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-blue-50 p-4 rounded-md">
                  <div className="text-sm font-medium text-blue-900">User Events</div>
                  <ul className="mt-2 text-sm text-blue-800">
                    <li>• User Registration</li>
                    <li>• User Login</li>
                  </ul>
                </div>
                <div className="bg-green-50 p-4 rounded-md">
                  <div className="text-sm font-medium text-green-900">Business Events</div>
                  <ul className="mt-2 text-sm text-green-800">
                    <li>• Payment Success</li>
                    <li>• AI Generation Tasks</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}