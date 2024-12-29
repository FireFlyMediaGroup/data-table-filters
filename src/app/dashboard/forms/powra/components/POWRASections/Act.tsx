"use client";

import React, { useCallback } from 'react';
import { UseFormRegister, FieldErrors, useWatch, Control, UseFormSetValue, UseFormGetValues } from 'react-hook-form';
import { Checkbox } from "../../../../../../components/ui/checkbox";
import { Label } from "../../../../../../components/ui/label";
import { Card, CardContent } from "../../../../../../components/ui/card";
import { Button } from "../../../../../../components/ui/button";
import { Textarea } from "../../../../../../components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "../../../../../../components/ui/radio-group";
import { POWRAFormData } from '../../types';
import { FormSectionProps } from '../../types';
import { AssessmentRow } from '../../types';

const checkboxItems = [
  { name: 'ppe', label: 'Personal Protective Equipment (PPE) required and in good condition' },
  { name: 'trainingRequired', label: 'Training/competency required for the task' },
  { name: 'equipmentInspection', label: 'Equipment inspection completed' },
  { name: 'workAreaSetup', label: 'Work area set up correctly' },
  { name: 'communicationPlan', label: 'Communication plan in place' },
  { name: 'emergencyProcedures', label: 'Emergency procedures understood' },
] as const;

interface ActProps extends FormSectionProps {
  getValues: UseFormGetValues<POWRAFormData>;
}

const Act = ({ register, errors, control, setValue, getValues }: ActProps): React.ReactElement => {
  const assessmentRows = useWatch<POWRAFormData, 'act.assessmentRows'>({
    control,
    name: 'act.assessmentRows',
    defaultValue: [] as AssessmentRow[],
  }) as AssessmentRow[];

  const handleControlMeasuresChange = useCallback((index: number, value: string) => {
    setValue(`act.assessmentRows.${index}.controlMeasures`, value, {
      shouldValidate: true,
      shouldDirty: true,
    });
  }, [setValue]);

  const handleResidualRiskChange = useCallback((index: number, value: 'low' | 'medium' | 'high') => {
    setValue(`act.assessmentRows.${index}.residualRisk`, value, {
      shouldValidate: true,
      shouldDirty: true,
    });
  }, [setValue]);

  const renderAssessmentRow = useCallback((row: AssessmentRow, index: number) => {
    const remainingChars = 250 - (row.controlMeasures?.length || 0);
    const hasHazardNo = !!row.hazardNo;

    return (
      <tr key={`row-${index}-${row.hazardNo || 'new'}`} className="border-b">
        <td className="p-2 text-center align-top">
          {row.hazardNo || ''}
          <input
            type="hidden"
            {...register(`act.assessmentRows.${index}.hazardNo`)}
          />
        </td>
        <td className="p-2 relative">
          <Textarea
            {...register(`act.assessmentRows.${index}.controlMeasures`, {
              required: hasHazardNo ? "Control measures are required for identified hazards" : false,
              maxLength: {
                value: 250,
                message: "Control measures cannot exceed 250 characters"
              }
            })}
            className="w-full min-h-[100px]"
            placeholder="Enter control measures..."
            value={row.controlMeasures}
            onChange={(e) => handleControlMeasuresChange(index, e.target.value)}
          />
          <div className="text-xs text-muted-foreground text-right mt-1">
            {remainingChars} characters remaining
          </div>
          {errors.act?.assessmentRows?.[index]?.controlMeasures?.message && (
            <p className="text-sm text-red-600 mt-1">
              {errors.act.assessmentRows[index].controlMeasures.message}
            </p>
          )}
        </td>
        <td className="p-2" colSpan={3}>
          <RadioGroup
            value={row.residualRisk || 'low'}
            onValueChange={(value: string) => handleResidualRiskChange(index, value as 'low' | 'medium' | 'high')}
            className="flex justify-center space-x-4"
          >
            <div className={`flex items-center justify-center w-1/3 py-1 ${row.residualRisk === 'low' ? 'bg-green-100' : ''}`}>
              <RadioGroupItem value="low" id={`risk-low-${index}`} />
              <Label htmlFor={`risk-low-${index}`} className="ml-2">Low</Label>
            </div>
            <div className={`flex items-center justify-center w-1/3 py-1 ${row.residualRisk === 'medium' ? 'bg-yellow-100' : ''}`}>
              <RadioGroupItem value="medium" id={`risk-medium-${index}`} />
              <Label htmlFor={`risk-medium-${index}`} className="ml-2">Medium</Label>
            </div>
            <div className={`flex items-center justify-center w-1/3 py-1 ${row.residualRisk === 'high' ? 'bg-red-100' : ''}`}>
              <RadioGroupItem value="high" id={`risk-high-${index}`} />
              <Label htmlFor={`risk-high-${index}`} className="ml-2">High</Label>
            </div>
          </RadioGroup>
          {errors.act?.assessmentRows?.[index]?.residualRisk?.message && (
            <p className="text-sm text-red-600 mt-1 text-center">
              {errors.act.assessmentRows[index].residualRisk.message}
            </p>
          )}
        </td>
      </tr>
    );
  }, [register, errors, handleControlMeasuresChange, handleResidualRiskChange]);

  const handleAddRow = useCallback(() => {
    const currentRows = getValues('act.assessmentRows') || [];
    const newRow: AssessmentRow = { hazardNo: '', controlMeasures: '', residualRisk: 'low' };
    setValue('act.assessmentRows', [...currentRows, newRow], {
      shouldValidate: true,
      shouldDirty: true
    });
  }, [getValues, setValue]);

  return (
    <Card>
      <CardContent className="space-y-6">
        <h2 className="text-2xl font-bold">Part 3 - ACT</h2>
        
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Control Measures</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {checkboxItems.map((item) => (
              <div key={item.name} className="flex items-center space-x-2">
                <Checkbox
                  id={`act.controlMeasures.${item.name}`}
                  {...register(`act.controlMeasures.${item.name}`)}
                />
                <Label htmlFor={`act.controlMeasures.${item.name}`}>{item.label}</Label>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Additional Assessment</h3>
          <div className="overflow-x-auto">
            <table className="w-full border">
              <thead>
                <tr className="bg-muted">
                  <th className="p-2 border w-24">Hazard No.</th>
                  <th className="p-2 border">Control Measures</th>
                  <th className="p-2 border" colSpan={3}>
                    <div className="text-center">Residual Risk</div>
                    <div className="grid grid-cols-3 gap-2 mt-1">
                      <div className="bg-green-100">Low</div>
                      <div className="bg-yellow-100">Medium</div>
                      <div className="bg-red-100">High</div>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {assessmentRows?.map((row, index) => renderAssessmentRow(row, index))}
              </tbody>
            </table>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={handleAddRow}
          >
            Add Row
          </Button>

          <div className="text-red-600 font-bold text-sm mt-4">
            Note: If residual (remaining) risk is greater than Low, do not proceed and report to your Chief Pilot / HSE Manager and take the required action
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default Act;
