import { ActorMethod } from '@dfinity/agent';

export type Role = { Pharmacist: null } | { Employer: null };
export type ApprovalStatus = { Pending: null } | { Approved: null } | { Rejected: null };

export interface PharmacistProfile {
  userId: bigint;
  name: string;
  mobileNumber: string;
  pciNumber: string;
  state: string;
  licenseStatus: string;
  companyName: string;
  resumeFileId: string;
}

export interface EmployerProfile {
  userId: bigint;
  companyName: string;
  mobileNumber: string;
  location: string;
  state: string;
}

export interface EmployerWithStatus {
  userId: bigint;
  name: string;
  email: string;
  companyName: string;
  mobileNumber: string;
  location: string;
  state: string;
  approvalStatus: ApprovalStatus;
}

export interface Job {
  id: bigint;
  employerId: bigint;
  title: string;
  location: string;
  description: string;
  createdAt: bigint;
}

export interface Application {
  id: bigint;
  pharmacistId: bigint;
  jobId: bigint;
  employerId: bigint;
  appliedAt: bigint;
}

export interface _SERVICE {
  signup: ActorMethod<[string, string, string, Role], { ok: { token: string; userId: bigint; role: Role } } | { err: string }>;
  login: ActorMethod<[string, string], { ok: { token: string; userId: bigint; role: Role; name: string } } | { err: string }>;
  logout: ActorMethod<[string], void>;
  adminLogin: ActorMethod<[string, string], { ok: { token: string } } | { err: string }>;
  getAllEmployers: ActorMethod<[string], { ok: EmployerWithStatus[] } | { err: string }>;
  approveEmployer: ActorMethod<[string, bigint], { ok: null } | { err: string }>;
  rejectEmployer: ActorMethod<[string, bigint], { ok: null } | { err: string }>;
  savePharmacistProfile: ActorMethod<[string, string, string, string, string, string, string, string], { ok: null } | { err: string }>;
  getPharmacistProfile: ActorMethod<[string], { ok: PharmacistProfile } | { err: string }>;
  saveEmployerProfile: ActorMethod<[string, string, string, string, string], { ok: null } | { err: string }>;
  getEmployerProfile: ActorMethod<[string], { ok: EmployerProfile } | { err: string }>;
  postJob: ActorMethod<[string, string, string, string], { ok: bigint } | { err: string }>;
  getAllJobs: ActorMethod<[], Job[]>;
  getEmployerJobs: ActorMethod<[string], { ok: Job[] } | { err: string }>;
  deleteJob: ActorMethod<[string, bigint], { ok: null } | { err: string }>;
  applyToJob: ActorMethod<[string, bigint], { ok: bigint } | { err: string }>;
  getMyApplications: ActorMethod<[string], { ok: Application[] } | { err: string }>;
  getEmployerApplications: ActorMethod<[string], { ok: Application[] } | { err: string }>;
  getPharmacistById: ActorMethod<[bigint], { ok: PharmacistProfile } | { err: string }>;
  getJobById: ActorMethod<[bigint], { ok: Job } | { err: string }>;
  getUserById: ActorMethod<[bigint], { ok: { id: bigint; name: string; role: Role } } | { err: string }>;
  getEmployerProfileById: ActorMethod<[bigint], { ok: EmployerProfile } | { err: string }>;
  getAllPharmacists: ActorMethod<[], PharmacistProfile[]>;
}
