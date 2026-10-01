export interface RigVehicle {
  compressorRigVehicleRegNo: string;
  chassisNo: string;
  engineNo: string;
  supportingVehicle: boolean;
  supportingVehicleRegNo?: string;
  supportingChassisNo?: string;
  supportingEngineNo?: string;
}

export interface CompressorDetails {
  model: string;
  capacity: string;
}

export interface GeneratorDetails {
  type: string;
  model: string;
  capacity: string;
  engineNo: string;
}

export interface DrillingDetails {
  maxDepth: string;
  maxDiameter: string;
}

export interface OperatorDetails {
  name: string;
  age: string;
  experience: string;
  identityProof: 'election_card' | 'aadhar_card' | 'other';
  identityNumber: string;
}

export interface Rig {
  registrationNumber: string;
  expiryDate: string;
  rigType: string;
  ownerName: string;
  address: string;
  phone: string;
  email: string;
  district: string;
  state: string;
  pin: string;
  vehicle: RigVehicle;
  compressor: CompressorDetails;
  generator: GeneratorDetails;
  drillingDetails: DrillingDetails;
  operator: OperatorDetails;
}

export interface AgencyDetails {
  name: string;
  registrationNumber: string;
  district: string;
  address: string;
  phone: string;
  email: string;
  village: string;
  taluk: string;
  panchayat: string;
  pin: string;
  gstNumber: string;
  localBodyRegistrationNumber: string;
}

export interface RenewalForm {
  agency: AgencyDetails;
  rigs: Rig[];
}
