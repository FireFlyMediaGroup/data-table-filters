import { Control, FieldErrors, UseFormRegister, UseFormSetValue, UseFormGetValues } from 'react-hook-form';
import { z } from 'zod';

// Base schema definitions
const baseJobDescriptionSchema = z.object({
  site: z.string().min(1, "Site is required"),
  date: z.date(),
  rpicName: z.string().min(1, "RPIC Name is required"),
  time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format"),
  chiefPilot: z.enum(["Andrew Babcock", "Dan Wilson"]),
  hse: z.enum(["Romeo Garza", "Paul Roberts"]),
});

const baseStopSchema = z.object({
  beforeYouStart: z.object({
    authorisedLocation: z.enum(['yes', 'no', 'n/a']).refine((val) => val !== undefined, {
      message: 'Please select an option'
    }),
    correctDocumentation: z.enum(['yes', 'no', 'n/a']).refine((val) => val !== undefined, {
      message: 'Please select an option'
    }),
    correctPPE: z.enum(['yes', 'no', 'n/a']).refine((val) => val !== undefined, {
      message: 'Please select an option'
    }),
    competentAuthorised: z.enum(['yes', 'no', 'n/a']).refine((val) => val !== undefined, {
      message: 'Please select an option'
    }),
    inspectionEquipment: z.enum(['yes', 'no', 'n/a']).refine((val) => val !== undefined, {
      message: 'Please select an option'
    }),
    accessEgress: z.enum(['yes', 'no', 'n/a']).refine((val) => val !== undefined, {
      message: 'Please select an option'
    }),
    environmentalCondition: z.enum(['yes', 'no', 'n/a']).refine((val) => val !== undefined, {
      message: 'Please select an option'
    }),
  }),
});

const baseThinkSchema = z.object({
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
  hazardsIncludedInRAMS: z.enum(['yes', 'no']).refine((val) => val !== undefined, {
    message: 'This question must be answered'
  }),
  rescuePlansInPlace: z.enum(['yes', 'no', 'n/a']).refine((val) => val !== undefined, {
    message: 'This question must be answered'
  }),
});

const baseActSchema = z.object({
  controlMeasures: z.object({
    ppe: z.boolean().default(false),
    trainingRequired: z.boolean().default(false),
    equipmentInspection: z.boolean().default(false),
    workAreaSetup: z.boolean().default(false),
    communicationPlan: z.boolean().default(false),
    emergencyProcedures: z.boolean().default(false),
  }),
  additionalMeasures: z.string().optional(),
  assessmentRows: z.array(z.object({
    hazardNo: z.string().optional(),
    controlMeasures: z.string().max(250, "Control measures cannot exceed 250 characters"),
    residualRisk: z.enum(['high', 'medium', 'low']).default('low'),
  })).refine((rows) => {
    // Only require rows if they have a hazard number
    const hazardRows = rows.filter(row => row.hazardNo);
    return hazardRows.length === 0 || hazardRows.every(row => row.controlMeasures.trim() !== '');
  }, "Control measures are required for identified hazards"),
});

const baseReviewSchema = z.object({
  briefingRecord: z.array(z.object({
    name: z.string().optional(),
  })).superRefine((arr, ctx) => {
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
    hasLessons: z.enum(['yes', 'no']).optional(),
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
});

// Define AssessmentRow type based on the schema
export interface AssessmentRow {
  hazardNo?: string;
  controlMeasures: string;
  residualRisk: 'high' | 'medium' | 'low';
}

// Section types
export type JobDescriptionData = z.infer<typeof baseJobDescriptionSchema>;
export type StopData = z.infer<typeof baseStopSchema>;
export type ThinkData = z.infer<typeof baseThinkSchema>;
export type ActData = z.infer<typeof baseActSchema>;
export type ReviewData = z.infer<typeof baseReviewSchema>;

// Complete form data type
export type POWRAFormData = {
  jobDescription: JobDescriptionData;
  stop: StopData;
  think: ThinkData;
  act: ActData;
  review: ReviewData;
};

// Form section props interface
export interface FormSectionProps {
  register: UseFormRegister<POWRAFormData>;
  errors: FieldErrors<POWRAFormData>;
  control?: Control<POWRAFormData>;
  setValue: UseFormSetValue<POWRAFormData>;
  getValues: UseFormGetValues<POWRAFormData>;
}

// Form schemas
export const jobDescriptionSchema = baseJobDescriptionSchema;
export const stopSchema = baseStopSchema;
export const thinkSchema = baseThinkSchema;
export const actSchema = baseActSchema;
export const reviewSchema = baseReviewSchema;

// Complete form schema
export const powraSchema = z.object({
  jobDescription: baseJobDescriptionSchema,
  stop: baseStopSchema,
  think: baseThinkSchema,
  act: baseActSchema,
  review: baseReviewSchema,
});
