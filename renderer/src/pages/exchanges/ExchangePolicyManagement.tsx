import React, { useState, useEffect } from 'react';
import { Save, Plus, Edit2, Trash2, AlertTriangle, CheckCircle, Clock, DollarSign, Calendar, Users, Shield } from 'lucide-react';

interface ExchangePolicy {
  id: number;
  name: string;
  description: string;
  isActive: boolean;
  rules: ExchangePolicyRule[];
  createdAt: string;
  updatedAt: string;
}

interface ExchangePolicyRule {
  id: number;
  type: 'timeLimit' | 'valueLimit' | 'categoryRestriction' | 'conditionRequirement' | 'approvalRequired';
  condition: string;
  value: string | number;
  description: string;
  isActive: boolean;
}

const ExchangePolicyManagement: React.FC = () => {
  const [policies, setPolicies] = useState<ExchangePolicy[]>([]);
  const [showAddPolicy, setShowAddPolicy] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<ExchangePolicy | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadPolicies();
  }, []);

  const loadPolicies = async () => {
    // Mock data - replace with actual API call
    const mockPolicies: ExchangePolicy[] = [
      {
        id: 1,
        name: 'Standard Exchange Policy',
        description: 'Default exchange policy for regular items',
        isActive: true,
        rules: [
          {
            id: 1,
            type: 'timeLimit',
            condition: 'within_days',
            value: 30,
            description: 'Item must be exchanged within 30 days of purchase',
            isActive: true
          },
          {
            id: 2,
            type: 'valueLimit',
            condition: 'max_difference',
            value: 5000,
            description: 'Maximum additional payment allowed: LKR 5,000',
            isActive: true
          },
          {
            id: 3,
            type: 'conditionRequirement',
            condition: 'original_condition',
            value: 'unused_with_tags',
            description: 'Item must be in original condition with tags attached',
            isActive: true
          }
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 2,
        name: 'Premium Customer Policy',
        description: 'Enhanced exchange terms for VIP customers',
        isActive: true,
        rules: [
          {
            id: 4,
            type: 'timeLimit',
            condition: 'within_days',
            value: 60,
            description: 'Extended 60-day exchange period for premium customers',
            isActive: true
          },
          {
            id: 5,
            type: 'valueLimit',
            condition: 'max_difference',
            value: 10000,
            description: 'Higher additional payment limit: LKR 10,000',
            isActive: true
          }
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 3,
        name: 'Sale Items Policy',
        description: 'Restricted exchange policy for discounted items',
        isActive: true,
        rules: [
          {
            id: 6,
            type: 'timeLimit',
            condition: 'within_days',
            value: 7,
            description: 'Sale items have only 7-day exchange window',
            isActive: true
          },
          {
            id: 7,
            type: 'approvalRequired',
            condition: 'manager_approval',
            value: 'required',
            description: 'All sale item exchanges require manager approval',
            isActive: true
          }
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
    
    setPolicies(mockPolicies);
  };

  const getRuleIcon = (type: string) => {
    switch (type) {
      case 'timeLimit': return <Clock className="h-4 w-4 text-blue-600" />;
      case 'valueLimit': return <DollarSign className="h-4 w-4 text-green-600" />;
      case 'categoryRestriction': return <Shield className="h-4 w-4 text-purple-600" />;
      case 'conditionRequirement': return <CheckCircle className="h-4 w-4 text-orange-600" />;
      case 'approvalRequired': return <Users className="h-4 w-4 text-red-600" />;
      default: return <AlertTriangle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getRuleTypeLabel = (type: string) => {
    switch (type) {
      case 'timeLimit': return 'Time Limit';
      case 'valueLimit': return 'Value Limit';
      case 'categoryRestriction': return 'Category Restriction';
      case 'conditionRequirement': return 'Condition Requirement';
      case 'approvalRequired': return 'Approval Required';
      default: return 'Unknown';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Exchange Policies</h3>
          <p className="text-sm text-gray-600">Configure business rules and restrictions for exchanges</p>
        </div>
        <button
          onClick={() => setShowAddPolicy(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
        >
          <Plus size={20} />
          Add Policy
        </button>
      </div>

      {/* Policy Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {policies.map((policy) => (
          <div key={policy.id} className="bg-white rounded-lg shadow border">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <h4 className="text-lg font-medium text-gray-900">{policy.name}</h4>
                  {policy.isActive && (
                    <span className="ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                      Active
                    </span>
                  )}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setEditingPolicy(policy)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button className="text-gray-400 hover:text-red-600">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <p className="text-sm text-gray-600 mb-4">{policy.description}</p>

              <div className="space-y-3">
                <div className="text-sm font-medium text-gray-900">Rules ({policy.rules.length})</div>
                {policy.rules.slice(0, 3).map((rule) => (
                  <div key={rule.id} className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-0.5">
                      {getRuleIcon(rule.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-medium text-gray-700">
                          {getRuleTypeLabel(rule.type)}
                        </span>
                        {rule.isActive && (
                          <CheckCircle className="h-3 w-3 text-green-500" />
                        )}
                      </div>
                      <p className="text-xs text-gray-600 mt-1">{rule.description}</p>
                    </div>
                  </div>
                ))}
                {policy.rules.length > 3 && (
                  <div className="text-xs text-gray-500 text-center">
                    +{policy.rules.length - 3} more rules
                  </div>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Created: {new Date(policy.createdAt).toLocaleDateString()}</span>
                  <span>Updated: {new Date(policy.updatedAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Default System Policies */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h4 className="text-lg font-medium text-gray-900">System-Wide Exchange Rules</h4>
          <p className="text-sm text-gray-600">Core business rules that apply to all exchanges</p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h5 className="font-medium text-gray-900">Business Rules</h5>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="text-sm font-medium">Receipt Required</span>
                  </div>
                  <span className="text-xs text-gray-500">Mandatory</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Clock className="h-5 w-5 text-blue-600" />
                    <span className="text-sm font-medium">Exchange Window</span>
                  </div>
                  <span className="text-xs text-gray-500">Policy Dependent</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <DollarSign className="h-5 w-5 text-green-600" />
                    <span className="text-sm font-medium">Value Verification</span>
                  </div>
                  <span className="text-xs text-gray-500">Automatic</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h5 className="font-medium text-gray-900">Approval Thresholds</h5>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <AlertTriangle className="h-5 w-5 text-yellow-600" />
                    <span className="text-sm font-medium">High Value ({'>'}LKR 10,000)</span>
                  </div>
                  <span className="text-xs text-yellow-700">Manager Approval</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Shield className="h-5 w-5 text-red-600" />
                    <span className="text-sm font-medium">Exceptional Cases</span>
                  </div>
                  <span className="text-xs text-red-700">Senior Manager</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Users className="h-5 w-5 text-blue-600" />
                    <span className="text-sm font-medium">Bulk Exchanges</span>
                  </div>
                  <span className="text-xs text-blue-700">Supervisor</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <div>
                <h6 className="font-medium text-gray-900">Policy Enforcement</h6>
                <p className="text-sm text-gray-600">These rules are automatically enforced by the system</p>
              </div>
              <button className="bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-700">
                <Edit2 size={16} />
                Configure
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Policy Templates */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h4 className="text-lg font-medium text-gray-900">Policy Templates</h4>
          <p className="text-sm text-gray-600">Quick-start templates for common exchange scenarios</p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                name: 'Strict Policy',
                description: '7-day limit, original condition required',
                icon: Shield,
                color: 'red'
              },
              {
                name: 'Standard Policy', 
                description: '30-day limit, flexible conditions',
                icon: CheckCircle,
                color: 'green'
              },
              {
                name: 'Flexible Policy',
                description: '60-day limit, liberal conditions',
                icon: Clock,
                color: 'blue'
              }
            ].map((template, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex items-center space-x-3 mb-3">
                  <div className={`p-2 rounded-lg bg-${template.color}-100`}>
                    <template.icon className={`h-5 w-5 text-${template.color}-600`} />
                  </div>
                  <div>
                    <h6 className="font-medium text-gray-900">{template.name}</h6>
                    <p className="text-sm text-gray-600">{template.description}</p>
                  </div>
                </div>
                <button className="w-full text-center text-sm text-blue-600 hover:text-blue-800">
                  Use Template
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExchangePolicyManagement;