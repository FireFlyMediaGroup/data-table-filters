"use client";

import React, { useState, useEffect } from "react";
import { useWatch, UseFormTrigger } from "react-hook-form";
import { Card, CardContent } from "../../../../../../components/ui/card";
import { Input } from "../../../../../../components/ui/input";
import { Label } from "../../../../../../components/ui/label";
import { Button } from "../../../../../../components/ui/button";
import { Textarea } from "../../../../../../components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "../../../../../../components/ui/radio-group";
import { Plus, ChevronDown, ChevronUp, Printer } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../../../../../../components/ui/collapsible";
import * as z from "zod";
import { POWRAFormData, FormSectionProps } from "../../types";
import { format } from "date-fns";
import { hazardItems } from "../../constants";

// Modified schema to only require first name and handle conditional validation
export const reviewSchema = z.object({
  review: z.object({
    briefingRecord: z.array(
      z.object({
        name: z.string().optional(),
      })
    ).superRefine((arr, ctx) => {
      if (!arr[0]?.name || arr[0].name.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "RPIC signature (first name) is required",
          path: [0, "name"],
        });
      }
    }),
    
    siteManagerReview: z.object({
      name: z.string().min(1, "Site manager name is required"),
      signature: z.string().min(1, "Signature is required"),
      time: z.string().min(1, "Time is required"),
    }).optional(),
    
    endOfTaskReview: z.object({
      hasLessons: z.enum(["yes", "no"]).optional(),
      comments: z.string().max(250, "Comments cannot exceed 250 characters").optional(),
    }).superRefine((data, ctx) => {
      if (!data.hasLessons) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Please select yes or no",
          path: ["hasLessons"],
        });
      }
      if (data.hasLessons === "yes" && (!data.comments || data.comments.length === 0)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Comments are required when lessons are present",
          path: ["comments"],
        });
      }
    }),
  }),
});

export type ReviewData = z.infer<typeof reviewSchema>;

interface ReviewProps extends FormSectionProps {
  isSuper?: boolean;
  status?: string;
  trigger: UseFormTrigger<POWRAFormData>;
}

const Review: React.FC<ReviewProps> = ({ register, errors, control, setValue, getValues, trigger, isSuper = false, status = "DRAFT" }) => {
  const [additionalNames, setAdditionalNames] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  
  // Watch form data for summary
  const formData = useWatch({
    control,
  }) as POWRAFormData;

  // Watch the hasLessons radio selection
  const hasLessons = useWatch({
    control,
    name: "review.endOfTaskReview.hasLessons",
    defaultValue: undefined,
  }) as "yes" | "no" | undefined;

  // Watch comments for character count
  const comments = useWatch({
    control,
    name: "review.endOfTaskReview.comments",
    defaultValue: "",
  }) as string;

  const charactersRemaining = 250 - (comments?.length || 0);

  // Helper function to get selected hazards
  const getSelectedHazards = () => {
    const selectedHazards = [];
    for (const [key, value] of Object.entries(formData?.think?.hazards || {})) {
      if (value) {
        const hazardItem = hazardItems.find(item => item.name === key);
        if (hazardItem) {
          selectedHazards.push(hazardItem.label);
        }
      }
    }
    return selectedHazards;
  };

  // Initialize form data
  useEffect(() => {
    console.log("Initializing Review section data...");
    try {
      // Initialize briefing record if empty
      const currentBriefingRecord = getValues("review.briefingRecord");
      if (!currentBriefingRecord || currentBriefingRecord.length === 0) {
        console.log("Initializing briefing record...");
        setValue("review.briefingRecord", [{ name: "" }], {
          shouldValidate: true,
          shouldDirty: true,
          shouldTouch: true
        });
      } else {
        console.log("Existing briefing record found:", currentBriefingRecord);
      }

      // Initialize hasLessons if not set
      const currentHasLessons = getValues("review.endOfTaskReview.hasLessons");
      if (!currentHasLessons) {
        console.log("Initializing hasLessons...");
        setValue("review.endOfTaskReview.hasLessons", "no", {
          shouldValidate: true,
          shouldDirty: true,
          shouldTouch: true
        });
      } else {
        console.log("Existing hasLessons value:", currentHasLessons);
      }

      // Log form state
      console.log("Review section initialized with:", {
        briefingRecord: getValues("review.briefingRecord"),
        hasLessons: getValues("review.endOfTaskReview.hasLessons"),
        comments: getValues("review.endOfTaskReview.comments")
      });
    } catch (error) {
      console.error("Error initializing Review section:", error);
      setSubmitError("Failed to initialize form data");
    }
  }, [setValue, getValues]);

  // Handle form submission
  const handleSubmit = async () => {
    console.log("Review section submit handler called");
    
    if (isSubmitting) {
      console.log("Already submitting, ignoring duplicate submission");
      return;
    }

    try {
      setIsSubmitting(true);
      setSubmitError(null);

      // Validate review section
      console.log("Validating review section...");
      const isValid = await trigger("review", { shouldFocus: true });
      
      if (!isValid) {
        console.error("Review section validation failed:", errors);
        throw new Error("Please complete all required fields");
      }

      console.log("Review section validation passed");
      console.log("Form data:", {
        briefingRecord: getValues("review.briefingRecord"),
        siteManagerReview: getValues("review.siteManagerReview"),
        endOfTaskReview: getValues("review.endOfTaskReview")
      });

    } catch (error) {
      console.error("Review section submission error:", error);
      setSubmitError(error instanceof Error ? error.message : "Failed to submit review");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderNameField = (index: number) => (
    <div key={index} className="grid grid-cols-2 gap-4 mb-4">
      <div>
        <Input
          {...register(`review.briefingRecord.${index}.name`)}
          placeholder={index === 0 ? "Enter RPIC signature (required)" : "Enter name (optional)"}
          className={index === 0 ? "border-primary" : ""}
        />
        {index === 0 && errors.review?.briefingRecord?.[0]?.name?.message && (
          <p className="text-sm text-red-600 mt-1">
            {errors.review?.briefingRecord[0].name.message}
          </p>
        )}
      </div>
      {index + 1 < (2 + additionalNames) * 2 && (
        <Input
          {...register(`review.briefingRecord.${index + 1}.name`)}
          placeholder="Enter name (optional)"
        />
      )}
    </div>
  );

  return (
    <Card>
      <CardContent className="space-y-8">
        <h2 className="text-2xl font-bold mb-6">Part 4 - REVIEW</h2>

        {submitError && (
          <div className="p-4 mb-4 bg-red-100 text-red-700 rounded-lg">
            {submitError}
          </div>
        )}

        {/* Print Button */}
        <Button
          type="button"
          variant="outline"
          className="mb-4 w-full"
          onClick={() => window.print()}
        >
          <Printer className="h-4 w-4 mr-2" />
          Print Assessment
        </Button>

        {/* Summary of Previous Sections */}
        <div className="space-y-6 bg-muted p-6 rounded-lg print:bg-white print:border print:border-black">
          <h3 className="text-xl font-semibold mb-4 flex items-center justify-between">
            Summary of Assessment
            <span className="text-sm font-normal text-muted-foreground print:hidden">
              Click sections to expand/collapse
            </span>
          </h3>
          
          {/* Job Description Summary */}
          <Collapsible defaultOpen className="space-y-2">
            <CollapsibleTrigger className="flex items-center justify-between w-full">
              <h4 className="font-medium">Job Details</h4>
              <ChevronDown className="h-4 w-4 print:hidden" />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="grid grid-cols-2 gap-4 text-sm bg-white p-4 rounded-lg border mt-2">
                <div>
                  <span className="font-medium">Site:</span> {formData?.jobDescription?.site}
                </div>
                <div>
                  <span className="font-medium">Date:</span> {formData?.jobDescription?.date ? format(new Date(formData.jobDescription.date), 'PPP') : ''}
                </div>
                <div>
                  <span className="font-medium">RPIC:</span> {formData?.jobDescription?.rpicName}
                </div>
                <div>
                  <span className="font-medium">Time:</span> {formData?.jobDescription?.time}
                </div>
                <div>
                  <span className="font-medium">Chief Pilot:</span> {formData?.jobDescription?.chiefPilot}
                </div>
                <div>
                  <span className="font-medium">HSE:</span> {formData?.jobDescription?.hse}
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Stop Section Summary */}
          <Collapsible defaultOpen className="space-y-2">
            <CollapsibleTrigger className="flex items-center justify-between w-full">
              <h4 className="font-medium">Pre-work Checklist Results</h4>
              <ChevronDown className="h-4 w-4 print:hidden" />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="grid grid-cols-1 gap-2 text-sm bg-white p-4 rounded-lg border mt-2">
                {Object.entries(formData?.stop?.beforeYouStart || {}).map(([key, value]) => (
                  <div key={key} className="flex justify-between border-b last:border-0 py-1">
                    <span className="font-medium">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                    <span className={`px-2 py-0.5 rounded ${
                      value === 'no' 
                        ? 'bg-red-100 text-red-700 font-medium' 
                        : value === 'yes'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {value.toUpperCase()}
                    </span>
                  </div>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Think Section Summary */}
          <Collapsible defaultOpen className="space-y-2">
            <CollapsibleTrigger className="flex items-center justify-between w-full">
              <h4 className="font-medium">Identified Hazards</h4>
              <ChevronDown className="h-4 w-4 print:hidden" />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="flex flex-wrap gap-2 bg-white p-4 rounded-lg border mt-2">
                {getSelectedHazards().map((hazard, index) => (
                  <span key={index} className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm border border-yellow-200">
                    {hazard}
                  </span>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Act Section Summary */}
          <Collapsible defaultOpen className="space-y-2">
            <CollapsibleTrigger className="flex items-center justify-between w-full">
              <h4 className="font-medium">Control Measures</h4>
              <ChevronDown className="h-4 w-4 print:hidden" />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="space-y-2 text-sm bg-white p-4 rounded-lg border mt-2">
                {formData?.act?.assessmentRows?.map((row, index) => (
                  <div key={index} className="flex justify-between items-start border-b last:border-0 py-2">
                    <div className="flex-1">
                      <span className="font-medium">Hazard {row.hazardNo}:</span> {row.controlMeasures}
                    </div>
                    <span className={`ml-4 px-3 py-1 rounded-full text-sm ${
                      row.residualRisk === 'high' 
                        ? 'bg-red-100 text-red-700 border border-red-200'
                        : row.residualRisk === 'medium'
                        ? 'bg-yellow-100 text-yellow-700 border border-yellow-200'
                        : 'bg-green-100 text-green-700 border border-green-200'
                    }`}>
                      {typeof row.residualRisk === 'string' 
                        ? `${row.residualRisk.charAt(0).toUpperCase()}${row.residualRisk.slice(1)} Risk` 
                        : 'Low Risk'}
                    </span>
                  </div>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>

        {/* POWRA Briefing Record */}
        <div className="space-y-4 bg-white p-6 rounded-lg border print:break-before-page">
          <h3 className="text-xl font-semibold">POWRA Briefing Record</h3>
          <p className="text-sm text-muted-foreground mb-4">
            RPIC signature required in first field. Additional names for those present (optional).
          </p>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[...Array(2 + additionalNames)].map((_, i) => renderNameField(i * 2))}
            </div>
            
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setAdditionalNames(prev => prev + 1)}
              className="print:hidden"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add More Names
            </Button>
          </div>
        </div>

        {/* Site Manager's Signature */}
        {isSuper && status === "PENDING" && (
          <div className="space-y-4 p-6 bg-muted rounded-lg border print:bg-white print:break-before-page">
            <h3 className="text-xl font-semibold">Site Manager&apos;s Review</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="siteManagerName">Name</Label>
                <Input
                  id="siteManagerName"
                  {...register("review.siteManagerReview.name")}
                />
                {errors.review?.siteManagerReview?.name?.message && (
                  <p className="text-sm text-red-600">
                    {errors.review?.siteManagerReview?.name?.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="siteManagerSignature">Signature</Label>
                <Input
                  id="siteManagerSignature"
                  {...register("review.siteManagerReview.signature")}
                />
                {errors.review?.siteManagerReview?.signature?.message && (
                  <p className="text-sm text-red-600">
                    {errors.review?.siteManagerReview?.signature?.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="siteManagerTime">Time</Label>
                <Input
                  id="siteManagerTime"
                  type="time"
                  {...register("review.siteManagerReview.time")}
                />
                {errors.review?.siteManagerReview?.time?.message && (
                  <p className="text-sm text-red-600">
                    {errors.review?.siteManagerReview?.time?.message}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* End of Task Review */}
        <div className="space-y-4 bg-white p-6 rounded-lg border print:break-before-page">
          <h3 className="text-xl font-semibold">End of Task Review</h3>
          
          <div className="space-y-4">
            <Label>Are there any lessons for next time?</Label>
            <RadioGroup
              value={hasLessons || "no"}
              onValueChange={(value: "yes" | "no") => {
                setValue("review.endOfTaskReview.hasLessons", value, {
                  shouldValidate: true,
                  shouldDirty: true,
                  shouldTouch: true
                });
                if (value === "no") {
                  setValue("review.endOfTaskReview.comments", "", {
                    shouldValidate: true
                  });
                }
              }}
              className="flex items-center space-x-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="yes" id="hasLessons-yes" />
                <Label htmlFor="hasLessons-yes">Yes</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="no" id="hasLessons-no" />
                <Label htmlFor="hasLessons-no">No</Label>
              </div>
            </RadioGroup>
            {errors.review?.endOfTaskReview?.hasLessons?.message && (
              <p className="text-sm text-red-600">
                {errors.review?.endOfTaskReview?.hasLessons?.message}
              </p>
            )}
          </div>

          {hasLessons === "yes" && (
            <div className="space-y-2">
              <Label>If Yes, comment below and inform your Chief Pilot / HSE Manager.</Label>
              <div className="relative">
                <Textarea
                  {...register("review.endOfTaskReview.comments")}
                  className="min-h-[100px]"
                  placeholder="Enter your comments here..."
                />
                <div className="absolute bottom-2 right-2 text-xs text-muted-foreground">
                  {charactersRemaining} characters remaining
                </div>
              </div>
              {errors.review?.endOfTaskReview?.comments?.message && (
                <p className="text-sm text-red-600">
                  {errors.review?.endOfTaskReview?.comments?.message}
                </p>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default Review;
