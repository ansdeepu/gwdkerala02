import * as z from 'zod';

export const OperatorSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  age: z.string().min(1, 'Age is required'),
  experience: z.string().min(1, 'Experience is required'),
  identityProof: z.enum(['election_card', 'aadhar_card', 'other']),
  identityNumber: z.string().min(1, 'Identity number is required'),
});

export const RigSchema = z.object({
  registrationNumber: z.string().min(1, 'Registration number is required'),
  expiryDate: z.string().min(1, 'Expiry date is required'),
  rigType: z.string().min(1, 'Rig type is required'),
  ownerName: z.string().min(1, 'Owner name is required'),
  address: z.string().min(1, 'Address is required'),
  phone: z.string().min(10, 'Phone number is required'),
  email: z.string().email('Invalid email'),
  district: z.string().min(1, 'District is required'),
  state: z.string().min(1, 'State is required'),
  pin: z.string().min(6, 'Pin code is required'),
  vehicle: z.object({
    compressorRigVehicleRegNo: z.string().min(1, 'Required'),
    chassisNo: z.string().min(1, 'Required'),
    engineNo: z.string().min(1, 'Required'),
    supportingVehicle: z.boolean(),
    supportingVehicleRegNo: z.string().optional(),
    supportingChassisNo: z.string().optional(),
    supportingEngineNo: z.string().optional(),
  }),
  compressor: z.object({
    model: z.string().min(1, 'Required'),
    capacity: z.string().min(1, 'Required'),
  }),
  generator: z.object({
    type: z.string().min(1, 'Required'),
    model: z.string().min(1, 'Required'),
    capacity: z.string().min(1, 'Required'),
    engineNo: z.string().min(1, 'Required'),
  }),
  drillingDetails: z.object({
    maxDepth: z.string().min(1, 'Required'),
    maxDiameter: z.string().min(1, 'Required'),
  }),
  operator: OperatorSchema,
});

export const AgencySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  registrationNumber: z.string().min(1, 'Registration number is required'),
  district: z.string().min(1, 'District is required'),
  address: z.string().min(1, 'Address is required'),
  phone: z.string().min(10, 'Phone number is required'),
  email: z.string().email('Invalid email'),
  village: z.string().min(1, 'Village is required'),
  taluk: z.string().min(1, 'Taluk is required'),
  panchayat: z.string().min(1, 'Panchayat is required'),
  state: z.string().optional(),
  pin: z.string().min(6, 'Pin code is required'),
  gstNumber: z.string().min(1, 'GST number is required'),
  localBodyRegistrationNumber: z.string().min(1, 'Local body registration number is required'),
});

export const RenewalFormSchema = z.object({
  agency: AgencySchema,
  rigs: z.array(RigSchema),
});
