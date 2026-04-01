/* eslint-disable */
// @ts-nocheck
import { IDL } from '@icp-sdk/core/candid';

const Role = IDL.Variant({ Pharmacist: IDL.Null, Employer: IDL.Null });

const PharmacistProfile = IDL.Record({
  userId: IDL.Nat,
  name: IDL.Text,
  mobileNumber: IDL.Text,
  pciNumber: IDL.Text,
  state: IDL.Text,
  licenseStatus: IDL.Text,
  companyName: IDL.Text,
  resumeFileId: IDL.Text,
});

const EmployerProfile = IDL.Record({
  userId: IDL.Nat,
  companyName: IDL.Text,
  mobileNumber: IDL.Text,
  location: IDL.Text,
  state: IDL.Text,
});

const ApprovalStatus = IDL.Variant({ Pending: IDL.Null, Approved: IDL.Null, Rejected: IDL.Null });

const EmployerWithStatus = IDL.Record({
  userId: IDL.Nat,
  name: IDL.Text,
  email: IDL.Text,
  companyName: IDL.Text,
  mobileNumber: IDL.Text,
  location: IDL.Text,
  state: IDL.Text,
  approvalStatus: ApprovalStatus,
});

const Job = IDL.Record({
  id: IDL.Nat,
  employerId: IDL.Nat,
  title: IDL.Text,
  location: IDL.Text,
  description: IDL.Text,
  createdAt: IDL.Int,
});

const Application = IDL.Record({
  id: IDL.Nat,
  pharmacistId: IDL.Nat,
  jobId: IDL.Nat,
  employerId: IDL.Nat,
  appliedAt: IDL.Int,
});

const SignupResult = IDL.Variant({
  ok: IDL.Record({ token: IDL.Text, userId: IDL.Nat, role: Role }),
  err: IDL.Text,
});

const LoginResult = IDL.Variant({
  ok: IDL.Record({ token: IDL.Text, userId: IDL.Nat, role: Role, name: IDL.Text }),
  err: IDL.Text,
});

const AdminLoginResult = IDL.Variant({
  ok: IDL.Record({ token: IDL.Text }),
  err: IDL.Text,
});

const OkErrNull = IDL.Variant({ ok: IDL.Null, err: IDL.Text });
const OkErrNat = IDL.Variant({ ok: IDL.Nat, err: IDL.Text });
const PharmacistResult = IDL.Variant({ ok: PharmacistProfile, err: IDL.Text });
const EmployerResult = IDL.Variant({ ok: EmployerProfile, err: IDL.Text });
const JobResult = IDL.Variant({ ok: Job, err: IDL.Text });
const JobsResult = IDL.Variant({ ok: IDL.Vec(Job), err: IDL.Text });
const ApplicationsResult = IDL.Variant({ ok: IDL.Vec(Application), err: IDL.Text });
const UserResult = IDL.Variant({ ok: IDL.Record({ id: IDL.Nat, name: IDL.Text, role: Role }), err: IDL.Text });
const EmployersResult = IDL.Variant({ ok: IDL.Vec(EmployerWithStatus), err: IDL.Text });

export const idlService = IDL.Service({
  signup: IDL.Func([IDL.Text, IDL.Text, IDL.Text, Role], [SignupResult], []),
  login: IDL.Func([IDL.Text, IDL.Text], [LoginResult], []),
  logout: IDL.Func([IDL.Text], [], []),
  adminLogin: IDL.Func([IDL.Text, IDL.Text], [AdminLoginResult], []),
  getAllEmployers: IDL.Func([IDL.Text], [EmployersResult], []),
  approveEmployer: IDL.Func([IDL.Text, IDL.Nat], [OkErrNull], []),
  rejectEmployer: IDL.Func([IDL.Text, IDL.Nat], [OkErrNull], []),
  savePharmacistProfile: IDL.Func([IDL.Text, IDL.Text, IDL.Text, IDL.Text, IDL.Text, IDL.Text, IDL.Text, IDL.Text], [OkErrNull], []),
  getPharmacistProfile: IDL.Func([IDL.Text], [PharmacistResult], []),
  saveEmployerProfile: IDL.Func([IDL.Text, IDL.Text, IDL.Text, IDL.Text, IDL.Text], [OkErrNull], []),
  getEmployerProfile: IDL.Func([IDL.Text], [EmployerResult], []),
  postJob: IDL.Func([IDL.Text, IDL.Text, IDL.Text, IDL.Text], [OkErrNat], []),
  getAllJobs: IDL.Func([], [IDL.Vec(Job)], ['query']),
  getAllPharmacists: IDL.Func([], [IDL.Vec(PharmacistProfile)], ['query']),
  getEmployerJobs: IDL.Func([IDL.Text], [JobsResult], []),
  deleteJob: IDL.Func([IDL.Text, IDL.Nat], [OkErrNull], []),
  applyToJob: IDL.Func([IDL.Text, IDL.Nat], [OkErrNat], []),
  getMyApplications: IDL.Func([IDL.Text], [ApplicationsResult], []),
  getEmployerApplications: IDL.Func([IDL.Text], [ApplicationsResult], []),
  getEmployerProfileById: IDL.Func([IDL.Nat], [EmployerResult], ['query']),
  getPharmacistById: IDL.Func([IDL.Nat], [PharmacistResult], ['query']),
  getJobById: IDL.Func([IDL.Nat], [JobResult], ['query']),
  getUserById: IDL.Func([IDL.Nat], [UserResult], ['query']),
});

export const idlInitArgs = [];
export const idlFactory = ({ IDL }) => {
  const Role = IDL.Variant({ Pharmacist: IDL.Null, Employer: IDL.Null });
  const PharmacistProfile = IDL.Record({
    userId: IDL.Nat, name: IDL.Text, mobileNumber: IDL.Text,
    pciNumber: IDL.Text, state: IDL.Text, licenseStatus: IDL.Text,
    companyName: IDL.Text, resumeFileId: IDL.Text,
  });
  const EmployerProfile = IDL.Record({
    userId: IDL.Nat, companyName: IDL.Text, mobileNumber: IDL.Text,
    location: IDL.Text, state: IDL.Text,
  });
  const ApprovalStatus = IDL.Variant({ Pending: IDL.Null, Approved: IDL.Null, Rejected: IDL.Null });
  const EmployerWithStatus = IDL.Record({
    userId: IDL.Nat, name: IDL.Text, email: IDL.Text,
    companyName: IDL.Text, mobileNumber: IDL.Text,
    location: IDL.Text, state: IDL.Text, approvalStatus: ApprovalStatus,
  });
  const Job = IDL.Record({
    id: IDL.Nat, employerId: IDL.Nat, title: IDL.Text,
    location: IDL.Text, description: IDL.Text, createdAt: IDL.Int,
  });
  const Application = IDL.Record({
    id: IDL.Nat, pharmacistId: IDL.Nat, jobId: IDL.Nat,
    employerId: IDL.Nat, appliedAt: IDL.Int,
  });
  const SignupResult = IDL.Variant({ ok: IDL.Record({ token: IDL.Text, userId: IDL.Nat, role: Role }), err: IDL.Text });
  const LoginResult = IDL.Variant({ ok: IDL.Record({ token: IDL.Text, userId: IDL.Nat, role: Role, name: IDL.Text }), err: IDL.Text });
  const AdminLoginResult = IDL.Variant({ ok: IDL.Record({ token: IDL.Text }), err: IDL.Text });
  const OkErrNull = IDL.Variant({ ok: IDL.Null, err: IDL.Text });
  const OkErrNat = IDL.Variant({ ok: IDL.Nat, err: IDL.Text });
  const PharmacistResult = IDL.Variant({ ok: PharmacistProfile, err: IDL.Text });
  const EmployerResult = IDL.Variant({ ok: EmployerProfile, err: IDL.Text });
  const JobResult = IDL.Variant({ ok: Job, err: IDL.Text });
  const JobsResult = IDL.Variant({ ok: IDL.Vec(Job), err: IDL.Text });
  const AppResult = IDL.Variant({ ok: IDL.Vec(Application), err: IDL.Text });
  const UserResult = IDL.Variant({ ok: IDL.Record({ id: IDL.Nat, name: IDL.Text, role: Role }), err: IDL.Text });
  const EmployersResult = IDL.Variant({ ok: IDL.Vec(EmployerWithStatus), err: IDL.Text });
  return IDL.Service({
    signup: IDL.Func([IDL.Text, IDL.Text, IDL.Text, Role], [SignupResult], []),
    login: IDL.Func([IDL.Text, IDL.Text], [LoginResult], []),
    logout: IDL.Func([IDL.Text], [], []),
    adminLogin: IDL.Func([IDL.Text, IDL.Text], [AdminLoginResult], []),
    getAllEmployers: IDL.Func([IDL.Text], [EmployersResult], []),
    approveEmployer: IDL.Func([IDL.Text, IDL.Nat], [OkErrNull], []),
    rejectEmployer: IDL.Func([IDL.Text, IDL.Nat], [OkErrNull], []),
    savePharmacistProfile: IDL.Func([IDL.Text, IDL.Text, IDL.Text, IDL.Text, IDL.Text, IDL.Text, IDL.Text, IDL.Text], [OkErrNull], []),
    getPharmacistProfile: IDL.Func([IDL.Text], [PharmacistResult], []),
    saveEmployerProfile: IDL.Func([IDL.Text, IDL.Text, IDL.Text, IDL.Text, IDL.Text], [OkErrNull], []),
    getEmployerProfile: IDL.Func([IDL.Text], [EmployerResult], []),
    postJob: IDL.Func([IDL.Text, IDL.Text, IDL.Text, IDL.Text], [OkErrNat], []),
    getAllJobs: IDL.Func([], [IDL.Vec(Job)], ['query']),
    getAllPharmacists: IDL.Func([], [IDL.Vec(PharmacistProfile)], ['query']),
    getEmployerJobs: IDL.Func([IDL.Text], [JobsResult], []),
    deleteJob: IDL.Func([IDL.Text, IDL.Nat], [OkErrNull], []),
    applyToJob: IDL.Func([IDL.Text, IDL.Nat], [OkErrNat], []),
    getMyApplications: IDL.Func([IDL.Text], [AppResult], []),
    getEmployerApplications: IDL.Func([IDL.Text], [AppResult], []),
    getEmployerProfileById: IDL.Func([IDL.Nat], [EmployerResult], ['query']),
    getPharmacistById: IDL.Func([IDL.Nat], [PharmacistResult], ['query']),
    getJobById: IDL.Func([IDL.Nat], [JobResult], ['query']),
    getUserById: IDL.Func([IDL.Nat], [UserResult], ['query']),
  });
};
export const init = ({ IDL }) => { return []; };
