'use client';

import React, { useState, useEffect } from 'react';
import { NotificationType, NOTIFICATION_TYPE_LABELS } from '@/types/notification';
import { getUserNotificationPreferences, updateUserNotificationPreferences } from '@/services/notification/notificationClient';

interface NotificationPreference {
  type: NotificationType;
  inApp: boolean;
  email: boolean;
  sms: boolean;
}

const NotificationPreferences: React.FC = () => {
  const [preferences, setPreferences] = useState<NotificationPreference[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Fetch user notification preferences
  useEffect(() => {
    const fetchPreferences = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getUserNotificationPreferences();
        setPreferences(data);
      } catch (err) {
        setError('Failed to load notification preferences');
        console.error('Error fetching notification preferences:', err);

        // Set default preferences if fetch fails
        const defaultPreferences = Object.values(NotificationType).map(type => ({
          type,
          inApp: true,
          email: type === NotificationType.CASE_APPROVED ||
                 type === NotificationType.CASE_REJECTED ||
                 type === NotificationType.ACTION_REQUIRED,
          sms: false
        }));
        setPreferences(defaultPreferences);
      } finally {
        setLoading(false);
      }
    };

    fetchPreferences();
  }, []);

  // Handle preference change
  const handlePreferenceChange = (
    type: NotificationType,
    channel: 'inApp' | 'email' | 'sms',
    checked: boolean
  ) => {
    setPreferences(prevPreferences =>
      prevPreferences.map(pref =>
        pref.type === type ? { ...pref, [channel]: checked } : pref
      )
    );
  };

  // Save preferences
  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      await updateUserNotificationPreferences(preferences);
      setSuccess('Notification preferences saved successfully');
    } catch (err) {
      setError('Failed to save notification preferences');
      console.error('Error saving notification preferences:', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-4 text-center text-gray-600">Loading notification preferences...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-medium text-gray-900">Notification Preferences</h2>
        <p className="mt-1 text-sm text-gray-600">
          Choose how you want to receive notifications for different events.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border-l-4 border-red-500">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-50 border-l-4 border-green-500">
          <p className="text-sm text-green-700">{success}</p>
        </div>
      )}

      <div className="p-6">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Notification Type
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  In-App
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  SMS
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {preferences.map((pref) => (
                <tr key={pref.type}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {NOTIFICATION_TYPE_LABELS[pref.type]}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <input
                      type="checkbox"
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      checked={pref.inApp}
                      onChange={(e) => handlePreferenceChange(pref.type, 'inApp', e.target.checked)}
                      title={`Receive in-app notifications for ${NOTIFICATION_TYPE_LABELS[pref.type]}`}
                      aria-label={`Receive in-app notifications for ${NOTIFICATION_TYPE_LABELS[pref.type]}`}
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <input
                      type="checkbox"
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      checked={pref.email}
                      onChange={(e) => handlePreferenceChange(pref.type, 'email', e.target.checked)}
                      title={`Receive email notifications for ${NOTIFICATION_TYPE_LABELS[pref.type]}`}
                      aria-label={`Receive email notifications for ${NOTIFICATION_TYPE_LABELS[pref.type]}`}
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <input
                      type="checkbox"
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      checked={pref.sms}
                      onChange={(e) => handlePreferenceChange(pref.type, 'sms', e.target.checked)}
                      title={`Receive SMS notifications for ${NOTIFICATION_TYPE_LABELS[pref.type]}`}
                      aria-label={`Receive SMS notifications for ${NOTIFICATION_TYPE_LABELS[pref.type]}`}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </>
            ) : 'Save Preferences'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationPreferences;
