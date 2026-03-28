/* eslint-disable */
// @ts-nocheck
import type { ActorMethod } from '@icp-sdk/core/agent';
import type { IDL } from '@icp-sdk/core/candid';

export type Role = { 'Pharmacist': null } | { 'Employer': null };

export interface PharmacistProfile {
  userId: bigint; name: string; mobileNumber: string;
  pciNumber: string; state: string; licenseStatus: string;
  companyName: string; resumeFileId: string;
}
export interface EmployerProfile {
  userId: bigint; companyName: string; mobileNumber: string;
  location: string; state: string;
}
export interface Job {
  id: bigint; employerId: bigint; title: string;
  location: string; description: string; createdAt: bigint;
}
export interface Application {
  id: bigint; pharmacistId: bigint; jobId: bigint;
  employerId: bigint; appliedAt: bigint;
}

export interface _SERVICE {
  signup: ActorMethod<[string, string, string, Role], { ok: { token: string; userId: bigint; role: Role } } | { err: string }>;
  login: ActorMethod<[string, string], { ok: { token: string; userId: bigint; role: Role; name: string } } | { err: string }>;
  logout: ActorMethod<[string], void>;
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
}

export declare const idlService: IDL.ServiceClass;
export declare const idlInitArgs: IDL.Type[];
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
