# RxHire

## Current State
Admin can delete employers, pharmacists, and jobs. Deletions are hard-deletes (cascading) — records are permanently removed from all storage maps. Employer/pharmacist panels already do not show deleted data.

## Requested Changes (Diff)

### Add
- Backend: `deletedEmployers`, `deletedPharmacists`, `deletedJobs` maps to store snapshots of deleted records
- Backend: `adminGetDeletedEmployers`, `adminGetDeletedPharmacists`, `adminGetDeletedJobs` methods to retrieve deleted snapshots
- Admin Panel: "Removed from Portal" collapsible section at the bottom of each tab (Employers, Pharmacists, Jobs) showing deleted records with a distinct red-tinted style

### Modify
- Backend `adminDeleteEmployer`: before removing, snapshot the EmployerWithStatus data into `deletedEmployers`
- Backend `adminDeletePharmacist`: before removing, snapshot the PharmacistProfile into `deletedPharmacists`
- Backend `adminDeleteJob`: before removing, snapshot the Job into `deletedJobs`
- `backend.d.ts`: add new method signatures and `DeletedEmployer`, `DeletedPharmacist`, `DeletedJob` types
- `AdminPanel.tsx`: fetch and display deleted records per tab

### Remove
- Nothing removed

## Implementation Plan
1. Update `main.mo`: add deleted storage maps, snapshot-on-delete logic, three new admin getter methods
2. Update `backend.d.ts`: add new types and method declarations
3. Update `AdminPanel.tsx`: fetch deleted data, render "Removed from Portal" sections in each tab
