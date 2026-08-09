import { useState } from 'react';
import { 
  Play, Send, Database, FileText, Settings, 
  CheckCircle, XCircle, Clock, Loader2, Copy, ChevronDown, ChevronRight
} from 'lucide-react';
import {
  getTestVendor,
  updateVendorProfile,
  getVendorRestaurants,
  getVendorSettings,
  updateVendorSettings,
  createRestaurant,
  getRestaurantProfile,
  updateRestaurantProfile,
  submitVerification,
  getRestaurantVerifications,
  getVendorReviews,
  getVendorReviewStats,
  replyToReview,
  flagReview,
} from '../services/api';

export default function ApiTester() {
  const [results, setResults] = useState({});
  const [expandedSections, setExpandedSections] = useState({ vendor: true, restaurant: true, review: true });

  const runTest = async (key, fn, requestData = null) => {
    const startTime = Date.now();
    setResults(prev => ({
      ...prev,
      [key]: { loading: true, response: null, error: null, requestData, startTime }
    }));

    try {
      const response = await fn();
      const duration = Date.now() - startTime;
      setResults(prev => ({
        ...prev,
        [key]: {
          loading: false,
          response: response.data,
          error: null,
          requestData,
          status: response.status,
          duration,
        }
      }));
    } catch (error) {
      const duration = Date.now() - startTime;
      setResults(prev => ({
        ...prev,
        [key]: {
          loading: false,
          response: null,
          error: error.response?.data || { message: error.message },
          requestData,
          status: error.response?.status || 500,
          duration,
        }
      }));
    }
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const copyToClipboard = (data) => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    alert('Copied to clipboard!');
  };

  const getTestVendorId = () => results.getTestVendor?.response?.id || 'test-vendor-123';
  const getTestRestaurantId = () => results.getVendorRestaurants?.response?.[0]?.id || 'rest-001';
  const getTestReviewId = () => results.getVendorReviews?.response?.[0]?.id || 'rev-001';

  const testEndpoints = {
    vendor: [
      {
        key: 'getTestVendor',
        label: 'GET /vendors/test-vendor',
        description: 'Fetch test vendor profile',
        icon: Database,
        method: 'GET',
        test: () => runTest('getTestVendor', getTestVendor),
      },
      {
        key: 'getVendorRestaurants',
        label: 'GET /vendors/:id/restaurants',
        description: 'Fetch all restaurants for a vendor',
        icon: Database,
        method: 'GET',
        test: () => runTest('getVendorRestaurants', () => getVendorRestaurants(getTestVendorId())),
      },
      {
        key: 'getVendorSettings',
        label: 'GET /vendors/:id/settings',
        description: 'Fetch notification settings',
        icon: Settings,
        method: 'GET',
        test: () => runTest('getVendorSettings', () => getVendorSettings(getTestVendorId())),
      },
      {
        key: 'updateVendorSettings',
        label: 'PUT /vendors/:id/settings',
        description: 'Update notification preferences',
        icon: Send,
        method: 'PUT',
        requestBody: { emailAlerts: true, reviewAlerts: false },
        test: () => runTest('updateVendorSettings', 
          () => updateVendorSettings(getTestVendorId(), { emailAlerts: true, reviewAlerts: false }),
          { emailAlerts: true, reviewAlerts: false }
        ),
      },
    ],
    restaurant: [
      {
        key: 'createRestaurant',
        label: 'POST /restaurants',
        description: 'Create a new restaurant',
        icon: Send,
        method: 'POST',
        requestBody: {
            name: 'Test Restaurant',
            street: '999 Test St',
            city: 'Vancouver',
            zipcode: 'V6B 1A1',
            phone: '(604) 555-9999',
            email: 'test@example.com',
            cuisine: 'Canadian',
            priceLevel: 2,
            vendorId: 'test-vendor-123'
        },
        test: () => runTest('createRestaurant',
            () => createRestaurant({
            name: 'Test Restaurant',
            street: '999 Test St',
            city: 'Vancouver',
            zipcode: 'V6B 1A1',
            phone: '(604) 555-9999',
            email: 'test@example.com',
            cuisine: 'Canadian',
            priceLevel: 2,
            vendorId: getTestVendorId()
            }),
            { name: 'Test Restaurant', street: '999 Test St', city: 'Vancouver', zipcode: 'V6B 1A1', phone: '(604) 555-9999', email: 'test@example.com', cuisine: 'Canadian', priceLevel: 2 }
        ),
        },
      {
        key: 'getRestaurantProfile',
        label: 'GET /restaurants/:id',
        description: 'Fetch restaurant details',
        icon: Database,
        method: 'GET',
        test: () => runTest('getRestaurantProfile', () => getRestaurantProfile(getTestRestaurantId())),
      },
      {
        key: 'updateRestaurantProfile',
        label: 'PUT /restaurants/:id',
        description: 'Update restaurant info',
        icon: Send,
        method: 'PUT',
        requestBody: { phone: '(604) 555-9999', description: 'Updated via API tester' },
        test: () => runTest('updateRestaurantProfile',
          () => updateRestaurantProfile(getTestRestaurantId(), { phone: '(604) 555-9999', description: 'Updated via API tester' }),
          { phone: '(604) 555-9999', description: 'Updated via API tester' }
        ),
      },
      {
        key: 'submitVerification',
        label: 'POST /restaurants/:id/verification',
        description: 'Submit verification document',
        icon: FileText,
        method: 'POST',
        requestBody: { documentUrl: 'https://example.com/license.pdf' },
        test: () => runTest('submitVerification',
          () => submitVerification(getTestRestaurantId(), { documentUrl: 'https://example.com/license.pdf' }),
          { documentUrl: 'https://example.com/license.pdf' }
        ),
      },
      {
        key: 'getRestaurantVerifications',
        label: 'GET /restaurants/:id/verifications',
        description: 'Fetch verification history',
        icon: FileText,
        method: 'GET',
        test: () => runTest('getRestaurantVerifications', () => getRestaurantVerifications(getTestRestaurantId())),
      },
    ],
    review: [
      {
        key: 'getVendorReviews',
        label: 'GET /reviews',
        description: 'Fetch all reviews',
        icon: Database,
        method: 'GET',
        test: () => runTest('getVendorReviews', getVendorReviews),
      },
      {
        key: 'getVendorReviewStats',
        label: 'GET /reviews/statistics',
        description: 'Fetch review statistics',
        icon: Database,
        method: 'GET',
        test: () => runTest('getVendorReviewStats', getVendorReviewStats),
      },
      {
        key: 'replyToReview',
        label: 'POST /reviews/:id/reply',
        description: 'Submit vendor reply',
        icon: Send,
        method: 'POST',
        requestBody: { responseText: 'Thank you for your feedback!' },
        test: () => runTest('replyToReview',
          () => replyToReview(getTestReviewId(), 'Thank you for your feedback!'),
          { responseText: 'Thank you for your feedback!' }
        ),
      },
      {
        key: 'flagReview',
        label: 'POST /reviews/:id/flag',
        description: 'Flag inappropriate review',
        icon: Send,
        method: 'POST',
        requestBody: { reason: 'Inappropriate language' },
        test: () => runTest('flagReview',
          () => flagReview(getTestReviewId(), 'Inappropriate language'),
          { reason: 'Inappropriate language' }
        ),
      },
    ],
  };

  const sectionHeaders = {
    vendor: { label: 'Vendor APIs', icon: Database },
    restaurant: { label: 'Restaurant APIs', icon: FileText },
    review: { label: 'Review APIs', icon: FileText },
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h2 className="text-2xl font-bold text-white">API Tester</h2>
        <p className="text-gray-400 text-sm mt-1">
          Manually test all backend endpoints and inspect raw requests/responses
        </p>
      </div>

      {/* Endpoint sections */}
      <div className="space-y-4">
        {Object.entries(testEndpoints).map(([sectionKey, endpoints]) => {
          const sectionHeader = sectionHeaders[sectionKey];
          const SectionIcon = sectionHeader.icon;
          const isExpanded = expandedSections[sectionKey];

          return (
            <div key={sectionKey} className="bg-gray-800 rounded-xl border border-gray-700 shadow-lg overflow-hidden">
              {/* Section header */}
              <button
                onClick={() => toggleSection(sectionKey)}
                className="w-full flex items-center justify-between p-6 hover:bg-gray-700/50 transition"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gray-700 text-yellow-500">
                    <SectionIcon size={20} />
                  </div>
                  <h3 className="text-lg font-semibold text-white">{sectionHeader.label}</h3>
                </div>
                {isExpanded ? (
                  <ChevronDown className="text-gray-400" size={20} />
                ) : (
                  <ChevronRight className="text-gray-400" size={20} />
                )}
              </button>

              {/* Endpoint list */}
              {isExpanded && (
                <div className="border-t border-gray-700 divide-y divide-gray-700">
                  {endpoints.map((endpoint) => {
                    const result = results[endpoint.key];
                    const Icon = endpoint.icon;
                    const methodColors = {
                      GET: 'bg-blue-500/20 text-blue-400',
                      POST: 'bg-green-500/20 text-green-400',
                      PUT: 'bg-yellow-500/20 text-yellow-400',
                      DELETE: 'bg-red-500/20 text-red-400',
                    };

                    return (
                      <div key={endpoint.key} className="p-6">
                        {/* Endpoint header */}
                        <div className="flex items-start justify-between gap-4 mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-1">
                              <span className={`text-xs font-bold px-2 py-0.5 rounded ${methodColors[endpoint.method]}`}>
                                {endpoint.method}
                              </span>
                              <h4 className="text-white font-mono text-sm">{endpoint.label}</h4>
                            </div>
                            <p className="text-gray-400 text-sm">{endpoint.description}</p>
                          </div>
                          <button
                            onClick={endpoint.test}
                            disabled={result?.loading}
                            className="flex items-center gap-2 bg-yellow-500 text-gray-900 font-semibold px-4 py-2 rounded-md hover:bg-yellow-400 transition disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {result?.loading ? (
                              <Loader2 size={16} className="animate-spin" />
                            ) : (
                              <Play size={16} />
                            )}
                            {result?.loading ? 'Testing...' : 'Test'}
                          </button>
                        </div>

                        {/* Request body (if applicable) */}
                        {endpoint.requestBody && (
                          <div className="mb-4">
                            <div className="flex items-center justify-between mb-2">
                              <p className="text-xs font-semibold text-gray-500 uppercase">Request Body</p>
                              <button
                                onClick={() => copyToClipboard(endpoint.requestBody)}
                                className="text-gray-500 hover:text-yellow-500 transition"
                                title="Copy to clipboard"
                              >
                                <Copy size={14} />
                              </button>
                            </div>
                            <pre className="bg-gray-900 border border-gray-700 rounded-lg p-3 text-xs text-gray-300 overflow-x-auto">
                              {JSON.stringify(endpoint.requestBody, null, 2)}
                            </pre>
                          </div>
                        )}

                        {/* Response */}
                        {result && !result.loading && (
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <p className="text-xs font-semibold text-gray-500 uppercase">Response</p>
                                {result.status && (
                                  <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                                    result.status < 400
                                      ? 'bg-emerald-500/20 text-emerald-400'
                                      : 'bg-red-500/20 text-red-400'
                                  }`}>
                                    {result.status}
                                  </span>
                                )}
                                {result.duration && (
                                  <span className="flex items-center gap-1 text-xs text-gray-500">
                                    <Clock size={12} />
                                    {result.duration}ms
                                  </span>
                                )}
                              </div>
                              {result.response && (
                                <button
                                  onClick={() => copyToClipboard(result.response)}
                                  className="text-gray-500 hover:text-yellow-500 transition"
                                  title="Copy to clipboard"
                                >
                                  <Copy size={14} />
                                </button>
                              )}
                            </div>
                            <pre className={`bg-gray-900 border rounded-lg p-3 text-xs overflow-x-auto ${
                              result.error
                                ? 'border-red-500/50 text-red-300'
                                : 'border-gray-700 text-gray-300'
                            }`}>
                              {JSON.stringify(result.response || result.error, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}