/* eslint-disable */
// @ts-nocheck
import { Actor, HttpAgent, type HttpAgentOptions, type ActorConfig, type Agent, type ActorSubclass } from "@icp-sdk/core/agent";
import type { Principal } from "@icp-sdk/core/principal";
import { idlFactory, type _SERVICE } from "./declarations/backend.did";

export type Role = { Pharmacist: null } | { Employer: null };

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

export interface Some<T> { __kind__: "Some"; value: T; }
export interface None { __kind__: "None"; }
export type Option<T> = Some<T> | None;

export class ExternalBlob {
  _blob?: Uint8Array<ArrayBuffer> | null;
  directURL: string;
  onProgress?: (percentage: number) => void = undefined;
  private constructor(directURL: string, blob: Uint8Array<ArrayBuffer> | null) {
    if (blob) this._blob = blob;
    this.directURL = directURL;
  }
  static fromURL(url: string): ExternalBlob { return new ExternalBlob(url, null); }
  static fromBytes(blob: Uint8Array<ArrayBuffer>): ExternalBlob {
    const url = URL.createObjectURL(new Blob([new Uint8Array(blob)], { type: 'application/octet-stream' }));
    return new ExternalBlob(url, blob);
  }
  public async getBytes(): Promise<Uint8Array<ArrayBuffer>> {
    if (this._blob) return this._blob;
    const response = await fetch(this.directURL);
    const blob = await response.blob();
    this._blob = new Uint8Array(await blob.arrayBuffer());
    return this._blob;
  }
  public getDirectURL(): string { return this.directURL; }
  public withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob {
    this.onProgress = onProgress;
    return this;
  }
}

export interface backendInterface {
  _initializeAccessControlWithSecret(secret: string): Promise<void>;
  signup(name: string, email: string, password: string, role: Role): Promise<{ ok: { token: string; userId: bigint; role: Role } } | { err: string }>;
  login(email: string, password: string): Promise<{ ok: { token: string; userId: bigint; role: Role; name: string } } | { err: string }>;
  logout(token: string): Promise<void>;
  savePharmacistProfile(token: string, name: string, mobileNumber: string, pciNumber: string, state: string, licenseStatus: string, companyName: string, resumeFileId: string): Promise<{ ok: null } | { err: string }>;
  getPharmacistProfile(token: string): Promise<{ ok: PharmacistProfile } | { err: string }>;
  saveEmployerProfile(token: string, companyName: string, mobileNumber: string, location: string, state: string): Promise<{ ok: null } | { err: string }>;
  getEmployerProfile(token: string): Promise<{ ok: EmployerProfile } | { err: string }>;
  postJob(token: string, title: string, location: string, description: string): Promise<{ ok: bigint } | { err: string }>;
  getAllJobs(): Promise<Job[]>;
  getEmployerJobs(token: string): Promise<{ ok: Job[] } | { err: string }>;
  deleteJob(token: string, jobId: bigint): Promise<{ ok: null } | { err: string }>;
  applyToJob(token: string, jobId: bigint): Promise<{ ok: bigint } | { err: string }>;
  getMyApplications(token: string): Promise<{ ok: Application[] } | { err: string }>;
  getEmployerApplications(token: string): Promise<{ ok: Application[] } | { err: string }>;
  getPharmacistById(userId: bigint): Promise<{ ok: PharmacistProfile } | { err: string }>;
  getJobById(jobId: bigint): Promise<{ ok: Job } | { err: string }>;
  getUserById(userId: bigint): Promise<{ ok: { id: bigint; name: string; role: Role } } | { err: string }>;
  getEmployerProfileById(userId: bigint): Promise<{ ok: EmployerProfile } | { err: string }>;
  getAllPharmacists(): Promise<PharmacistProfile[]>;
}

export class Backend implements backendInterface {
  constructor(
    private actor: ActorSubclass<_SERVICE>,
    private _uploadFile: (file: ExternalBlob) => Promise<Uint8Array>,
    private _downloadFile: (file: Uint8Array) => Promise<ExternalBlob>,
    private processError?: (error: unknown) => never
  ) {}

  async _initializeAccessControlWithSecret(secret: string): Promise<void> {
    return (this.actor as any)._initializeAccessControlWithSecret(secret);
  }
  async signup(name: string, email: string, password: string, role: Role) {
    return this.actor.signup(name, email, password, role);
  }
  async login(email: string, password: string) {
    return this.actor.login(email, password);
  }
  async logout(token: string) {
    return this.actor.logout(token);
  }
  async savePharmacistProfile(token: string, name: string, mobileNumber: string, pciNumber: string, state: string, licenseStatus: string, companyName: string, resumeFileId: string) {
    return this.actor.savePharmacistProfile(token, name, mobileNumber, pciNumber, state, licenseStatus, companyName, resumeFileId);
  }
  async getPharmacistProfile(token: string) {
    return this.actor.getPharmacistProfile(token);
  }
  async saveEmployerProfile(token: string, companyName: string, mobileNumber: string, location: string, state: string) {
    return this.actor.saveEmployerProfile(token, companyName, mobileNumber, location, state);
  }
  async getEmployerProfile(token: string) {
    return this.actor.getEmployerProfile(token);
  }
  async postJob(token: string, title: string, location: string, description: string) {
    return this.actor.postJob(token, title, location, description);
  }
  async getAllJobs() {
    return this.actor.getAllJobs();
  }
  async getEmployerJobs(token: string) {
    return this.actor.getEmployerJobs(token);
  }
  async deleteJob(token: string, jobId: bigint) {
    return this.actor.deleteJob(token, jobId);
  }
  async applyToJob(token: string, jobId: bigint) {
    return this.actor.applyToJob(token, jobId);
  }
  async getMyApplications(token: string) {
    return this.actor.getMyApplications(token);
  }
  async getEmployerApplications(token: string) {
    return this.actor.getEmployerApplications(token);
  }
  async getPharmacistById(userId: bigint) {
    return this.actor.getPharmacistById(userId);
  }
  async getJobById(jobId: bigint) {
    return this.actor.getJobById(jobId);
  }
  async getUserById(userId: bigint) {
    return this.actor.getUserById(userId);
  }
  async getEmployerProfileById(userId: bigint) {
    return this.actor.getEmployerProfileById(userId);
  }
  async getAllPharmacists() {
    return this.actor.getAllPharmacists();
  }
}

export interface CreateActorOptions {
  agent?: Agent;
  agentOptions?: HttpAgentOptions;
  actorOptions?: ActorConfig;
  processError?: (error: unknown) => never;
}

export function createActor(
  canisterId: string,
  _uploadFile: (file: ExternalBlob) => Promise<Uint8Array>,
  _downloadFile: (file: Uint8Array) => Promise<ExternalBlob>,
  options: CreateActorOptions = {}
): Backend {
  const agent = options.agent || HttpAgent.createSync({ ...options.agentOptions });
  if (options.agent && options.agentOptions) {
    console.warn("Detected both agent and agentOptions passed to createActor. Ignoring agentOptions and proceeding with the provided agent.");
  }
  const actor = Actor.createActor<_SERVICE>(idlFactory, {
    agent,
    canisterId,
    ...options.actorOptions,
  });
  return new Backend(actor, _uploadFile, _downloadFile, options.processError);
}
