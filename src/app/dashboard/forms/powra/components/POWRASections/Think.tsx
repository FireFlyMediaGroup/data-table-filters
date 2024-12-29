"use client";

import React, { useCallback } from "react";
import { UseFormRegister, FieldErrors, useWatch, Control, UseFormSetValue } from "react-hook-form";
import { Checkbox } from "../../../../../../components/ui/checkbox";
import { Label } from "../../../../../../components/ui/label";
import { Card, CardContent } from "../../../../../../components/ui/card";
import { Input } from "../../../../../../components/ui/input";
import { RadioGroup, RadioGroupItem } from "../../../../../../components/ui/radio-group";
import * as z from "zod";
import { POWRAFormData } from "../../types";
import { hazardItems } from "../../constants";
import { FormSectionProps } from '../../types';

export const thinkSchema = z.object({
  hazards: z.object({
    workingAtHeight: z.boolean().default(false),
    excavations: z.boolean().default(false),
    temporaryRestrictions: z.boolean().default(false),
    fireHotWorks: z.boolean().default(false),
    dust: z.boolean().default(false),
    taskEnvironment: z.boolean().default(false),
    groundObstruction: z.boolean().default(false),
    temporaryWorks: z.boolean().default(false),
    contactWithStationary: z.boolean().default(false),
    manualHandling: z.boolean().default(false),
    objectOverturning: z.boolean().default(false),
    servicesUnderAbove: z.boolean().default(false),
    slipsTrips: z.boolean().default(false),
    trafficMovingVehicles: z.boolean().default(false),
    confinedSpaces: z.boolean().default(false),
    electricity: z.boolean().default(false),
    noise: z.boolean().default(false),
    vibration: z.boolean().default(false),
    adverseWeather: z.boolean().default(false),
    risksFromTask: z.boolean().default(false),
    riskOfPollution: z.boolean().default(false),
    biologicalAgents: z.boolean().default(false),
    aerielHazards: z.boolean().default(false),
    unstableStructure: z.boolean().default(false),
    craneLifting: z.boolean().default(false),
    wasteRemoval: z.boolean().default(false),
    exogenousFactors: z.boolean().default(false),
    other1: z.boolean().default(false),
    other2: z.boolean().default(false),
  }),
  otherSpecify1: z.string().optional(),
  otherSpecify2: z.string().optional(),
  hazardsIncludedInRAMS: z.enum(["yes", "no"]).refine((val) => val !== undefined, {
    message: "This question must be answered"
  }),
  rescuePlansInPlace: z.enum(["yes", "no", "n/a"]).refine((val) => val !== undefined, {
    message: "This question must be answered"
  }),
});

export type ThinkData = z.infer<typeof thinkSchema>;

const defaultHazards: ThinkData["hazards"] = {
  workingAtHeight: false,
  excavations: false,
  temporaryRestrictions: false,
  fireHotWorks: false,
  dust: false,
  taskEnvironment: false,
  groundObstruction: false,
  temporaryWorks: false,
  contactWithStationary: false,
  manualHandling: false,
  objectOverturning: false,
  servicesUnderAbove: false,
  slipsTrips: false,
  trafficMovingVehicles: false,
  confinedSpaces: false,
  electricity: false,
  noise: false,
  vibration: false,
  adverseWeather: false,
  risksFromTask: false,
  riskOfPollution: false,
  biologicalAgents: false,
  aerielHazards: false,
  unstableStructure: false,
  craneLifting: false,
  wasteRemoval: false,
  exogenousFactors: false,
  other1: false,
  other2: false,
};

const Think: React.FC<FormSectionProps> = ({ register, errors, control, setValue }) => {
  const thinkValues = useWatch({
    control,
    name: "think",
  });

  const handleHazardChange = useCallback((name: keyof ThinkData["hazards"], checked: boolean) => {
    setValue(`think.hazards.${name}`, checked, {
      shouldValidate: true,
      shouldDirty: true,
    });
  }, [setValue]);

  return (
    <Card>
      <CardContent className="space-y-6">
        <h2 className="text-2xl font-bold">Part 2 - THINK</h2>
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Safety, Health and Environmental On-site Assessment</h3>
          <p className="text-sm text-muted-foreground">(If Hazard is present for the task, tick the associated box)</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {hazardItems.map((item) => (
              <div key={item.number} className="flex items-center space-x-2">
                <div className="w-8 text-sm font-medium">{item.number}</div>
                <Checkbox
                  id={`think.hazards.${item.name}`}
                  checked={thinkValues?.hazards?.[item.name as keyof ThinkData["hazards"]] || false}
                  onCheckedChange={(checked) => handleHazardChange(item.name as keyof ThinkData["hazards"], checked as boolean)}
                />
                <Label htmlFor={`think.hazards.${item.name}`}>{item.label}</Label>
              </div>
            ))}
          </div>

          {/* Conditional text inputs for Other fields */}
          {thinkValues?.hazards?.other1 && (
            <div className="mt-2">
              <Label htmlFor="think.otherSpecify1">Specify Other (28)</Label>
              <Input
                id="think.otherSpecify1"
                {...register("think.otherSpecify1")}
                placeholder="Please specify the other hazard"
              />
            </div>
          )}

          {thinkValues?.hazards?.other2 && (
            <div className="mt-2">
              <Label htmlFor="think.otherSpecify2">Specify Other (29)</Label>
              <Input
                id="think.otherSpecify2"
                {...register("think.otherSpecify2")}
                placeholder="Please specify the other hazard"
              />
            </div>
          )}

          {/* Required Questions */}
          <div className="space-y-4 mt-6">
            <div className="space-y-2">
              <Label className="font-medium">
                Are the hazards ticked above included within the task RAMS and adequately controlled?
              </Label>
              <RadioGroup
                value={thinkValues?.hazardsIncludedInRAMS || ""}
                onValueChange={(value: "yes" | "no") => {
                  setValue("think.hazardsIncludedInRAMS", value, { shouldValidate: true });
                }}
              >
                <div className="flex space-x-4">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="yes" id="think.hazardsIncludedInRAMS.yes" />
                    <Label htmlFor="think.hazardsIncludedInRAMS.yes">Yes</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="no" id="think.hazardsIncludedInRAMS.no" />
                    <Label htmlFor="think.hazardsIncludedInRAMS.no">No</Label>
                  </div>
                </div>
              </RadioGroup>
              {errors.think?.hazardsIncludedInRAMS?.message && (
                <p className="text-sm text-red-600">{errors.think?.hazardsIncludedInRAMS?.message}</p>
              )}
              {thinkValues?.hazardsIncludedInRAMS === "no" && (
                <p className="text-orange-500">(If no to the any of the above, complete sections 3)</p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="font-medium">
                Where required, are rescue / emergency plans in place with associated safety equipment and competencies?
              </Label>
              <RadioGroup
                value={thinkValues?.rescuePlansInPlace || ""}
                onValueChange={(value: "yes" | "no" | "n/a") => {
                  setValue("think.rescuePlansInPlace", value, { shouldValidate: true });
                }}
              >
                <div className="flex space-x-4">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="yes" id="think.rescuePlansInPlace.yes" />
                    <Label htmlFor="think.rescuePlansInPlace.yes">Yes</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="no" id="think.rescuePlansInPlace.no" />
                    <Label htmlFor="think.rescuePlansInPlace.no">No</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="n/a" id="think.rescuePlansInPlace.na" />
                    <Label htmlFor="think.rescuePlansInPlace.na">N/A</Label>
                  </div>
                </div>
              </RadioGroup>
              {errors.think?.rescuePlansInPlace?.message && (
                <p className="text-sm text-red-600">{errors.think?.rescuePlansInPlace?.message}</p>
              )}
              {thinkValues?.rescuePlansInPlace === "no" && (
                <p className="text-red-600">
                  (If you have answered &quot;NO&quot;, report to your Chief Pilot / HSE Manager and take the required action)
                </p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default Think;
