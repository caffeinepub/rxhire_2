import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Toaster } from "@/components/ui/sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Briefcase,
  Building2,
  CheckCircle,
  Clock,
  Loader2,
  LogOut,
  ShieldCheck,
  Users,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import type { EmployerWithStatus, Job, PharmacistProfile } from "./backend.d";
import { useActor } from "./hooks/useActor";

const ADMIN_SESSION_KEY = "rxhire_admin_token";

type EmployerFilter = "All" | "Pending" | "Approved" | "Rejected";

export default function AdminPanel() {
  const { actor } = useActor();
  const [adminToken, setAdminToken] = useState<string | null>(() =>
    localStorage.getItem(ADMIN_SESSION_KEY),
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [employers, setEmployers] = useState<EmployerWithStatus[]>([]);
  const [pharmacists, setPharmacists] = useState<PharmacistProfile[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [fetching, setFetching] = useState(false);
  const [employerFilter, setEmployerFilter] = useState<EmployerFilter>("All");

  const fetchEmployers = useCallback(
    async (token: string) => {
      if (!actor) return;
      try {
        const res = await (actor as any).getAllEmployers(token);
        if ("ok" in res) {
          setEmployers(res.ok);
        } else {
          toast.error(res.err);
        }
      } catch {
        toast.error("Failed to load employers");
      }
    },
    [actor],
  );

  const fetchAllData = useCallback(
    async (token: string) => {
      if (!actor) return;
      setFetching(true);
      try {
        const [empRes, pharmaRes, jobsRes] = await Promise.all([
          (actor as any).getAllEmployers(token),
          (actor as any).getAllPharmacists(),
          (actor as any).getAllJobs(),
        ]);
        if ("ok" in empRes) setEmployers(empRes.ok);
        setPharmacists(pharmaRes as PharmacistProfile[]);
        setJobs(jobsRes as Job[]);
      } catch {
        toast.error("Failed to load data");
      } finally {
        setFetching(false);
      }
    },
    [actor],
  );

  useEffect(() => {
    if (adminToken && actor) {
      fetchAllData(adminToken);
    }
  }, [adminToken, actor, fetchAllData]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actor) return;
    setLoading(true);
    try {
      const res = await (actor as any).adminLogin(email, password);
      if ("ok" in res) {
        localStorage.setItem(ADMIN_SESSION_KEY, res.ok.token);
        setAdminToken(res.ok.token);
        toast.success("Logged in as Admin");
      } else {
        toast.error(res.err);
      }
    } catch {
      toast.error("Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem(ADMIN_SESSION_KEY);
    setAdminToken(null);
    setEmployers([]);
    setPharmacists([]);
    setJobs([]);
  };

  const handleApprove = async (employerId: bigint) => {
    if (!actor || !adminToken) return;
    try {
      const res = await (actor as any).approveEmployer(adminToken, employerId);
      if ("ok" in res) {
        toast.success("Employer approved");
        fetchEmployers(adminToken);
      } else {
        toast.error(res.err);
      }
    } catch {
      toast.error("Failed to approve");
    }
  };

  const handleReject = async (employerId: bigint) => {
    if (!actor || !adminToken) return;
    try {
      const res = await (actor as any).rejectEmployer(adminToken, employerId);
      if ("ok" in res) {
        toast.success("Employer rejected");
        fetchEmployers(adminToken);
      } else {
        toast.error(res.err);
      }
    } catch {
      toast.error("Failed to reject");
    }
  };

  const getStatusBadge = (status: EmployerWithStatus["approvalStatus"]) => {
    if ("Approved" in status)
      return (
        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
          Approved
        </Badge>
      );
    if ("Rejected" in status)
      return (
        <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
          Rejected
        </Badge>
      );
    return (
      <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
        Pending
      </Badge>
    );
  };

  const pendingCount = employers.filter(
    (e) => "Pending" in e.approvalStatus,
  ).length;

  const filteredEmployers = employers.filter((e) => {
    if (employerFilter === "All") return true;
    if (employerFilter === "Pending") return "Pending" in e.approvalStatus;
    if (employerFilter === "Approved") return "Approved" in e.approvalStatus;
    if (employerFilter === "Rejected") return "Rejected" in e.approvalStatus;
    return true;
  });

  // --- Login Page ---
  if (!adminToken) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-sm shadow-lg">
          <CardHeader className="text-center pb-2">
            <div className="flex justify-center mb-3">
              <div className="p-3 rounded-full bg-primary/10">
                <ShieldCheck className="text-primary" size={32} />
              </div>
            </div>
            <CardTitle className="text-2xl">RxHire Admin</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Sign in to manage the platform
            </p>
          </CardHeader>
          <CardContent className="pt-4">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="admin-email">Email</Label>
                <Input
                  id="admin-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@rxhire.com"
                  required
                  data-ocid="admin.input"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="admin-password">Password</Label>
                <Input
                  id="admin-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  data-ocid="admin.input"
                />
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={loading || !actor}
                data-ocid="admin.submit_button"
              >
                {loading ? (
                  <Loader2 className="animate-spin mr-2" size={16} />
                ) : null}
                Sign In
              </Button>
            </form>
          </CardContent>
        </Card>
        <Toaster richColors />
      </div>
    );
  }

  // --- Dashboard ---
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b shadow-sm px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-primary/10">
            <ShieldCheck className="text-primary" size={20} />
          </div>
          <span className="font-bold text-lg tracking-tight">RxHire Admin</span>
        </div>
        <div className="flex items-center gap-3">
          <Badge
            variant="secondary"
            className="bg-primary/10 text-primary font-medium"
          >
            Admin
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            data-ocid="admin.secondary_button"
          >
            <LogOut size={14} className="mr-1" />
            Logout
          </Button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-5 pb-5">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-50">
                  <Building2 className="text-blue-600" size={20} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">
                    Total Employers
                  </p>
                  <p className="text-2xl font-bold">
                    {fetching ? (
                      <Loader2 className="animate-spin inline" size={18} />
                    ) : (
                      employers.length
                    )}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-5 pb-5">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-yellow-50">
                  <Clock className="text-yellow-600" size={20} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">
                    Pending Approvals
                  </p>
                  <p className="text-2xl font-bold">
                    {fetching ? (
                      <Loader2 className="animate-spin inline" size={18} />
                    ) : (
                      pendingCount
                    )}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-5 pb-5">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-50">
                  <Users className="text-green-600" size={20} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">
                    Total Pharmacists
                  </p>
                  <p className="text-2xl font-bold">
                    {fetching ? (
                      <Loader2 className="animate-spin inline" size={18} />
                    ) : (
                      pharmacists.length
                    )}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-5 pb-5">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-50">
                  <Briefcase className="text-purple-600" size={20} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total Jobs</p>
                  <p className="text-2xl font-bold">
                    {fetching ? (
                      <Loader2 className="animate-spin inline" size={18} />
                    ) : (
                      jobs.length
                    )}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="employers" data-ocid="admin.tab">
          <div className="flex items-center justify-between mb-4">
            <TabsList>
              <TabsTrigger value="employers" data-ocid="admin.tab">
                Employers
                {pendingCount > 0 && (
                  <span className="ml-1.5 bg-yellow-500 text-white text-xs rounded-full px-1.5 py-0.5 leading-none">
                    {pendingCount}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="pharmacists" data-ocid="admin.tab">
                Pharmacists
              </TabsTrigger>
              <TabsTrigger value="jobs" data-ocid="admin.tab">
                Jobs
              </TabsTrigger>
            </TabsList>
            <Button
              variant="outline"
              size="sm"
              onClick={() => adminToken && fetchAllData(adminToken)}
              disabled={fetching}
              data-ocid="admin.secondary_button"
            >
              {fetching ? (
                <Loader2 className="animate-spin" size={14} />
              ) : (
                "Refresh"
              )}
            </Button>
          </div>

          {/* Employers Tab */}
          <TabsContent value="employers">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2 flex-wrap">
                  {(
                    [
                      "All",
                      "Pending",
                      "Approved",
                      "Rejected",
                    ] as EmployerFilter[]
                  ).map((f) => (
                    <Button
                      key={f}
                      size="sm"
                      variant={employerFilter === f ? "default" : "outline"}
                      onClick={() => setEmployerFilter(f)}
                      data-ocid="admin.toggle"
                    >
                      {f}
                      {f === "Pending" && pendingCount > 0 && (
                        <span className="ml-1 opacity-75">
                          ({pendingCount})
                        </span>
                      )}
                    </Button>
                  ))}
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {fetching && employers.length === 0 ? (
                  <div className="flex justify-center py-16">
                    <Loader2 className="animate-spin text-primary" size={28} />
                  </div>
                ) : filteredEmployers.length === 0 ? (
                  <div
                    className="text-center py-16 text-muted-foreground"
                    data-ocid="employers.empty_state"
                  >
                    No employers found.
                  </div>
                ) : (
                  <Table data-ocid="employers.table">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Company</TableHead>
                        <TableHead>State</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredEmployers.map((emp, idx) => (
                        <TableRow
                          key={emp.userId.toString()}
                          data-ocid={`employers.row.${idx + 1}`}
                        >
                          <TableCell className="font-medium">
                            {emp.name}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {emp.email}
                          </TableCell>
                          <TableCell>{emp.companyName || "—"}</TableCell>
                          <TableCell>{emp.state || "—"}</TableCell>
                          <TableCell>
                            {getStatusBadge(emp.approvalStatus)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              {!("Approved" in emp.approvalStatus) && (
                                <Button
                                  size="sm"
                                  className="bg-green-600 hover:bg-green-700 text-white"
                                  onClick={() => handleApprove(emp.userId)}
                                  data-ocid={`employers.confirm_button.${idx + 1}`}
                                >
                                  <CheckCircle size={13} className="mr-1" />
                                  Approve
                                </Button>
                              )}
                              {!("Rejected" in emp.approvalStatus) && (
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleReject(emp.userId)}
                                  data-ocid={`employers.delete_button.${idx + 1}`}
                                >
                                  Reject
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Pharmacists Tab */}
          <TabsContent value="pharmacists">
            <Card>
              <CardContent className="p-0">
                {fetching && pharmacists.length === 0 ? (
                  <div className="flex justify-center py-16">
                    <Loader2 className="animate-spin text-primary" size={28} />
                  </div>
                ) : pharmacists.length === 0 ? (
                  <div
                    className="text-center py-16 text-muted-foreground"
                    data-ocid="pharmacists.empty_state"
                  >
                    No pharmacist profiles found.
                  </div>
                ) : (
                  <Table data-ocid="pharmacists.table">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Mobile</TableHead>
                        <TableHead>State</TableHead>
                        <TableHead>PCI Number</TableHead>
                        <TableHead>License Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pharmacists.map((p, idx) => (
                        <TableRow
                          key={p.userId.toString()}
                          data-ocid={`pharmacists.row.${idx + 1}`}
                        >
                          <TableCell className="font-medium">
                            {p.name}
                          </TableCell>
                          <TableCell>{p.mobileNumber || "—"}</TableCell>
                          <TableCell>{p.state || "—"}</TableCell>
                          <TableCell>{p.pciNumber || "—"}</TableCell>
                          <TableCell>
                            {p.licenseStatus ? (
                              <Badge
                                className={
                                  p.licenseStatus.toLowerCase() === "active"
                                    ? "bg-green-100 text-green-800 hover:bg-green-100"
                                    : "bg-gray-100 text-gray-700 hover:bg-gray-100"
                                }
                              >
                                {p.licenseStatus}
                              </Badge>
                            ) : (
                              "—"
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Jobs Tab */}
          <TabsContent value="jobs">
            <Card>
              <CardContent className="p-0">
                {fetching && jobs.length === 0 ? (
                  <div className="flex justify-center py-16">
                    <Loader2 className="animate-spin text-primary" size={28} />
                  </div>
                ) : jobs.length === 0 ? (
                  <div
                    className="text-center py-16 text-muted-foreground"
                    data-ocid="jobs.empty_state"
                  >
                    No jobs posted yet.
                  </div>
                ) : (
                  <Table data-ocid="jobs.table">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Description</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {jobs.map((job, idx) => (
                        <TableRow
                          key={job.id.toString()}
                          data-ocid={`jobs.row.${idx + 1}`}
                        >
                          <TableCell className="font-medium">
                            {job.title}
                          </TableCell>
                          <TableCell>{job.location || "—"}</TableCell>
                          <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                            {job.description
                              ? job.description.length > 80
                                ? `${job.description.slice(0, 80)}…`
                                : job.description
                              : "—"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
      <Toaster richColors />
    </div>
  );
}
