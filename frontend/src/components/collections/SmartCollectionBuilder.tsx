'use client';

import React, { useState } from 'react';
import { SmartCollectionRule } from '@/types/collection';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Plus,
  Trash2,
  Hash,
  Calendar,
  Tag,
  Type,
  User,
  HardDrive,
  CheckCircle,
  Filter,
} from 'lucide-react';

interface SmartCollectionBuilderProps {
  rules: SmartCollectionRule[];
  onRulesChange: (rules: SmartCollectionRule[]) => void;
}

const FIELD_OPTIONS = [
  { value: 'title', label: 'Title', icon: Type },
  { value: 'type', label: 'File Type', icon: Hash },
  { value: 'tags', label: 'Tags', icon: Tag },
  { value: 'createdAt', label: 'Created Date', icon: Calendar },
  { value: 'updatedAt', label: 'Updated Date', icon: Calendar },
  { value: 'creator', label: 'Creator', icon: User },
  { value: 'size', label: 'File Size', icon: HardDrive },
  { value: 'status', label: 'Status', icon: CheckCircle },
  { value: 'customField', label: 'Custom Field', icon: Filter },
];

const OPERATOR_OPTIONS = {
  text: [
    { value: 'equals', label: 'equals' },
    { value: 'contains', label: 'contains' },
    { value: 'startsWith', label: 'starts with' },
    { value: 'endsWith', label: 'ends with' },
    { value: 'not', label: 'does not equal' },
    { value: 'regex', label: 'matches regex' },
  ],
  number: [
    { value: 'equals', label: 'equals' },
    { value: 'greaterThan', label: 'greater than' },
    { value: 'lessThan', label: 'less than' },
    { value: 'between', label: 'between' },
  ],
  date: [
    { value: 'equals', label: 'is exactly' },
    { value: 'greaterThan', label: 'is after' },
    { value: 'lessThan', label: 'is before' },
    { value: 'between', label: 'is between' },
  ],
  array: [
    { value: 'contains', label: 'contains' },
    { value: 'in', label: 'is one of' },
    { value: 'not', label: 'does not contain' },
  ],
  select: [
    { value: 'equals', label: 'is' },
    { value: 'not', label: 'is not' },
    { value: 'in', label: 'is one of' },
  ],
  boolean: [
    { value: 'exists', label: 'exists' },
    { value: 'not', label: 'does not exist' },
  ],
};

const FILE_TYPES = ['video', 'image', 'audio', 'document', 'other'];
const STATUS_OPTIONS = ['draft', 'review', 'approved', 'published', 'archived'];

export function SmartCollectionBuilder({ rules, onRulesChange }: SmartCollectionBuilderProps) {
  const addRule = () => {
    const newRule: SmartCollectionRule = {
      id: crypto.randomUUID(),
      field: 'title',
      operator: 'contains',
      value: '',
    };
    onRulesChange([...rules, newRule]);
  };

  const updateRule = (ruleId: string, updates: Partial<SmartCollectionRule>) => {
    onRulesChange(
      rules.map(rule =>
        rule.id === ruleId ? { ...rule, ...updates } : rule
      )
    );
  };

  const deleteRule = (ruleId: string) => {
    onRulesChange(rules.filter(rule => rule.id !== ruleId));
  };

  const getOperatorsForField = (field: string) => {
    switch (field) {
      case 'title':
      case 'creator':
      case 'customField':
        return OPERATOR_OPTIONS.text;
      case 'size':
        return OPERATOR_OPTIONS.number;
      case 'createdAt':
      case 'updatedAt':
        return OPERATOR_OPTIONS.date;
      case 'tags':
        return OPERATOR_OPTIONS.array;
      case 'type':
      case 'status':
        return OPERATOR_OPTIONS.select;
      default:
        return OPERATOR_OPTIONS.text;
    }
  };

  const renderValueInput = (rule: SmartCollectionRule) => {
    const { field, operator, value, customFieldKey } = rule;

    // Between operator needs two inputs
    if (operator === 'between') {
      const betweenValue = typeof value === 'object' && 'min' in value && 'max' in value 
        ? value 
        : { min: 0, max: 100 };

      return (
        <div className="flex gap-2 items-center">
          <Input
            type="number"
            placeholder="Min"
            value={betweenValue.min}
            onChange={(e) => updateRule(rule.id, {
              value: { ...betweenValue, min: Number(e.target.value) }
            })}
            className="flex-1"
          />
          <span className="text-muted-foreground">and</span>
          <Input
            type="number"
            placeholder="Max"
            value={betweenValue.max}
            onChange={(e) => updateRule(rule.id, {
              value: { ...betweenValue, max: Number(e.target.value) }
            })}
            className="flex-1"
          />
        </div>
      );
    }

    // Multi-select for "in" operator
    if (operator === 'in') {
      return (
        <Input
          placeholder="Enter comma-separated values"
          value={Array.isArray(value) ? value.join(', ') : String(value)}
          onChange={(e) => updateRule(rule.id, {
            value: e.target.value.split(',').map(v => v.trim()).filter(Boolean)
          })}
        />
      );
    }

    // Type field dropdown
    if (field === 'type') {
      return (
        <Select
          value={String(value)}
          onValueChange={(val) => updateRule(rule.id, { value: val })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select file type" />
          </SelectTrigger>
          <SelectContent>
            {FILE_TYPES.map(type => (
              <SelectItem key={type} value={type}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }

    // Status field dropdown
    if (field === 'status') {
      return (
        <Select
          value={String(value)}
          onValueChange={(val) => updateRule(rule.id, { value: val })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map(status => (
              <SelectItem key={status} value={status}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }

    // Date inputs
    if (field === 'createdAt' || field === 'updatedAt') {
      return (
        <Input
          type="date"
          value={String(value)}
          onChange={(e) => updateRule(rule.id, { value: e.target.value })}
        />
      );
    }

    // Size input (numeric)
    if (field === 'size') {
      return (
        <div className="flex gap-2 items-center">
          <Input
            type="number"
            placeholder="Size in MB"
            value={String(value)}
            onChange={(e) => updateRule(rule.id, { value: Number(e.target.value) })}
            className="flex-1"
          />
          <span className="text-muted-foreground text-sm">MB</span>
        </div>
      );
    }

    // Custom field - need key input
    if (field === 'customField') {
      return (
        <div className="space-y-2">
          <Input
            placeholder="Custom field key"
            value={customFieldKey || ''}
            onChange={(e) => updateRule(rule.id, { customFieldKey: e.target.value })}
          />
          <Input
            placeholder="Value"
            value={String(value)}
            onChange={(e) => updateRule(rule.id, { value: e.target.value })}
          />
        </div>
      );
    }

    // Default text input
    return (
      <Input
        placeholder="Enter value..."
        value={String(value)}
        onChange={(e) => updateRule(rule.id, { value: e.target.value })}
      />
    );
  };

  const getFieldIcon = (fieldValue: string) => {
    const field = FIELD_OPTIONS.find(f => f.value === fieldValue);
    return field?.icon || Filter;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Hash className="h-5 w-5 text-blue-500" />
          Smart Collection Rules
        </CardTitle>
        <CardDescription>
          Define rules to automatically include assets that match your criteria.
          All rules must be satisfied for an asset to be included.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {rules.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Filter className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="mb-4">No rules defined yet</p>
            <Button onClick={addRule} variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Add First Rule
            </Button>
          </div>
        ) : (
          <>
            {rules.map((rule, index) => {
              const Icon = getFieldIcon(rule.field);
              return (
                <div key={rule.id} className="p-4 border rounded-lg space-y-4">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Icon className="h-3 w-3" />
                      Rule {index + 1}
                    </Badge>
                    <div className="flex-1" />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteRule(rule.id)}
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    {/* Field Selection */}
                    <div>
                      <Label className="text-xs text-muted-foreground mb-2">Field</Label>
                      <Select
                        value={rule.field}
                        onValueChange={(field) => updateRule(rule.id, {
                          field: field as SmartCollectionRule['field'],
                          operator: getOperatorsForField(field)[0].value as SmartCollectionRule['operator'],
                          value: '',
                          customFieldKey: field === 'customField' ? '' : undefined
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {FIELD_OPTIONS.map(option => {
                            const FieldIcon = option.icon;
                            return (
                              <SelectItem key={option.value} value={option.value}>
                                <div className="flex items-center gap-2">
                                  <FieldIcon className="h-4 w-4" />
                                  {option.label}
                                </div>
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Operator Selection */}
                    <div>
                      <Label className="text-xs text-muted-foreground mb-2">Operator</Label>
                      <Select
                        value={rule.operator}
                        onValueChange={(operator) => updateRule(rule.id, {
                          operator: operator as SmartCollectionRule['operator'],
                          value: operator === 'between' ? { min: 0, max: 100 } : ''
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {getOperatorsForField(rule.field).map(op => (
                            <SelectItem key={op.value} value={op.value}>
                              {op.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Value Input */}
                    <div>
                      <Label className="text-xs text-muted-foreground mb-2">Value</Label>
                      {renderValueInput(rule)}
                    </div>
                  </div>
                </div>
              );
            })}

            <Button onClick={addRule} variant="outline" className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Add Another Rule
            </Button>
          </>
        )}

        {rules.length > 0 && (
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-start gap-3">
              <Hash className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
              <div>
                <h4 className="font-medium text-blue-900 dark:text-blue-100">
                  Smart Collection Logic
                </h4>
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                  Assets will be automatically included if they match <strong>ALL</strong> of the rules above.
                  The collection will update automatically when new assets are added that match these criteria.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}