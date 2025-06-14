
import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const App = () => {
  const [formData, setFormData] = useState({
    aws_instance: 't3.medium',
    gcp_instance: 'e2-standard-2',
    azure_instance: 'Standard_D2s_v3',
    hours: 24,
    storage_gb: 50,
    aws_region: 'us-east-1',
    gcp_region: 'us-central1',
    azure_region: 'eastus'
  });

  const [comparisonData, setComparisonData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [instanceTypes, setInstanceTypes] = useState({});

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'];

  useEffect(() => {
    fetchInstanceTypes();
  }, []);

  const fetchInstanceTypes = async () => {
    try {
      const providers = ['aws', 'gcp', 'azure'];
      const types = {};
      
      for (const provider of providers) {
        const response = await fetch(`http://localhost:8000/instances/${provider}`);
        if (response.ok) {
          types[provider] = await response.json();
        }
      }
      setInstanceTypes(types);
    } catch (err) {
      console.error('Failed to fetch instance types:', err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams({
        instance_aws: formData.aws_instance,
        instance_gcp: formData.gcp_instance,
        instance_azure: formData.azure_instance,
        hours: formData.hours,
        storage_gb: formData.storage_gb,
        aws_region: formData.aws_region,
        gcp_region: formData.gcp_region,
        azure_region: formData.azure_region
      });

      const response = await fetch(`http://localhost:8000/compare?${queryParams}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch comparison data');
      }

      const data = await response.json();
      setComparisonData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatChartData = () => {
    if (!comparisonData) return [];
    
    return Object.entries(comparisonData.results).map(([provider, data]) => ({
      provider: provider.toUpperCase(),
      compute: data.compute_cost,
      storage: data.storage_cost,
      total: data.total_cost,
      instance: data.instance_type
    }));
  };

  const formatPieData = () => {
    if (!comparisonData) return [];
    
    return Object.entries(comparisonData.results).map(([provider, data]) => ({
      name: provider.toUpperCase(),
      value: data.total_cost,
      color: COLORS[Object.keys(comparisonData.results).indexOf(provider)]
    }));
  };

  const renderInstanceOptions = (provider) => {
    const providerData = instanceTypes[provider];
    if (!providerData) return null;

    return Object.entries(providerData.instance_families).map(([family, instances]) => (
      <optgroup key={family} label={family.replace('_', ' ').toUpperCase()}>
        {instances.map(instance => (
          <option key={instance} value={instance}>{instance}</option>
        ))}
      </optgroup>
    ));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-violet-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-purple-600 to-violet-600 rounded-2xl mb-6 shadow-xl">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
            </svg>
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Cloud Price Calculator
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Compare real-time pricing across AWS, GCP, and Azure with enterprise-grade precision
          </p>
        </div>

        {/* Main Content */}
        <div className="space-y-8">
          {/* Form Section */}
          <div className="bg-white rounded-3xl shadow-xl border border-purple-100 p-8">
            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">Configuration</h2>
              <p className="text-gray-600">Select your cloud instances and usage parameters</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Instance Selection Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl p-6 border border-orange-200">
                  <div className="flex items-center mb-4">
                    <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center mr-3">
                      <span className="text-white font-bold text-sm">AWS</span>
                    </div>
                    <label className="text-lg font-semibold text-gray-900">AWS Instance</label>
                  </div>
                  <select
                    name="aws_instance"
                    value={formData.aws_instance}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-white border border-orange-300 rounded-xl text-gray-900 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
                  >
                    {renderInstanceOptions('aws')}
                  </select>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 border border-blue-200">
                  <div className="flex items-center mb-4">
                    <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center mr-3">
                      <span className="text-white font-bold text-sm">GCP</span>
                    </div>
                    <label className="text-lg font-semibold text-gray-900">GCP Instance</label>
                  </div>
                  <select
                    name="gcp_instance"
                    value={formData.gcp_instance}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-white border border-blue-300 rounded-xl text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  >
                    {renderInstanceOptions('gcp')}
                  </select>
                </div>

                <div className="bg-gradient-to-br from-cyan-50 to-cyan-100 rounded-2xl p-6 border border-cyan-200">
                  <div className="flex items-center mb-4">
                    <div className="w-8 h-8 bg-cyan-500 rounded-lg flex items-center justify-center mr-3">
                      <span className="text-white font-bold text-sm">AZ</span>
                    </div>
                    <label className="text-lg font-semibold text-gray-900">Azure Instance</label>
                  </div>
                  <select
                    name="azure_instance"
                    value={formData.azure_instance}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-white border border-cyan-300 rounded-xl text-gray-900 focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-200"
                  >
                    {renderInstanceOptions('azure')}
                  </select>
                </div>
              </div>

              {/* Usage Parameters */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-purple-50 rounded-2xl p-6 border border-purple-200">
                  <label className="block text-lg font-semibold text-gray-900 mb-3">
                    <div className="flex items-center">
                      <svg className="w-5 h-5 text-purple-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Hours Running
                    </div>
                  </label>
                  <input
                    type="number"
                    name="hours"
                    value={formData.hours}
                    onChange={handleInputChange}
                    min="1"
                    step="0.1"
                    className="w-full px-4 py-3 bg-white border border-purple-300 rounded-xl text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                  />
                </div>

                <div className="bg-purple-50 rounded-2xl p-6 border border-purple-200">
                  <label className="block text-lg font-semibold text-gray-900 mb-3">
                    <div className="flex items-center">
                      <svg className="w-5 h-5 text-purple-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                      </svg>
                      Storage (GB)
                    </div>
                  </label>
                  <input
                    type="number"
                    name="storage_gb"
                    value={formData.storage_gb}
                    onChange={handleInputChange}
                    min="0"
                    step="1"
                    className="w-full px-4 py-3 bg-white border border-purple-300 rounded-xl text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                  />
                </div>
              </div>

              {/* Region Selection Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-3">
                  <label className="block text-lg font-semibold text-gray-900">AWS Region</label>
                  <select
                    name="aws_region"
                    value={formData.aws_region}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                  >
                    <option value="us-east-1">US East (N. Virginia)</option>
                    <option value="us-east-2">US East (Ohio)</option>
                    <option value="us-west-1">US West (N. California)</option>
                    <option value="us-west-2">US West (Oregon)</option>
                    <option value="eu-west-1">Europe (Ireland)</option>
                    <option value="eu-central-1">Europe (Frankfurt)</option>
                  </select>
                </div>

                <div className="space-y-3">
                  <label className="block text-lg font-semibold text-gray-900">GCP Region</label>
                  <select
                    name="gcp_region"
                    value={formData.gcp_region}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                  >
                    <option value="us-central1">US Central (Iowa)</option>
                    <option value="us-east1">US East (South Carolina)</option>
                    <option value="us-west1">US West (Oregon)</option>
                    <option value="europe-west1">Europe West (Belgium)</option>
                    <option value="asia-east1">Asia East (Taiwan)</option>
                  </select>
                </div>

                <div className="space-y-3">
                  <label className="block text-lg font-semibold text-gray-900">Azure Region</label>
                  <select
                    name="azure_region"
                    value={formData.azure_region}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                  >
                    <option value="eastus">East US</option>
                    <option value="eastus2">East US 2</option>
                    <option value="westus">West US</option>
                    <option value="westus2">West US 2</option>
                    <option value="westeurope">West Europe</option>
                    <option value="northeurope">North Europe</option>
                  </select>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-center pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="group relative px-12 py-4 bg-gradient-to-r from-purple-600 via-violet-600 to-purple-700 text-white font-semibold rounded-2xl shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {loading ? (
                    <div className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Calculating Prices...
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <svg className="w-5 h-5 mr-3 group-hover:scale-110 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      Compare Prices
                    </div>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.734 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-red-800 font-medium">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Results Section */}
          {comparisonData && (
            <div className="space-y-8">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl p-8 text-white shadow-2xl">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-2xl font-bold mb-2">Cheapest Option</h3>
                      <p className="text-emerald-100">Best value for your configuration</p>
                    </div>
                    <div className="w-16 h-16 bg-white bg-opacity-20 rounded-2xl flex items-center justify-center">
                      <svg className="w-8 h-8 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold mb-2">{comparisonData.comparison.cheapest_provider.toUpperCase()}</p>
                    <p className="text-4xl font-black">${comparisonData.comparison.cost_breakdown[comparisonData.comparison.cheapest_provider]}</p>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-3xl p-8 text-white shadow-2xl">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-2xl font-bold mb-2">Potential Savings</h3>
                      <p className="text-amber-100">Choose wisely and save money</p>
                    </div>
                    <div className="w-16 h-16 bg-white bg-opacity-20 rounded-2xl flex items-center justify-center">
                      <svg className="w-8 h-8 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-4xl font-black mb-2">${comparisonData.comparison.max_savings}</p>
                    <p className="text-2xl font-bold">{comparisonData.comparison.percentage_savings}% savings</p>
                  </div>
                </div>
              </div>

              {/* Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white rounded-3xl shadow-xl border border-purple-100 p-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">Cost Breakdown by Provider</h3>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={formatChartData()}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                        <XAxis 
                          dataKey="provider" 
                          stroke="#6B7280"
                          fontSize={12}
                          fontWeight={600}
                        />
                        <YAxis 
                          stroke="#6B7280"
                          fontSize={12}
                        />
                        <Tooltip 
                          contentStyle={{
                            backgroundColor: 'white',
                            border: '1px solid #E5E7EB',
                            borderRadius: '12px',
                            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)'
                          }}
                          formatter={(value, name) => [`$${value.toFixed(2)}`, name]}
                        />
                        <Bar dataKey="compute" stackId="a" fill="#8B5CF6" name="Compute" radius={[0, 0, 4, 4]} />
                        <Bar dataKey="storage" stackId="a" fill="#A855F7" name="Storage" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-white rounded-3xl shadow-xl border border-purple-100 p-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">Total Cost Distribution</h3>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={formatPieData()}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, value }) => `${name}: $${value.toFixed(2)}`}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {formatPieData().map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{
                            backgroundColor: 'white',
                            border: '1px solid #E5E7EB',
                            borderRadius: '12px',
                            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)'
                          }}
                          formatter={(value) => [`$${value.toFixed(2)}`, 'Total Cost']}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Detailed Results */}
              <div className="bg-white rounded-3xl shadow-xl border border-purple-100 p-8">
                <div className="mb-8 text-center">
                  <h3 className="text-3xl font-bold text-gray-900 mb-2">Detailed Breakdown</h3>
                  <p className="text-gray-600">Complete cost analysis for each cloud provider</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {Object.entries(comparisonData.results).map(([provider, data], index) => {
                    const providerColors = {
                      aws: 'from-orange-500 to-red-500',
                      gcp: 'from-blue-500 to-indigo-500',
                      azure: 'from-cyan-500 to-blue-500'
                    };
                    
                    const isWinner = provider === comparisonData.comparison.cheapest_provider;
                    
                    return (
                      <div 
                        key={provider}
                        className={`relative bg-gradient-to-br ${providerColors[provider]} rounded-3xl p-8 text-white shadow-2xl transform transition-all duration-300 hover:scale-105 ${isWinner ? 'ring-4 ring-yellow-400 ring-opacity-60' : ''}`}
                      >
                        {isWinner && (
                          <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                            <div className="bg-yellow-400 text-yellow-900 px-4 py-2 rounded-full text-sm font-bold flex items-center">
                              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                              BEST VALUE
                            </div>
                          </div>
                        )}
                        
                        <div className="text-center mb-6">
                          <h4 className="text-2xl font-bold mb-2">{provider.toUpperCase()}</h4>
                          <div className="bg-white bg-opacity-20 rounded-xl px-4 py-2 inline-block">
                            <span className="text-sm font-mono text-black">{data.instance_type}</span>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div className="flex justify-between items-center py-2 border-b border-white border-opacity-20">
                            <span className="text-white text-opacity-90">Compute Cost</span>
                            <span className="font-bold text-white">${data.compute_cost.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between items-center py-2 border-b border-white border-opacity-20">
                            <span className="text-white text-opacity-90">Storage Cost</span>
                            <span className="font-bold text-white">${data.storage_cost.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between items-center py-3 bg-white bg-opacity-20 rounded-xl px-4">
                            <span className="font-bold text-lg text-black">Total Cost</span>
                            <span className="font-black text-2xl text-black">${data.total_cost.toFixed(2)}</span>
                          </div>
                        </div>

                        <div className="mt-6 pt-6 border-t border-white border-opacity-20">
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-white text-opacity-70 block">Region</span>
                              <span className="font-semibold text-white">{data.region}</span>
                            </div>
                            <div>
                              <span className="text-white text-opacity-70 block">Hours</span>
                              <span className="font-semibold text-white">{data.hours_running}h</span>
                            </div>
                            <div className="col-span-2">
                              <span className="text-white text-opacity-70 block">Storage</span>
                              <span className="font-semibold text-white">{data.storage_gb} GB</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;