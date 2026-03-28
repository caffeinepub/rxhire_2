import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;

export type Role = { Pharmacist: null } | { Employer: null };

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

export interface backendInterface {
    _initializeAccessControlWithSecret(secret: string): Promise<void>;
    signup(name: string, email: string, password: string, role: Role): Promise<
        { ok: { token: string; userId: bigint; role: Role } } | { err: string }
    >;
    login(email: string, password: string): Promise<
        { ok: { token: string; userId: bigint; role: Role; name: string } } | { err: string }
    >;
    logout(token: string): Promise<void>;
    savePharmacistProfile(
        token: string, name: string, mobileNumber: string,
        pciNumber: string, state: string, licenseStatus: string,
        companyName: string, resumeFileId: string
    ): Promise<{ ok: null } | { err: string }>;
    getPharmacistProfile(token: string): Promise<{ ok: PharmacistProfile } | { err: string }>;
    saveEmployerProfile(
        token: string, companyName: string, mobileNumber: string,
        location: string, state: string
    ): Promise<{ ok: null } | { err: string }>;
    getEmployerProfile(token: string): Promise<{ ok: EmployerProfile } | { err: string }>;
    postJob(token: string, title: string, location: string, description: string): Promise<{ ok: bigint } | { err: string }>;
    getAllJobs(): Promise<Job[]>;
    getAllPharmacists(): Promise<PharmacistProfile[]>;
    getEmployerJobs(token: string): Promise<{ ok: Job[] } | { err: string }>;
    deleteJob(token: string, jobId: bigint): Promise<{ ok: null } | { err: string }>;
    applyToJob(token: string, jobId: bigint): Promise<{ ok: bigint } | { err: string }>;
    getMyApplications(token: string): Promise<{ ok: Application[] } | { err: string }>;
    getEmployerApplications(token: string): Promise<{ ok: Application[] } | { err: string }>;
    getEmployerProfileById(userId: bigint): Promise<{ ok: EmployerProfile } | { err: string }>;
    getPharmacistById(userId: bigint): Promise<{ ok: PharmacistProfile } | { err: string }>;
    getJobById(jobId: bigint): Promise<{ ok: Job } | { err: string }>;
    getUserById(userId: bigint): Promise<{ ok: { id: bigint; name: string; role: Role } } | { err: string }>;
}
