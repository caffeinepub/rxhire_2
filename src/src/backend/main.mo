import Map "mo:core/Map";
import Text "mo:core/Text";
import Nat "mo:core/Nat";
import Time "mo:core/Time";
import Int "mo:core/Int";

actor {
  // ---- Types ----
  public type Role = { #Pharmacist; #Employer };

  public type ApprovalStatus = { #Pending; #Approved; #Rejected };

  public type User = {
    id: Nat;
    name: Text;
    email: Text;
    passwordHash: Text;
    role: Role;
  };

  public type PharmacistProfile = {
    userId: Nat;
    name: Text;
    mobileNumber: Text;
    pciNumber: Text;
    state: Text;
    licenseStatus: Text;
    companyName: Text;
    resumeFileId: Text;
  };

  public type EmployerProfile = {
    userId: Nat;
    companyName: Text;
    mobileNumber: Text;
    location: Text;
    state: Text;
  };

  public type Job = {
    id: Nat;
    employerId: Nat;
    title: Text;
    location: Text;
    description: Text;
    createdAt: Int;
  };

  public type Application = {
    id: Nat;
    pharmacistId: Nat;
    jobId: Nat;
    employerId: Nat;
    appliedAt: Int;
  };

  public type EmployerWithStatus = {
    userId: Nat;
    name: Text;
    email: Text;
    companyName: Text;
    mobileNumber: Text;
    location: Text;
    state: Text;
    approvalStatus: ApprovalStatus;
  };

  // ---- Storage ----
  var users = Map.empty<Nat, User>();
  var emailIndex = Map.empty<Text, Nat>();
  var pharmacistProfiles = Map.empty<Nat, PharmacistProfile>();
  var employerProfiles = Map.empty<Nat, EmployerProfile>();
  var employerApprovalStatus = Map.empty<Nat, ApprovalStatus>();
  var jobs = Map.empty<Nat, Job>();
  var applications = Map.empty<Nat, Application>();
  var sessions = Map.empty<Text, Nat>();
  var adminSessions = Map.empty<Text, Bool>();
  var nextUserId : Nat = 1;
  var nextJobId : Nat = 1;
  var nextAppId : Nat = 1;

  // ---- Helpers ----
  func hashPw(pw: Text): Text { pw # "_rxhire_2026" };

  func makeToken(userId: Nat, ts: Int): Text {
    userId.toText() # "_" # ts.toText()
  };

  func makeAdminToken(ts: Int): Text {
    "admin_" # ts.toText()
  };

  func upsertPharmacist(m: Map.Map<Nat, PharmacistProfile>, k: Nat, v: PharmacistProfile) {
    m.remove(k);
    m.add(k, v);
  };

  func upsertEmployer(m: Map.Map<Nat, EmployerProfile>, k: Nat, v: EmployerProfile) {
    m.remove(k);
    m.add(k, v);
  };

  func getApprovalStatus(userId: Nat): ApprovalStatus {
    switch (employerApprovalStatus.get(userId)) {
      case (?s) { s };
      case null { #Pending };
    }
  };

  // ---- Auth ----
  public func signup(name: Text, email: Text, password: Text, role: Role): async { #ok: { token: Text; userId: Nat; role: Role }; #err: Text } {
    switch (emailIndex.get(email)) {
      case (?_) { #err("Email already registered") };
      case null {
        let id = nextUserId;
        nextUserId += 1;
        let user: User = { id; name; email; passwordHash = hashPw(password); role };
        users.add(id, user);
        emailIndex.add(email, id);
        // Set employer as Pending on signup
        switch (role) {
          case (#Employer) { employerApprovalStatus.add(id, #Pending); };
          case (_) {};
        };
        let token = makeToken(id, Time.now());
        sessions.add(token, id);
        #ok({ token; userId = id; role })
      };
    }
  };

  public func login(email: Text, password: Text): async { #ok: { token: Text; userId: Nat; role: Role; name: Text }; #err: Text } {
    switch (emailIndex.get(email)) {
      case null { #err("User not found") };
      case (?userId) {
        switch (users.get(userId)) {
          case null { #err("User not found") };
          case (?user) {
            if (user.passwordHash != hashPw(password)) {
              #err("Invalid password")
            } else {
              // Check employer approval
              switch (user.role) {
                case (#Employer) {
                  switch (getApprovalStatus(userId)) {
                    case (#Pending) { return #err("Your account is pending admin approval. Please wait.") };
                    case (#Rejected) { return #err("Your account has been rejected by admin. Contact support.") };
                    case (#Approved) {};
                  };
                };
                case (_) {};
              };
              let token = makeToken(userId, Time.now());
              sessions.add(token, userId);
              #ok({ token; userId; role = user.role; name = user.name })
            }
          };
        }
      };
    }
  };

  public func logout(token: Text): async () {
    sessions.remove(token);
  };

  // ---- Admin Auth ----
  public func adminLogin(email: Text, password: Text): async { #ok: { token: Text }; #err: Text } {
    if (email == "admin@rxhire.com" and password == "admin123") {
      let token = makeAdminToken(Time.now());
      adminSessions.add(token, true);
      #ok({ token })
    } else {
      #err("Invalid admin credentials")
    }
  };

  func isAdmin(token: Text): Bool {
    switch (adminSessions.get(token)) {
      case (?_) { true };
      case null { false };
    }
  };

  // ---- Admin Functions ----
  public func getAllEmployers(adminToken: Text): async { #ok: [EmployerWithStatus]; #err: Text } {
    if (not isAdmin(adminToken)) { return #err("Unauthorized") };
    let result = users.values().toArray()
      .filter(func(u: User): Bool {
        switch (u.role) { case (#Employer) { true }; case (_) { false }; }
      })
      .map(func(u: User): EmployerWithStatus {
        let profile = employerProfiles.get(u.id);
        let status = getApprovalStatus(u.id);
        switch (profile) {
          case (?p) {
            { userId = u.id; name = u.name; email = u.email;
              companyName = p.companyName; mobileNumber = p.mobileNumber;
              location = p.location; state = p.state;
              approvalStatus = status; }
          };
          case null {
            { userId = u.id; name = u.name; email = u.email;
              companyName = ""; mobileNumber = ""; location = ""; state = "";
              approvalStatus = status; }
          };
        }
      });
    #ok(result)
  };

  public func approveEmployer(adminToken: Text, employerId: Nat): async { #ok; #err: Text } {
    if (not isAdmin(adminToken)) { return #err("Unauthorized") };
    switch (employerApprovalStatus.get(employerId)) {
      case (?_) { employerApprovalStatus.remove(employerId); };
      case null {};
    };
    employerApprovalStatus.add(employerId, #Approved);
    #ok
  };

  public func rejectEmployer(adminToken: Text, employerId: Nat): async { #ok; #err: Text } {
    if (not isAdmin(adminToken)) { return #err("Unauthorized") };
    switch (employerApprovalStatus.get(employerId)) {
      case (?_) { employerApprovalStatus.remove(employerId); };
      case null {};
    };
    employerApprovalStatus.add(employerId, #Rejected);
    #ok
  };

  // ---- Pharmacist Profile ----
  public func savePharmacistProfile(
    token: Text,
    name: Text,
    mobileNumber: Text,
    pciNumber: Text,
    state: Text,
    licenseStatus: Text,
    companyName: Text,
    resumeFileId: Text
  ): async { #ok; #err: Text } {
    switch (sessions.get(token)) {
      case null { #err("Not authenticated") };
      case (?userId) {
        let profile: PharmacistProfile = {
          userId; name; mobileNumber; pciNumber; state;
          licenseStatus; companyName; resumeFileId;
        };
        upsertPharmacist(pharmacistProfiles, userId, profile);
        #ok
      };
    }
  };

  public func getPharmacistProfile(token: Text): async { #ok: PharmacistProfile; #err: Text } {
    switch (sessions.get(token)) {
      case null { #err("Not authenticated") };
      case (?userId) {
        switch (pharmacistProfiles.get(userId)) {
          case null { #err("Profile not found") };
          case (?p) { #ok(p) };
        }
      };
    }
  };

  // ---- Employer Profile ----
  public func saveEmployerProfile(
    token: Text,
    companyName: Text,
    mobileNumber: Text,
    location: Text,
    state: Text
  ): async { #ok; #err: Text } {
    switch (sessions.get(token)) {
      case null { #err("Not authenticated") };
      case (?userId) {
        let profile: EmployerProfile = {
          userId; companyName; mobileNumber; location; state;
        };
        upsertEmployer(employerProfiles, userId, profile);
        #ok
      };
    }
  };

  public func getEmployerProfile(token: Text): async { #ok: EmployerProfile; #err: Text } {
    switch (sessions.get(token)) {
      case null { #err("Not authenticated") };
      case (?userId) {
        switch (employerProfiles.get(userId)) {
          case null { #err("Profile not found") };
          case (?p) { #ok(p) };
        }
      };
    }
  };

  // ---- Jobs ----
  public func postJob(token: Text, title: Text, location: Text, description: Text): async { #ok: Nat; #err: Text } {
    switch (sessions.get(token)) {
      case null { #err("Not authenticated") };
      case (?userId) {
        switch (employerProfiles.get(userId)) {
          case null { #err("Complete your company profile before posting jobs") };
          case (?profile) {
            if (profile.companyName == "" or profile.state == "") {
              #err("Complete your company profile before posting jobs")
            } else {
              let id = nextJobId;
              nextJobId += 1;
              let job: Job = { id; employerId = userId; title; location; description; createdAt = Time.now() };
              jobs.add(id, job);
              #ok(id)
            }
          };
        }
      };
    }
  };

  public query func getAllJobs(): async [Job] {
    jobs.values().toArray()
  };

  public func getEmployerJobs(token: Text): async { #ok: [Job]; #err: Text } {
    switch (sessions.get(token)) {
      case null { #err("Not authenticated") };
      case (?userId) {
        #ok(jobs.values().toArray().filter(func(j: Job): Bool { j.employerId == userId }))
      };
    }
  };

  public func deleteJob(token: Text, jobId: Nat): async { #ok; #err: Text } {
    switch (sessions.get(token)) {
      case null { #err("Not authenticated") };
      case (?userId) {
        switch (jobs.get(jobId)) {
          case null { #err("Job not found") };
          case (?job) {
            if (job.employerId != userId) { #err("Not authorized") }
            else { jobs.remove(jobId); #ok }
          };
        }
      };
    }
  };

  // ---- Applications ----
  public func applyToJob(token: Text, jobId: Nat): async { #ok: Nat; #err: Text } {
    switch (sessions.get(token)) {
      case null { #err("Not authenticated") };
      case (?userId) {
        switch (jobs.get(jobId)) {
          case null { #err("Job not found") };
          case (?job) {
            let existing = applications.values().toArray().find(func(a: Application): Bool {
              a.pharmacistId == userId and a.jobId == jobId
            });
            switch (existing) {
              case (?_) { #err("Already applied") };
              case null {
                let id = nextAppId;
                nextAppId += 1;
                let app: Application = {
                  id; pharmacistId = userId;
                  jobId; employerId = job.employerId;
                  appliedAt = Time.now();
                };
                applications.add(id, app);
                #ok(id)
              };
            }
          };
        }
      };
    }
  };

  public func getMyApplications(token: Text): async { #ok: [Application]; #err: Text } {
    switch (sessions.get(token)) {
      case null { #err("Not authenticated") };
      case (?userId) {
        #ok(applications.values().toArray().filter(func(a: Application): Bool { a.pharmacistId == userId }))
      };
    }
  };

  public func getEmployerApplications(token: Text): async { #ok: [Application]; #err: Text } {
    switch (sessions.get(token)) {
      case null { #err("Not authenticated") };
      case (?userId) {
        #ok(applications.values().toArray().filter(func(a: Application): Bool { a.employerId == userId }))
      };
    }
  };

  public query func getPharmacistById(userId: Nat): async { #ok: PharmacistProfile; #err: Text } {
    switch (pharmacistProfiles.get(userId)) {
      case null { #err("Not found") };
      case (?p) { #ok(p) };
    }
  };

  public query func getJobById(jobId: Nat): async { #ok: Job; #err: Text } {
    switch (jobs.get(jobId)) {
      case null { #err("Not found") };
      case (?j) { #ok(j) };
    }
  };

  public query func getUserById(userId: Nat): async { #ok: { id: Nat; name: Text; role: Role }; #err: Text } {
    switch (users.get(userId)) {
      case null { #err("Not found") };
      case (?u) { #ok({ id = u.id; name = u.name; role = u.role }) };
    }
  };

  public query func getEmployerProfileById(userId: Nat): async { #ok: EmployerProfile; #err: Text } {
    switch (employerProfiles.get(userId)) {
      case null { #err("Not found") };
      case (?p) { #ok(p) };
    }
  };

  public query func getAllPharmacists(): async [PharmacistProfile] {
    pharmacistProfiles.values().toArray()
  };

  // Blob storage certificate for file uploads
  public shared func _caffeineStorageCreateCertificate(blobHash : Text) : async { method : Text; blob_hash : Text } {
    { method = "upload"; blob_hash = blobHash }
  };
}
