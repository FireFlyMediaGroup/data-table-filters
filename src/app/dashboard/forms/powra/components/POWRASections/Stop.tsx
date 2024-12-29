"use client";

import { FC } from 'react';
import { Label } from "../../../../../../components/ui/label";
import { Card, CardContent } from "../../../../../../components/ui/card";
import { RadioGroup, RadioGroupItem } from "../../../../../../components/ui/radio-group";
import { FormSectionProps, StopData } from '../../types';
import ErrorDisplay from '../ErrorDisplay';

const Stop: FC<FormSectionProps> = ({ register, errors, control, setValue }) => {
  const questions = [
    { name: 'authorisedLocation' as const, label: 'Are you at the authorised Inspection / WTG Location?' },
    { name: 'correctDocumentation' as const, label: 'Do you have the correct documentation? (RAMS, Pt. 107, First Aid etc)' },
    { name: 'correctPPE' as const, label: 'Do you have the correct PPE / RPE and Safety Equipment? (Including Truck)' },
    { name: 'competentAuthorised' as const, label: 'Are you competent and authorised to complete the task?' },
    { name: 'inspectionEquipment' as const, label: 'Is Inspection Equipment, tools, suitable and in date for Operation (MX Interval)' },
    { name: 'accessEgress' as const, label: 'Is access / egress safe and in date for inspection? (Ladders, WTG Stairs, scaffolds etc)' },
    { name: 'environmentalCondition' as const, label: 'Is environmental condition safe for operations? (weather, road cond.)' },
  ] as const;

  return (
    <Card>
      <CardContent className="space-y-6">
        <h2 className="text-2xl font-bold">Part 1 - STOP</h2>
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Before You Start</h3>
          <div className="space-y-6">
            {errors.stop?.beforeYouStart && (
              <div>
                <ErrorDisplay error="Please answer all safety questions" />
              </div>
            )}
            {questions.map((item) => (
              <div key={item.name} className="space-y-2">
                <Label className="font-medium">{item.label}</Label>
                <RadioGroup
                  onValueChange={(value: "yes" | "no" | "n/a") => {
                    setValue(`stop.beforeYouStart.${item.name}`, value);
                  }}
                  className="flex space-x-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="yes" id={`stop.beforeYouStart.${item.name}.yes`} />
                    <Label htmlFor={`stop.beforeYouStart.${item.name}.yes`}>Yes</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="no" id={`stop.beforeYouStart.${item.name}.no`} />
                    <Label htmlFor={`stop.beforeYouStart.${item.name}.no`}>No</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="n/a" id={`stop.beforeYouStart.${item.name}.na`} />
                    <Label htmlFor={`stop.beforeYouStart.${item.name}.na`}>N/A</Label>
                  </div>
                </RadioGroup>
                {errors.stop?.beforeYouStart?.[item.name]?.message && (
                  <ErrorDisplay error={errors.stop?.beforeYouStart?.[item.name]?.message} />
                )}
              </div>
            ))}
          </div>
        </div>
        <div className="text-red-500 font-bold">
          If you have answered &apos;NO&apos; to any of the above, report to The Chief Pilot/ HSE Manager and take the required action.
        </div>
      </CardContent>
    </Card>
  );
};

export default Stop;
