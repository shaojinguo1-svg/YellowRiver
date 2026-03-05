import { z } from "zod";

const usPhoneRegex = /^\(?(\d{3})\)?[-.\s]?(\d{3})[-.\s]?(\d{4})$/;

// Step 1 - Personal Info
export const personalInfoSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().regex(usPhoneRegex, "Please enter a valid US phone number"),
  dateOfBirth: z.string().min(1, "Date of birth is required").refine(
    (val) => {
      if (!val) return false;
      const dob = new Date(val);
      const today = new Date();
      const age = today.getFullYear() - dob.getFullYear();
      const monthDiff = today.getMonth() - dob.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
        return age - 1 >= 18;
      }
      return age >= 18;
    },
    { message: "You must be at least 18 years old" }
  ),
});

// Step 2 - Current Address
export const currentAddressSchema = z.object({
  currentAddress: z.string().min(5, "Address must be at least 5 characters"),
  currentCity: z.string().min(2, "City must be at least 2 characters"),
  currentState: z.string().length(2, "Please select a state"),
  currentZip: z.string().regex(/^\d{5}$/, "ZIP code must be 5 digits"),
  monthlyRent: z.string().optional().refine(
    (val) => {
      if (!val || val.trim() === "") return true;
      const num = parseFloat(val);
      return !isNaN(num) && num > 0;
    },
    { message: "Monthly rent must be a positive number" }
  ),
  moveInDate: z.string().min(1, "Move-in date is required").refine(
    (val) => {
      if (!val) return false;
      const date = new Date(val);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return date >= today;
    },
    { message: "Move-in date must be today or in the future" }
  ),
});

// Step 3 - Employment
export const employmentSchema = z.object({
  employer: z.string().optional(),
  jobTitle: z.string().optional(),
  monthlyIncome: z.string().min(1, "Monthly income is required").refine(
    (val) => {
      if (!val) return false;
      const num = parseFloat(val);
      return !isNaN(num) && num > 0;
    },
    { message: "Monthly income must be a positive number" }
  ),
  employmentLength: z.string().optional(),
});

// Step 4 - References
export const referencesSchema = z.object({
  landlordName: z.string().optional(),
  landlordPhone: z.string().optional().refine(
    (val) => !val || val === "" || usPhoneRegex.test(val),
    { message: "Please enter a valid US phone number" }
  ),
  emergencyName: z.string().min(2, "Emergency contact name must be at least 2 characters"),
  emergencyPhone: z.string().regex(usPhoneRegex, "Please enter a valid US phone number"),
});

// Step 5 - Documents & Additional (base schema without cross-field refinement)
export const documentsSchema = z.object({
  numberOfOccupants: z.string().min(1, "Number of occupants is required").refine(
    (val) => {
      if (!val) return false;
      const num = parseInt(val, 10);
      return !isNaN(num) && Number.isInteger(num) && num >= 1;
    },
    { message: "There must be at least 1 occupant" }
  ),
  hasPets: z.boolean(),
  petDescription: z.string().optional(),
  additionalNotes: z.string().optional(),
});

// Step 6 - Consent
export const consentSchema = z.object({
  consentBackground: z.boolean().refine((val) => val === true, {
    message: "You must consent to a background check",
  }),
  consentTerms: z.boolean().refine((val) => val === true, {
    message: "You must agree to the terms and conditions",
  }),
});

// Combined full application schema (plain z.object, no top-level refine)
export const applicationSchema = z.object({
  // Step 1 - Personal Info
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().regex(usPhoneRegex, "Please enter a valid US phone number"),
  dateOfBirth: z.string().min(1, "Date of birth is required").refine(
    (val) => {
      if (!val) return false;
      const dob = new Date(val);
      const today = new Date();
      const age = today.getFullYear() - dob.getFullYear();
      const monthDiff = today.getMonth() - dob.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
        return age - 1 >= 18;
      }
      return age >= 18;
    },
    { message: "You must be at least 18 years old" }
  ),
  // Step 2 - Current Address
  currentAddress: z.string().min(5, "Address must be at least 5 characters"),
  currentCity: z.string().min(2, "City must be at least 2 characters"),
  currentState: z.string().length(2, "Please select a state"),
  currentZip: z.string().regex(/^\d{5}$/, "ZIP code must be 5 digits"),
  monthlyRent: z.string().optional().refine(
    (val) => {
      if (!val || val.trim() === "") return true;
      const num = parseFloat(val);
      return !isNaN(num) && num > 0;
    },
    { message: "Monthly rent must be a positive number" }
  ),
  moveInDate: z.string().min(1, "Move-in date is required").refine(
    (val) => {
      if (!val) return false;
      const date = new Date(val);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return date >= today;
    },
    { message: "Move-in date must be today or in the future" }
  ),
  // Step 3 - Employment
  employer: z.string().optional(),
  jobTitle: z.string().optional(),
  monthlyIncome: z.string().min(1, "Monthly income is required").refine(
    (val) => {
      if (!val) return false;
      const num = parseFloat(val);
      return !isNaN(num) && num > 0;
    },
    { message: "Monthly income must be a positive number" }
  ),
  employmentLength: z.string().optional(),
  // Step 4 - References
  landlordName: z.string().optional(),
  landlordPhone: z.string().optional().refine(
    (val) => !val || val === "" || usPhoneRegex.test(val),
    { message: "Please enter a valid US phone number" }
  ),
  emergencyName: z.string().min(2, "Emergency contact name must be at least 2 characters"),
  emergencyPhone: z.string().regex(usPhoneRegex, "Please enter a valid US phone number"),
  // Step 5 - Documents & Additional
  numberOfOccupants: z.string().min(1, "Number of occupants is required").refine(
    (val) => {
      if (!val) return false;
      const num = parseInt(val, 10);
      return !isNaN(num) && Number.isInteger(num) && num >= 1;
    },
    { message: "There must be at least 1 occupant" }
  ),
  hasPets: z.boolean(),
  petDescription: z.string().optional(),
  additionalNotes: z.string().optional(),
  // Step 6 - Consent
  consentBackground: z.boolean().refine((val) => val === true, {
    message: "You must consent to a background check",
  }),
  consentTerms: z.boolean().refine((val) => val === true, {
    message: "You must agree to the terms and conditions",
  }),
});

// Field groups for step-by-step validation
export const STEP_FIELDS = {
  1: ["firstName", "lastName", "email", "phone", "dateOfBirth"] as const,
  2: ["currentAddress", "currentCity", "currentState", "currentZip", "monthlyRent", "moveInDate"] as const,
  3: ["employer", "jobTitle", "monthlyIncome", "employmentLength"] as const,
  4: ["landlordName", "landlordPhone", "emergencyName", "emergencyPhone"] as const,
  5: ["numberOfOccupants", "hasPets", "petDescription", "additionalNotes"] as const,
  6: ["consentBackground", "consentTerms"] as const,
} as const;

// The inferred type keeps everything as strings (matching form inputs)
export type ApplicationInput = z.infer<typeof applicationSchema>;
export type PersonalInfoInput = z.infer<typeof personalInfoSchema>;
export type CurrentAddressInput = z.infer<typeof currentAddressSchema>;
export type EmploymentInput = z.infer<typeof employmentSchema>;
export type ReferencesInput = z.infer<typeof referencesSchema>;
export type DocumentsInput = z.infer<typeof documentsSchema>;
export type ConsentInput = z.infer<typeof consentSchema>;
