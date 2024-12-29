"use client";

import React, { useState } from "react";
import { useForm, SubmitHandler, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { Card, CardContent } from "../../../../../components/ui/card";
import { Input } from "../../../../../components/ui/input";
import { Label } from "../../../../../components/ui/label";
import { Button } from "../../../../../components/ui/button";
import { Calendar } from "../../../../../components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "../../../../../components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../../../components/ui/select";
import ProgressBar from "../../../../../components/ui/progress-bar";
import { 
  powraSchema,
  POWRAFormData,
  StopData,
  ThinkData,
  ActData,
  ReviewData,
  AssessmentRow,
} from "../types";
import Stop from "./POWRASections/Stop";
import Think from "./POWRASections/Think";
import Act from "./POWRASections/Act";
import Review from "./POWRASections/Review";
import ErrorDisplay from "./ErrorDisplay";
import { useRouter } from "next/navigation";

const sections = ["Job Description", "Stop", "Think", "Act", "Review"] as const;

import { hazardItems } from "../constants";

const POWRAForm: React.FC = () => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [currentSection, setCurrentSection] = useState(0);
  
  const { register, handleSubmit, formState: { errors }, setValue, getValues, trigger, control } = useForm<POWRAFormData>({
    resolver: zodResolver(powraSchema),
    defaultValues: {
      jobDescription: {
        site: '',
        date: new Date(),
        rpicName: '',
        time: format(new Date(), "HH:mm"),
        chiefPilot: undefined,
        hse: undefined,
      },
      stop: {
        beforeYouStart: {
          authorisedLocation: undefined,
          correctDocumentation: undefined,
          correctPPE: undefined,
          competentAuthorised: undefined,
          inspectionEquipment: undefined,
          accessEgress: undefined,
          environmentalCondition: undefined,
        },
      },
      think: {
        hazards: {
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
        },
        otherSpecify1: '',
        otherSpecify2: '',
        hazardsIncludedInRAMS: undefined,
        rescuePlansInPlace: undefined,
      },
      act: {
        controlMeasures: {
          ppe: false,
          trainingRequired: false,
          equipmentInspection: false,
          workAreaSetup: false,
          communicationPlan: false,
          emergencyProcedures: false,
        },
        additionalMeasures: '',
        assessmentRows: [],
      },
      review: {
        briefingRecord: [],
        siteManagerReview: {
          name: '',
          signature: '',
          time: '',
        },
        endOfTaskReview: {
          hasLessons: undefined,
          comments: '',
        },
      },
    },
  });

  // Watch form data for debugging and state tracking
  const formData = useWatch({ control });

  const onSubmit: SubmitHandler<POWRAFormData> = async (data: POWRAFormData) => {
    if (isSubmitting) {
      console.log("Already submitting, ignoring duplicate submission");
      return;
    }

    console.log("Submit button clicked");
    console.log("Current section:", currentSection);
    
    try {
      // Set submitting state immediately
      setIsSubmitting(true);
      setSubmitError(null);

      // Ensure we're on the Review section
      if (currentSection !== 4) {
        setSubmitError("Please complete all sections before submitting");
        return;
      }

      // Validate all sections before submitting
      console.log("Triggering validation...");
      const isValid = await trigger(undefined, { shouldFocus: true });
      if (!isValid) {
        console.log("Form validation failed:", errors);
        const errorSections = Object.keys(errors).map(key => 
          key.replace(/([A-Z])/g, ' $1').trim()
        ).join(', ');
        setSubmitError(`Please check required fields in these sections: ${errorSections}`);
        return;
      }

      console.log("Form validation result:", isValid);
      console.log("Form errors:", errors);
      console.log("Submitting POWRA form data:", JSON.stringify(data, null, 2));

      // Prepare the data - convert Date object to ISO string
      const formattedData = {
        ...data,
        jobDescription: {
          ...data.jobDescription,
          date: data.jobDescription.date.toISOString()
        }
      };
      
      // Log the data being sent
      console.log("Form data being submitted:", JSON.stringify(formattedData, null, 2));
      
      // Get current auth state
      console.log("Checking authentication...");
      const { supabase } = await import('../../../../../lib/supabase/client');
      const { data: { session }, error: authError } = await supabase.auth.getSession();
      console.log("Session check result:", session ? "Found" : "Not found", authError || "");

      if (authError) {
        console.error("Auth error:", authError);
        throw new Error(`Authentication error: ${authError.message}`);
      }
      
      if (!session) {
        console.error("No active session found");
        setSubmitError("You must be logged in to submit this form");
        return;
      }

      if (!session.user) {
        console.error("Session exists but no user found");
        setSubmitError("User session is invalid");
        return;
      }
      
      console.log("Active session found for user:", session.user.id);
      
      console.log("Making API request...");
      // Add timeout and retry logic
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000);

      const maxRetries = 3;
      let currentTry = 0;
      let lastError: Error | null = null;

      while (currentTry < maxRetries) {
        try {
          console.log(`Attempt ${currentTry + 1} of ${maxRetries}`);
          console.log(`Making API request attempt ${currentTry + 1}...`);
          console.log("Request URL:", "/api/powra");
          console.log("Request method:", "POST");
          console.log("Request headers:", {
            "Content-Type": "application/json",
            "X-Request-Attempt": `${currentTry + 1}`,
          });
          console.log("Request body:", JSON.stringify(formattedData, null, 2));

          const response = await fetch("/api/powra", {
            signal: controller.signal,
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Request-Attempt": `${currentTry + 1}`,
            },
            body: JSON.stringify(formattedData),
            credentials: 'include',
            cache: 'no-cache',
          }).catch(error => {
            console.error("Fetch error:", error);
            console.error("Error name:", error.name);
            console.error("Error message:", error.message);
            console.error("Error stack:", error.stack);
            throw error;
          });

          if (!response) {
            console.error("No response received from server");
            throw new Error("No response received from server");
          }

          console.log("Response received:");
          console.log("Status:", response.status);
          console.log("Status text:", response.statusText);
          console.log("Headers:", Object.fromEntries(response.headers.entries()));
          console.log("Response type:", response.type);
          console.log("Response URL:", response.url);

          const responseText = await response.text().catch(error => {
            console.error("Error reading response text:", error);
            throw error;
          });
          console.log("Raw response text:", responseText);

          let parsedResponse;
          try {
            parsedResponse = JSON.parse(responseText);
            console.log("Parsed response:", parsedResponse);
          } catch (parseError) {
            console.error("Error parsing response JSON:", parseError);
            console.error("Invalid JSON:", responseText);
            throw new Error("Invalid JSON response from server");
          }

          if (!response.ok) {
            // If it's a 401 or 403, don't retry
            if (response.status === 401 || response.status === 403) {
              throw new Error(`Authentication error: ${responseText}`);
            }
            throw new Error(`Server error: ${response.status} ${responseText}`);
          }

          // Success! Parse the response and redirect
          const result = JSON.parse(responseText);
          console.log("POWRA submission successful:", result);
          clearTimeout(timeout);
          router.push("/dashboard");
          return;

        } catch (error) {
          console.error(`Attempt ${currentTry + 1} failed:`, error);
          lastError = error instanceof Error ? error : new Error(String(error));
          
          // Don't retry auth errors or client errors
          if (lastError.message.includes("Authentication error") || 
              lastError.message.includes("Invalid format")) {
            throw lastError;
          }
          
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, 1000 * (currentTry + 1)));
          currentTry++;
        }
      }

      // If we get here, all retries failed
      throw new Error(`Failed after ${maxRetries} attempts. Last error: ${lastError?.message}`);

    } catch (error) {
      console.error("Form submission error:", error);
      setSubmitError(error instanceof Error ? error.message : "An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextSection = async () => {
    const sectionKey = sections[currentSection].toLowerCase().replace(" ", "") as keyof POWRAFormData;
    
    // Special handling for Think section validation and transition to Act
    if (currentSection === 2) {
      const isValid = await trigger([
        "think.hazardsIncludedInRAMS",
        "think.rescuePlansInPlace"
      ]);
      if (!isValid) return;

      // Get selected hazards and initialize assessment rows
      const thinkHazards = getValues("think.hazards");
      
      // Get current assessment rows to preserve any existing data
      const currentRows = getValues("act.assessmentRows") || [];

      // Create a map of existing rows by hazard number for quick lookup
      const existingRowsMap = new Map(
        currentRows.map(row => [row.hazardNo, row])
      );
      
      // Map selected hazards to assessment rows
      const selectedHazards = Object.entries(thinkHazards)
        .filter(([_, value]) => value)
        .map(([key]) => {
          const hazardItem = hazardItems.find(item => item.name === key);
          if (!hazardItem) return null;

          const hazardNo = hazardItem.number.toString();
          // Check if this hazard already has a row
          const existingRow = existingRowsMap.get(hazardNo);

          // If it exists, preserve its data, otherwise create new row
          return existingRow || {
            hazardNo,
            controlMeasures: '',
            residualRisk: 'low'
          };
        })
        .filter((row): row is AssessmentRow => row !== null);

      // Get any additional rows (rows without hazard numbers)
      const additionalRows = currentRows.filter(row => !row.hazardNo);

      // Combine hazard rows with additional rows, ensuring no duplicates
      const updatedRows = [...selectedHazards, ...additionalRows];

      // Update form state with shouldValidate and shouldDirty to ensure proper form state updates
      setValue('act.assessmentRows', updatedRows, { 
        shouldValidate: true,
        shouldDirty: true,
        shouldTouch: true
      });

      setCurrentSection(currentSection + 1);
    }
    // Special handling for Act section validation
    else if (currentSection === 3) {
      const isValid = await trigger("act");
      if (isValid) {
        setCurrentSection(currentSection + 1);
      }
    }
    // Default validation for other sections
    else {
      const isValid = await trigger(sectionKey);
      if (isValid && currentSection < sections.length - 1) {
        setCurrentSection(currentSection + 1);
      }
    }
  };

  const prevSection = () => {
    if (currentSection > 0) {
      setCurrentSection(currentSection - 1);
    }
  };

  return (
    <div className="flex">
      <div className="w-1/4 p-4">
        <h2 className="text-xl font-bold mb-4">Sections</h2>
        <ul>
          {sections.map((section, index) => (
            <li
              key={section}
              className={`mb-2 ${index === currentSection ? "font-bold" : ""}`}
            >
              {section}
            </li>
          ))}
        </ul>
      </div>
      <Card className="w-3/4">
        <CardContent className="p-6">
          <ProgressBar currentStep={currentSection} totalSteps={sections.length} />
          {submitError && (
            <div className="mb-4 p-4 bg-red-100 text-red-700 rounded whitespace-pre-wrap">
              {submitError}
              {Object.entries(errors).length > 0 && (
                <div className="mt-2">
                  <strong>Please check the following sections:</strong>
                  <ul className="list-disc list-inside mt-1">
                    {Object.keys(errors).map((section) => (
                      <li key={section} className="capitalize">
                        {section.replace(/([A-Z])/g, ' $1').trim()}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
          <form 
            onSubmit={handleSubmit(onSubmit)} 
            className="space-y-6"
          >
            {currentSection === 0 && (
              <>
                <h2 className="text-2xl font-bold">Job Description</h2>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="site">Site</Label>
                    <Input
                      id="site"
                      {...register("jobDescription.site")}
                      placeholder="Enter site"
                    />
                    {errors.jobDescription?.site && (
                      <ErrorDisplay error={errors.jobDescription.site.message} />
                    )}
                  </div>
                  <div>
                    <Label htmlFor="date">Date</Label>
                    <div className="flex items-center space-x-2">
                      <Input
                        id="date"
                        value={format(getValues("jobDescription.date") || new Date(), "yyyy/MM/dd")}
                        readOnly
                      />
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-10 p-0"
                            type="button"
                          >
                            <CalendarIcon className="h-4 w-4" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={getValues("jobDescription.date")}
                            onSelect={(date) => setValue("jobDescription.date", date as Date)}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    {errors.jobDescription?.date && (
                      <ErrorDisplay error={errors.jobDescription.date.message} />
                    )}
                  </div>
                  <div>
                    <Label htmlFor="rpicName">RPIC Name</Label>
                    <Input
                      id="rpicName"
                      {...register("jobDescription.rpicName")}
                      placeholder="Enter RPIC Name"
                    />
                    {errors.jobDescription?.rpicName && (
                      <ErrorDisplay error={errors.jobDescription.rpicName.message} />
                    )}
                  </div>
                  <div>
                    <Label htmlFor="time">Time</Label>
                    <Input
                      id="time"
                      type="time"
                      {...register("jobDescription.time")}
                    />
                    {errors.jobDescription?.time && (
                      <ErrorDisplay error={errors.jobDescription.time.message} />
                    )}
                  </div>
                  <div>
                    <Label htmlFor="chiefPilot">Chief Pilot</Label>
                    <Select onValueChange={(value) => setValue("jobDescription.chiefPilot", value as "Andrew Babcock" | "Dan Wilson")}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Chief Pilot" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Andrew Babcock">Andrew Babcock</SelectItem>
                        <SelectItem value="Dan Wilson">Dan Wilson</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.jobDescription?.chiefPilot && (
                      <ErrorDisplay error={errors.jobDescription.chiefPilot.message} />
                    )}
                  </div>
                  <div>
                    <Label htmlFor="hse">HSE</Label>
                    <Select onValueChange={(value) => setValue("jobDescription.hse", value as "Romeo Garza" | "Paul Roberts")}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select HSE" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Romeo Garza">Romeo Garza</SelectItem>
                        <SelectItem value="Paul Roberts">Paul Roberts</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.jobDescription?.hse && (
                      <ErrorDisplay error={errors.jobDescription.hse.message} />
                    )}
                  </div>
                </div>
              </>
            )}
            {currentSection === 1 && <Stop register={register} errors={errors} setValue={setValue} getValues={getValues} />}
            {currentSection === 2 && <Think register={register} errors={errors} control={control} setValue={setValue} getValues={getValues} />}
            {currentSection === 3 && <Act register={register} errors={errors} control={control} setValue={setValue} getValues={getValues} />}
            {currentSection === 4 && (
              <Review 
                register={register} 
                errors={errors} 
                control={control} 
                setValue={setValue} 
                getValues={getValues}
                trigger={trigger}
              />
            )}
            <div className="flex justify-between mt-4">
              {currentSection > 0 && (
                <Button type="button" onClick={prevSection} variant="outline">
                  Previous
                </Button>
              )}
              {currentSection < sections.length - 1 ? (
                <Button type="button" onClick={nextSection}>
                  Next
                </Button>
              ) : (
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Submitting..." : "Submit"}
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default POWRAForm;
