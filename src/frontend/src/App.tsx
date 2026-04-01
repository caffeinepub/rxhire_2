import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Toaster } from "@/components/ui/sonner";
import { Textarea } from "@/components/ui/textarea";
import { HttpAgent } from "@icp-sdk/core/agent";
import {
  Briefcase,
  Building2,
  ChevronRight,
  ClipboardList,
  FileText,
  LayoutDashboard,
  Loader2,
  LogOut,
  Pill,
  PlusCircle,
  Trash2,
  Upload,
  User,
  Users,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import AdminPanel from "./AdminPanel";
import type {
  Application,
  EmployerProfile,
  Job,
  PharmacistProfile,
} from "./backend.d";
import { loadConfig } from "./config";
import { useActor } from "./hooks/useActor";
import { StorageClient } from "./utils/StorageClient";

const SESSION_KEY = "rxhire_session";

interface Session {
  token: string;
  userId: string;
  role: "Pharmacist" | "Employer";
  name: string;
}

function getSession(): Session | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Session;
  } catch {
    return null;
  }
}

function setSession(s: Session) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(s));
}

function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

function isCanisterStopped(err: any): boolean {
  const msg = err?.message || String(err);
  return (
    msg.includes("IC0508") ||
    msg.includes("canister is stopped") ||
    msg.includes("Reject code: 5")
  );
}

async function withRetry<T>(
  fn: () => Promise<T>,
  retries = 3,
  delayMs = 3000,
): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err: any) {
      if (isCanisterStopped(err) && i < retries - 1) {
        await new Promise((r) => setTimeout(r, delayMs));
        continue;
      }
      throw err;
    }
  }
  throw new Error("Max retries exceeded");
}

const INDIAN_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Andaman and Nicobar Islands",
  "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Jammu and Kashmir",
  "Ladakh",
  "Lakshadweep",
  "Puducherry",
];

// ─── Logo ─────────────────────────────────────────────────────────────────────
function Logo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const iconSize = size === "sm" ? 28 : size === "lg" ? 44 : 36;
  const textClass =
    size === "sm" ? "text-lg" : size === "lg" ? "text-3xl" : "text-2xl";
  return (
    <div className="flex items-center gap-2">
      <div
        className="rounded-full bg-primary flex items-center justify-center"
        style={{ width: iconSize, height: iconSize }}
      >
        <Pill size={iconSize * 0.55} className="text-primary-foreground" />
      </div>
      <span className={`font-bold text-primary ${textClass}`}>RxHire</span>
    </div>
  );
}

// ─── Auth Pages ───────────────────────────────────────────────────────────────
function AuthCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Logo size="lg" />
          <p className="text-muted-foreground mt-2 text-sm">
            Connecting pharmacists with opportunities
          </p>
        </div>
        <div className="bg-card rounded-xl shadow-card border border-border p-8">
          {children}
        </div>
        <p className="text-center text-xs text-muted-foreground mt-6">
          © {new Date().getFullYear()}. Built with love using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-foreground transition-colors"
          >
            caffeine.ai
          </a>
        </p>
      </div>
    </div>
  );
}

function LoginPage({
  onLogin,
  onGoSignup,
  actor,
}: {
  onLogin: (s: Session) => void;
  onGoSignup: () => void;
  actor: any;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actor) return;
    setLoading(true);
    setError("");
    try {
      const result = (await withRetry(() => actor!.login(email, password))) as
        | { ok: { token: string; userId: bigint; role: any; name: string } }
        | { err: string };
      if ("err" in result) {
        setError(result.err);
      } else {
        const { token, userId, role, name } = result.ok;
        const roleStr = "Pharmacist" in role ? "Pharmacist" : "Employer";
        const session: Session = {
          token,
          userId: userId.toString(),
          role: roleStr,
          name,
        };
        setSession(session);
        onLogin(session);
      }
    } catch (err: any) {
      if (isCanisterStopped(err)) {
        setError("Server is starting up. Please try again in a moment.");
      } else {
        setError(err?.message || "Login failed");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard>
      <h2 className="text-xl font-semibold text-foreground mb-1">
        Welcome back
      </h2>
      <p className="text-sm text-muted-foreground mb-6">
        Sign in to your RxHire account
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="login_email" className="text-sm font-medium">
            Email
          </Label>
          <Input
            id="login_email"
            data-ocid="login.input"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="login_password" className="text-sm font-medium">
            Password
          </Label>
          <Input
            id="login_password"
            data-ocid="login.input"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="mt-1"
          />
        </div>
        {error && (
          <p
            data-ocid="login.error_state"
            className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2"
          >
            {error}
          </p>
        )}
        <Button
          data-ocid="login.submit_button"
          type="submit"
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
          disabled={loading || !actor}
        >
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {loading ? "Signing in..." : "Sign In"}
        </Button>
      </form>
      <p className="text-center text-sm text-muted-foreground mt-4">
        Don't have an account?{" "}
        <button
          data-ocid="login.link"
          type="button"
          onClick={onGoSignup}
          className="text-primary font-medium hover:underline"
        >
          Sign up
        </button>
      </p>
    </AuthCard>
  );
}

function SignupPage({
  onSignup,
  onGoLogin,
  actor,
}: {
  onSignup: (s: Session) => void;
  onGoLogin: () => void;
  actor: any;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"Pharmacist" | "Employer">("Pharmacist");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actor) return;
    setLoading(true);
    setError("");
    try {
      const backendRole =
        role === "Pharmacist" ? { Pharmacist: null } : { Employer: null };
      const result = (await withRetry(() =>
        actor!.signup(name, email, password, backendRole),
      )) as
        | { ok: { token: string; userId: bigint; role: any } }
        | { err: string };
      if ("err" in result) {
        setError(result.err);
      } else {
        const { token, userId } = result.ok;
        const session: Session = {
          token,
          userId: userId.toString(),
          role,
          name,
        };
        setSession(session);
        onSignup(session);
      }
    } catch (err: any) {
      if (isCanisterStopped(err)) {
        setError("Server is starting up. Please wait a moment and try again.");
      } else {
        setError(err?.message || "Signup failed");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard>
      <h2 className="text-xl font-semibold text-foreground mb-1">
        Create account
      </h2>
      <p className="text-sm text-muted-foreground mb-6">Join RxHire today</p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="signup_name" className="text-sm font-medium">
            Full Name
          </Label>
          <Input
            id="signup_name"
            data-ocid="signup.input"
            placeholder="John Doe"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="signup_email" className="text-sm font-medium">
            Email
          </Label>
          <Input
            id="signup_email"
            data-ocid="signup.input"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="signup_password" className="text-sm font-medium">
            Password
          </Label>
          <Input
            id="signup_password"
            data-ocid="signup.input"
            type="password"
            placeholder="Min. 8 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            className="mt-1"
          />
        </div>
        <div>
          <Label className="text-sm font-medium">I am a...</Label>
          <div className="flex gap-3 mt-2">
            <button
              type="button"
              data-ocid="signup.radio"
              onClick={() => setRole("Pharmacist")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                role === "Pharmacist"
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:border-primary/50"
              }`}
            >
              <Pill size={16} />
              Pharmacist
            </button>
            <button
              type="button"
              data-ocid="signup.radio"
              onClick={() => setRole("Employer")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                role === "Employer"
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:border-primary/50"
              }`}
            >
              <Building2 size={16} />
              Employer
            </button>
          </div>
        </div>
        {error && (
          <p
            data-ocid="signup.error_state"
            className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2"
          >
            {error}
          </p>
        )}
        <Button
          data-ocid="signup.submit_button"
          type="submit"
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
          disabled={loading || !actor}
        >
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {loading ? "Creating account..." : "Create Account"}
        </Button>
      </form>
      <p className="text-center text-sm text-muted-foreground mt-4">
        Already have an account?{" "}
        <button
          data-ocid="signup.link"
          type="button"
          onClick={onGoLogin}
          className="text-primary font-medium hover:underline"
        >
          Sign in
        </button>
      </p>
    </AuthCard>
  );
}

// ─── Dashboard Shell ──────────────────────────────────────────────────────────
type PharmacistTab = "dashboard" | "profile" | "browse" | "applications";
type EmployerTab =
  | "dashboard"
  | "company"
  | "post"
  | "jobs"
  | "applicants"
  | "talent";

function SidebarItem({
  icon,
  label,
  active,
  onClick,
  ocid,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
  ocid: string;
}) {
  return (
    <button
      type="button"
      data-ocid={ocid}
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
        active
          ? "bg-sidebar-accent text-sidebar-accent-foreground"
          : "text-sidebar-foreground hover:bg-sidebar-accent/50"
      }`}
    >
      <span className={active ? "text-primary" : "opacity-70"}>{icon}</span>
      {label}
    </button>
  );
}

function DashboardShell({
  session,
  onLogout,
  sidebar,
  children,
}: {
  session: Session;
  onLogout: () => void;
  sidebar: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Left Sidebar */}
      <aside
        className="w-60 flex-shrink-0 flex flex-col"
        style={{
          background:
            "linear-gradient(180deg, oklch(0.22 0.035 210) 0%, oklch(0.272 0.04 210) 100%)",
        }}
      >
        <div className="px-5 py-5 border-b border-sidebar-border">
          <Logo size="sm" />
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {sidebar}
        </nav>
        <div className="px-3 py-4 border-t border-sidebar-border">
          <div className="px-4 py-2 mb-2">
            <p className="text-xs text-sidebar-foreground/60 uppercase tracking-wider font-medium">
              Signed in as
            </p>
            <p className="text-sm text-sidebar-foreground font-medium truncate mt-0.5">
              {session.name}
            </p>
            <Badge
              className="mt-1 text-xs"
              style={{
                background: "oklch(0.578 0.082 200 / 0.25)",
                color: "oklch(0.835 0.012 235)",
              }}
            >
              {session.role}
            </Badge>
          </div>
          <button
            type="button"
            data-ocid="nav.logout_button"
            onClick={onLogout}
            className="w-full flex items-center gap-2 px-4 py-2 rounded-lg text-sm text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-all"
          >
            <LogOut size={15} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="h-14 bg-card border-b border-border flex items-center px-6 gap-4 flex-shrink-0">
          <div className="flex-1">
            <span className="text-sm text-muted-foreground">
              Welcome back,{" "}
            </span>
            <span className="text-sm font-semibold text-foreground">
              {session.name}
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            data-ocid="nav.logout_button"
            onClick={onLogout}
            className="text-muted-foreground hover:text-foreground text-xs"
          >
            <LogOut size={14} className="mr-1.5" />
            Logout
          </Button>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}

function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-6">
      <h1 className="text-xl font-semibold text-foreground">{title}</h1>
      {subtitle && (
        <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>
      )}
    </div>
  );
}

function Card({
  children,
  className = "",
}: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`bg-card rounded-xl border border-border shadow-card p-6 ${className}`}
    >
      {children}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div className="bg-card rounded-xl border border-border shadow-card p-5 flex items-center gap-4">
      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-foreground">{value}</p>
        <p className="text-xs text-muted-foreground font-medium">{label}</p>
      </div>
    </div>
  );
}

// ─── Pharmacist Dashboard ─────────────────────────────────────────────────────
function PharmacistDashboard({
  session,
  actor,
  onLogout,
}: {
  session: Session;
  actor: any;
  onLogout: () => void;
}) {
  const [tab, setTab] = useState<PharmacistTab>("dashboard");
  const [appCount, setAppCount] = useState(0);

  useEffect(() => {
    if (!actor) return;
    actor.getMyApplications(session.token).then((res: any) => {
      if ("ok" in res) setAppCount(res.ok.length);
    });
  }, [actor, session.token]);

  const sidebarItems: {
    id: PharmacistTab;
    label: string;
    icon: React.ReactNode;
  }[] = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: <LayoutDashboard size={16} />,
    },
    { id: "profile", label: "My Profile", icon: <User size={16} /> },
    { id: "browse", label: "Browse Jobs", icon: <Briefcase size={16} /> },
    {
      id: "applications",
      label: "My Applications",
      icon: <ClipboardList size={16} />,
    },
  ];

  return (
    <DashboardShell
      session={session}
      onLogout={onLogout}
      sidebar={sidebarItems.map((item) => (
        <SidebarItem
          key={item.id}
          icon={item.icon}
          label={item.label}
          active={tab === item.id}
          onClick={() => setTab(item.id)}
          ocid={`nav.${item.id}.tab`}
        />
      ))}
    >
      {tab === "dashboard" && (
        <PharmacistHome
          session={session}
          appCount={appCount}
          onNavigate={setTab}
        />
      )}
      {tab === "profile" && (
        <PharmacistProfileTab session={session} actor={actor} />
      )}
      {tab === "browse" && <BrowseJobsTab session={session} actor={actor} />}
      {tab === "applications" && (
        <MyApplicationsTab session={session} actor={actor} />
      )}
    </DashboardShell>
  );
}

function PharmacistHome({
  session,
  appCount,
  onNavigate,
}: {
  session: Session;
  appCount: number;
  onNavigate: (t: PharmacistTab) => void;
}) {
  return (
    <div>
      <PageHeader
        title={`Hello, ${session.name} 👋`}
        subtitle="Manage your profile and find pharmacy jobs"
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <StatCard
          icon={<ClipboardList size={18} />}
          label="Applications Sent"
          value={appCount}
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <h3 className="font-semibold text-foreground mb-1">
            Complete Your Profile
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Add your PCI number, license status, and resume to stand out.
          </p>
          <Button
            data-ocid="dashboard.profile.button"
            size="sm"
            className="bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={() => onNavigate("profile")}
          >
            Edit Profile <ChevronRight size={14} className="ml-1" />
          </Button>
        </Card>
        <Card>
          <h3 className="font-semibold text-foreground mb-1">
            Browse Open Positions
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Explore jobs posted by employers looking for pharmacists.
          </p>
          <Button
            data-ocid="dashboard.browse.button"
            size="sm"
            variant="outline"
            onClick={() => onNavigate("browse")}
          >
            Browse Jobs <ChevronRight size={14} className="ml-1" />
          </Button>
        </Card>
      </div>
    </div>
  );
}

function PharmacistProfileTab({
  session,
  actor,
}: {
  session: Session;
  actor: any;
}) {
  const [profile, setProfile] = useState<Partial<PharmacistProfile>>({
    name: session.name,
    mobileNumber: "",
    pciNumber: "",
    state: "",
    licenseStatus: "Free",
    companyName: "",
    resumeFileId: "",
  });
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!actor) return;
    actor.getPharmacistProfile(session.token).then((res: any) => {
      if ("ok" in res) {
        setProfile(res.ok);
      }
      setFetching(false);
    });
  }, [actor, session.token]);

  const handleResumeUpload = async (): Promise<string> => {
    if (!resumeFile) return profile.resumeFileId || "";
    setUploading(true);
    try {
      const config = await loadConfig();
      const agent = new HttpAgent({ host: config.backend_host });
      if (config.backend_host?.includes("localhost")) {
        await agent.fetchRootKey().catch(() => {});
      }
      const storageClient = new StorageClient(
        config.bucket_name,
        config.storage_gateway_url,
        config.backend_canister_id,
        config.project_id,
        agent,
      );
      const bytes = new Uint8Array(await resumeFile.arrayBuffer());
      const { hash } = await storageClient.putFile(bytes);
      toast.success("Resume uploaded successfully");
      return hash;
    } catch (err: any) {
      toast.error(
        `Failed to upload resume: ${err?.message || "Unknown error"}`,
      );
      return profile.resumeFileId || "";
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actor) return;
    setLoading(true);
    try {
      const fileId = await handleResumeUpload();
      const result = await actor.savePharmacistProfile(
        session.token,
        profile.name || "",
        profile.mobileNumber || "",
        profile.pciNumber || "",
        profile.state || "",
        profile.licenseStatus || "Free",
        profile.companyName || "",
        fileId,
      );
      if ("err" in result) {
        toast.error(result.err);
      } else {
        setProfile((p) => ({ ...p, resumeFileId: fileId }));
        setResumeFile(null);
        toast.success("Profile saved successfully");
      }
    } catch (err: any) {
      toast.error(err?.message || "Save failed");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div
        data-ocid="profile.loading_state"
        className="flex items-center justify-center h-48"
      >
        <Loader2 className="animate-spin text-primary" size={24} />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="My Profile"
        subtitle="Manage your pharmacist profile"
      />
      <Card className="max-w-2xl">
        <form onSubmit={handleSave} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">Full Name</Label>
              <Input
                data-ocid="profile.input"
                className="mt-1"
                value={profile.name || ""}
                onChange={(e) =>
                  setProfile((p) => ({ ...p, name: e.target.value }))
                }
                required
              />
            </div>
            <div>
              <Label className="text-sm font-medium">Mobile Number</Label>
              <Input
                data-ocid="profile.input"
                className="mt-1"
                placeholder="+1 (555) 000-0000"
                value={profile.mobileNumber || ""}
                onChange={(e) =>
                  setProfile((p) => ({ ...p, mobileNumber: e.target.value }))
                }
              />
            </div>
            <div>
              <Label className="text-sm font-medium">PCI Number</Label>
              <Input
                data-ocid="profile.input"
                className="mt-1"
                placeholder="PCI-XXXXXX"
                value={profile.pciNumber || ""}
                onChange={(e) =>
                  setProfile((p) => ({ ...p, pciNumber: e.target.value }))
                }
              />
            </div>
            <div>
              <Label className="text-sm font-medium">State</Label>
              <Select
                value={profile.state || ""}
                onValueChange={(v) => setProfile((p) => ({ ...p, state: v }))}
              >
                <SelectTrigger data-ocid="profile.select" className="mt-1">
                  <SelectValue placeholder="Select state" />
                </SelectTrigger>
                <SelectContent>
                  {INDIAN_STATES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm font-medium">Country</Label>
              <Input
                className="mt-1 bg-muted text-muted-foreground"
                value="India"
                disabled
                readOnly
              />
            </div>
          </div>

          <Separator />

          <div>
            <Label className="text-sm font-medium">License Status</Label>
            <div className="flex gap-3 mt-2">
              {["Free", "Endorsed"].map((status) => (
                <button
                  key={status}
                  type="button"
                  data-ocid="profile.radio"
                  onClick={() =>
                    setProfile((p) => ({ ...p, licenseStatus: status }))
                  }
                  className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
                    profile.licenseStatus === status
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:border-primary/50"
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          {profile.licenseStatus === "Endorsed" && (
            <div>
              <Label className="text-sm font-medium">Company Name</Label>
              <Input
                data-ocid="profile.input"
                className="mt-1"
                placeholder="Current employer"
                value={profile.companyName || ""}
                onChange={(e) =>
                  setProfile((p) => ({ ...p, companyName: e.target.value }))
                }
              />
            </div>
          )}

          <Separator />

          <div>
            <Label className="text-sm font-medium">Resume (PDF)</Label>
            <div className="mt-2 flex items-center gap-3">
              <label
                data-ocid="profile.upload_button"
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm font-medium text-muted-foreground hover:border-primary/50 hover:text-primary cursor-pointer transition-all"
              >
                <Upload size={15} />
                {resumeFile ? resumeFile.name : "Choose PDF"}
                <input
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
                />
              </label>
              {profile.resumeFileId && !resumeFile && (
                <span className="text-xs text-primary flex items-center gap-1">
                  <FileText size={13} /> Resume uploaded
                </span>
              )}
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              data-ocid="profile.save_button"
              type="submit"
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              disabled={loading || uploading}
            >
              {(loading || uploading) && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {loading || uploading ? "Saving..." : "Save Profile"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

function BrowseJobsTab({
  session,
  actor,
}: {
  session: Session;
  actor: any;
}) {
  const [jobs, setJobs] = useState<(Job & { companyName?: string })[]>([]);
  const [appliedJobIds, setAppliedJobIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState<string | null>(null);
  const [expandedJobs, setExpandedJobs] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!actor) return;
    Promise.all([actor.getAllJobs(), actor.getMyApplications(session.token)])
      .then(async ([jobsRes, appsRes]: [Job[], any]) => {
        try {
          // Enrich each job with the employer's company name
          const enriched = await Promise.all(
            jobsRes.map(async (job) => {
              try {
                const res = await actor.getEmployerProfileById(job.employerId);
                return {
                  ...job,
                  companyName: "ok" in res ? res.ok.companyName : "",
                };
              } catch {
                return { ...job, companyName: "" };
              }
            }),
          );
          setJobs(enriched);
          if ("ok" in appsRes) {
            const ids = new Set<string>(
              appsRes.ok.map((a: Application) => a.jobId.toString()),
            );
            setAppliedJobIds(ids);
          }
          setLoading(false);
        } catch {
          setLoading(false);
        }
      })
      .catch(() => setLoading(false));
  }, [actor, session.token]);

  const handleApply = async (jobId: bigint) => {
    if (!actor) return;
    setApplying(jobId.toString());
    try {
      const result = await actor.applyToJob(session.token, jobId);
      if ("err" in result) {
        toast.error(result.err);
      } else {
        setAppliedJobIds((prev) => new Set([...prev, jobId.toString()]));
        toast.success("Application submitted!");
      }
    } catch (err: any) {
      toast.error(err?.message || "Apply failed");
    } finally {
      setApplying(null);
    }
  };

  if (loading) {
    return (
      <div
        data-ocid="browse.loading_state"
        className="flex items-center justify-center h-48"
      >
        <Loader2 className="animate-spin text-primary" size={24} />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Browse Jobs"
        subtitle={`${jobs.length} open position${jobs.length !== 1 ? "s" : ""} available`}
      />
      {jobs.length === 0 ? (
        <div
          data-ocid="browse.empty_state"
          className="bg-card rounded-xl border border-border shadow-card p-12 text-center"
        >
          <Briefcase size={36} className="mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">
            No jobs posted yet. Check back soon!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {jobs.map((job, idx) => (
            <div
              key={job.id.toString()}
              data-ocid={`browse.item.${idx + 1}`}
              className="bg-card rounded-xl border border-border shadow-card p-5 flex items-start gap-4"
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                <Briefcase size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-foreground">{job.title}</h3>
                {job.companyName && (
                  <p className="text-xs font-medium text-primary mt-0.5 flex items-center gap-1">
                    <Building2 size={12} /> {job.companyName}
                  </p>
                )}
                <p className="text-sm text-muted-foreground">{job.location}</p>
                {job.description && (
                  <div className="mt-2">
                    <p
                      className={`text-sm text-foreground/80 ${job.description.length > 150 && !expandedJobs.has(job.id.toString()) ? "line-clamp-3" : ""}`}
                    >
                      {job.description}
                    </p>
                    {job.description.length > 150 && (
                      <button
                        type="button"
                        className="text-xs text-primary underline cursor-pointer mt-1 bg-transparent border-0 p-0"
                        onClick={() =>
                          setExpandedJobs((prev) => {
                            const next = new Set(prev);
                            if (next.has(job.id.toString())) {
                              next.delete(job.id.toString());
                            } else {
                              next.add(job.id.toString());
                            }
                            return next;
                          })
                        }
                        data-ocid={`browse.item.${idx + 1}.toggle`}
                      >
                        {expandedJobs.has(job.id.toString())
                          ? "Show less"
                          : "Show more"}
                      </button>
                    )}
                  </div>
                )}
              </div>
              <div className="flex-shrink-0">
                {appliedJobIds.has(job.id.toString()) ? (
                  <Badge className="bg-primary/10 text-primary border-0">
                    Applied
                  </Badge>
                ) : (
                  <Button
                    data-ocid={`browse.item.${idx + 1}.button`}
                    size="sm"
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                    disabled={applying === job.id.toString()}
                    onClick={() => handleApply(job.id)}
                  >
                    {applying === job.id.toString() && (
                      <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
                    )}
                    Apply
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MyApplicationsTab({
  session,
  actor,
}: {
  session: Session;
  actor: any;
}) {
  const [applications, setApplications] = useState<
    Array<Application & { jobTitle?: string; jobLocation?: string }>
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!actor) return;
    actor.getMyApplications(session.token).then(async (res: any) => {
      if ("ok" in res) {
        const apps = res.ok as Application[];
        const enriched = await Promise.all(
          apps.map(async (app) => {
            try {
              const jobRes = await actor.getJobById(app.jobId);
              if ("ok" in jobRes) {
                return {
                  ...app,
                  jobTitle: jobRes.ok.title,
                  jobLocation: jobRes.ok.location,
                };
              }
            } catch {}
            return { ...app, jobTitle: "Unknown Job", jobLocation: "" };
          }),
        );
        setApplications(enriched);
      }
      setLoading(false);
    });
  }, [actor, session.token]);

  if (loading) {
    return (
      <div
        data-ocid="applications.loading_state"
        className="flex items-center justify-center h-48"
      >
        <Loader2 className="animate-spin text-primary" size={24} />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="My Applications"
        subtitle="Track the jobs you've applied to"
      />
      {applications.length === 0 ? (
        <div
          data-ocid="applications.empty_state"
          className="bg-card rounded-xl border border-border shadow-card p-12 text-center"
        >
          <ClipboardList
            size={36}
            className="mx-auto text-muted-foreground mb-3"
          />
          <p className="text-muted-foreground">
            You haven't applied to any jobs yet.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {applications.map((app, idx) => (
            <div
              key={app.id.toString()}
              data-ocid={`applications.item.${idx + 1}`}
              className="bg-card rounded-xl border border-border shadow-card p-5 flex items-center gap-4"
            >
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                <Briefcase size={16} />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-foreground text-sm">
                  {app.jobTitle}
                </p>
                <p className="text-xs text-muted-foreground">
                  {app.jobLocation}
                </p>
              </div>
              <Badge className="bg-primary/10 text-primary border-0 text-xs">
                Applied
              </Badge>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Employer Dashboard ───────────────────────────────────────────────────────
function EmployerDashboard({
  session,
  actor,
  onLogout,
}: {
  session: Session;
  actor: any;
  onLogout: () => void;
}) {
  const [tab, setTab] = useState<EmployerTab>("dashboard");
  const [jobCount, setJobCount] = useState(0);
  const [appCount, setAppCount] = useState(0);

  useEffect(() => {
    if (!actor) return;
    Promise.all([
      actor.getEmployerJobs(session.token),
      actor.getEmployerApplications(session.token),
    ]).then(([jobsRes, appsRes]: [any, any]) => {
      if ("ok" in jobsRes) setJobCount(jobsRes.ok.length);
      if ("ok" in appsRes) setAppCount(appsRes.ok.length);
    });
  }, [actor, session.token]);

  const sidebarItems: {
    id: EmployerTab;
    label: string;
    icon: React.ReactNode;
  }[] = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: <LayoutDashboard size={16} />,
    },
    { id: "company", label: "Company Profile", icon: <Building2 size={16} /> },
    { id: "post", label: "Post Job", icon: <PlusCircle size={16} /> },
    { id: "jobs", label: "My Jobs", icon: <Briefcase size={16} /> },
    {
      id: "applicants",
      label: "Applications",
      icon: <ClipboardList size={16} />,
    },
    { id: "talent", label: "Talent Database", icon: <Users size={16} /> },
  ];

  return (
    <DashboardShell
      session={session}
      onLogout={onLogout}
      sidebar={sidebarItems.map((item) => (
        <SidebarItem
          key={item.id}
          icon={item.icon}
          label={item.label}
          active={tab === item.id}
          onClick={() => setTab(item.id)}
          ocid={`nav.${item.id}.tab`}
        />
      ))}
    >
      {tab === "dashboard" && (
        <EmployerHome
          session={session}
          jobCount={jobCount}
          appCount={appCount}
          onNavigate={setTab}
        />
      )}
      {tab === "company" && (
        <CompanyProfileTab session={session} actor={actor} />
      )}
      {tab === "post" && (
        <PostJobTab
          session={session}
          actor={actor}
          onGoCompany={() => setTab("company")}
        />
      )}
      {tab === "jobs" && <MyJobsTab session={session} actor={actor} />}
      {tab === "applicants" && (
        <ApplicantsTab session={session} actor={actor} />
      )}
      {tab === "talent" && <TalentDatabaseTab actor={actor} />}
    </DashboardShell>
  );
}

function EmployerHome({
  session,
  jobCount,
  appCount,
  onNavigate,
}: {
  session: Session;
  jobCount: number;
  appCount: number;
  onNavigate: (t: EmployerTab) => void;
}) {
  return (
    <div>
      <PageHeader
        title={`Hello, ${session.name} 👋`}
        subtitle="Manage your job postings and review applicants"
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <StatCard
          icon={<Briefcase size={18} />}
          label="Active Jobs"
          value={jobCount}
        />
        <StatCard
          icon={<ClipboardList size={18} />}
          label="Total Applications"
          value={appCount}
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <h3 className="font-semibold text-foreground mb-1">Post a New Job</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Find the right pharmacist for your pharmacy.
          </p>
          <Button
            data-ocid="dashboard.post.button"
            size="sm"
            className="bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={() => onNavigate("post")}
          >
            Post Job <ChevronRight size={14} className="ml-1" />
          </Button>
        </Card>
        <Card>
          <h3 className="font-semibold text-foreground mb-1">
            Review Applications
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            See who has applied to your job postings.
          </p>
          <Button
            data-ocid="dashboard.applicants.button"
            size="sm"
            variant="outline"
            onClick={() => onNavigate("applicants")}
          >
            View Applicants <ChevronRight size={14} className="ml-1" />
          </Button>
        </Card>
        <Card>
          <h3 className="font-semibold text-foreground mb-1">Browse Talent</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Explore pharmacist profiles in our talent database.
          </p>
          <Button
            data-ocid="dashboard.talent.button"
            size="sm"
            variant="outline"
            onClick={() => onNavigate("talent")}
          >
            Browse Talent <ChevronRight size={14} className="ml-1" />
          </Button>
        </Card>
      </div>
    </div>
  );
}

function CompanyProfileTab({
  session,
  actor,
}: {
  session: Session;
  actor: any;
}) {
  const [profile, setProfile] = useState<Partial<EmployerProfile>>({
    companyName: "",
    mobileNumber: "",
    location: "",
    state: "",
  });
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!actor) return;
    actor.getEmployerProfile(session.token).then((res: any) => {
      if ("ok" in res) setProfile(res.ok);
      setFetching(false);
    });
  }, [actor, session.token]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actor) return;
    setLoading(true);
    try {
      const result = await actor.saveEmployerProfile(
        session.token,
        profile.companyName || "",
        profile.mobileNumber || "",
        profile.location || "",
        profile.state || "",
      );
      if ("err" in result) {
        toast.error(result.err);
      } else {
        toast.success("Company profile saved!");
      }
    } catch (err: any) {
      toast.error(err?.message || "Save failed");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div
        data-ocid="company.loading_state"
        className="flex items-center justify-center h-48"
      >
        <Loader2 className="animate-spin text-primary" size={24} />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Company Profile"
        subtitle="Update your company information"
      />
      <Card className="max-w-2xl">
        <form onSubmit={handleSave} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Label className="text-sm font-medium">Company Name</Label>
              <Input
                data-ocid="company.input"
                className="mt-1"
                placeholder="Acme Pharmacy"
                value={profile.companyName || ""}
                onChange={(e) =>
                  setProfile((p) => ({ ...p, companyName: e.target.value }))
                }
                required
              />
            </div>
            <div>
              <Label className="text-sm font-medium">Mobile Number</Label>
              <Input
                data-ocid="company.input"
                className="mt-1"
                placeholder="+1 (555) 000-0000"
                value={profile.mobileNumber || ""}
                onChange={(e) =>
                  setProfile((p) => ({ ...p, mobileNumber: e.target.value }))
                }
              />
            </div>
            <div>
              <Label className="text-sm font-medium">Location</Label>
              <Input
                data-ocid="company.input"
                className="mt-1"
                placeholder="City, Address"
                value={profile.location || ""}
                onChange={(e) =>
                  setProfile((p) => ({ ...p, location: e.target.value }))
                }
              />
            </div>
            <div>
              <Label className="text-sm font-medium">State</Label>
              <Select
                value={profile.state || ""}
                onValueChange={(v) => setProfile((p) => ({ ...p, state: v }))}
              >
                <SelectTrigger data-ocid="company.select" className="mt-1">
                  <SelectValue placeholder="Select state" />
                </SelectTrigger>
                <SelectContent>
                  {INDIAN_STATES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm font-medium">Country</Label>
              <Input
                className="mt-1 bg-muted text-muted-foreground"
                value="India"
                disabled
                readOnly
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button
              data-ocid="company.save_button"
              type="submit"
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              disabled={loading}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? "Saving..." : "Save Profile"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

function PostJobTab({
  session,
  actor,
  onGoCompany,
}: {
  session: Session;
  actor: any;
  onGoCompany: () => void;
}) {
  const [profileComplete, setProfileComplete] = useState<boolean | null>(null);
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!actor) return;
    actor.getEmployerProfile(session.token).then((res: any) => {
      if ("ok" in res && res.ok.companyName) {
        setProfileComplete(true);
      } else {
        setProfileComplete(false);
      }
    });
  }, [actor, session.token]);

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actor) return;
    setLoading(true);
    try {
      const result = await actor.postJob(
        session.token,
        title,
        location,
        description,
      );
      if ("err" in result) {
        toast.error(result.err);
      } else {
        toast.success("Job posted successfully!");
        setTitle("");
        setLocation("");
        setDescription("");
      }
    } catch (err: any) {
      toast.error(err?.message || "Post failed");
    } finally {
      setLoading(false);
    }
  };

  if (profileComplete === null) {
    return (
      <div
        data-ocid="postjob.loading_state"
        className="flex items-center justify-center h-48"
      >
        <Loader2 className="animate-spin text-primary" size={24} />
      </div>
    );
  }

  if (!profileComplete) {
    return (
      <div>
        <PageHeader title="Post a Job" />
        <Card className="max-w-lg">
          <div className="text-center py-4">
            <Building2
              size={36}
              className="mx-auto text-muted-foreground mb-3"
            />
            <h3 className="font-semibold text-foreground mb-2">
              Complete Your Company Profile First
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              You need to set up your company profile before posting jobs.
            </p>
            <Button
              data-ocid="postjob.primary_button"
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={onGoCompany}
            >
              Go to Company Profile
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Post a Job"
        subtitle="Create a new job listing for pharmacists"
      />
      <Card className="max-w-2xl">
        <form onSubmit={handlePost} className="space-y-5">
          <div>
            <Label className="text-sm font-medium">Job Title</Label>
            <Input
              data-ocid="postjob.input"
              className="mt-1"
              placeholder="Staff Pharmacist, Pharmacy Manager..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div>
            <Label className="text-sm font-medium">Location</Label>
            <Input
              data-ocid="postjob.input"
              className="mt-1"
              placeholder="City, State"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              required
            />
          </div>
          <div>
            <Label className="text-sm font-medium">Job Description</Label>
            <Textarea
              data-ocid="postjob.textarea"
              className="mt-1 min-h-[120px]"
              placeholder="Describe the role, requirements, and benefits..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>
          <div className="flex justify-end">
            <Button
              data-ocid="postjob.submit_button"
              type="submit"
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              disabled={loading}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? "Posting..." : "Post Job"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

function MyJobsTab({
  session,
  actor,
}: {
  session: Session;
  actor: any;
}) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  const loadJobs = useCallback(async () => {
    if (!actor) return;
    const res = await actor.getEmployerJobs(session.token);
    if ("ok" in res) setJobs(res.ok);
    setLoading(false);
  }, [actor, session.token]);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  const handleDelete = async (jobId: bigint) => {
    if (!actor) return;
    setDeleting(jobId.toString());
    try {
      const result = await actor.deleteJob(session.token, jobId);
      if ("err" in result) {
        toast.error(result.err);
      } else {
        setJobs((prev) => prev.filter((j) => j.id !== jobId));
        toast.success("Job deleted");
      }
    } catch (err: any) {
      toast.error(err?.message || "Delete failed");
    } finally {
      setDeleting(null);
    }
  };

  if (loading) {
    return (
      <div
        data-ocid="jobs.loading_state"
        className="flex items-center justify-center h-48"
      >
        <Loader2 className="animate-spin text-primary" size={24} />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="My Jobs"
        subtitle={`${jobs.length} job${jobs.length !== 1 ? "s" : ""} posted`}
      />
      {jobs.length === 0 ? (
        <div
          data-ocid="jobs.empty_state"
          className="bg-card rounded-xl border border-border shadow-card p-12 text-center"
        >
          <Briefcase size={36} className="mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">
            You haven't posted any jobs yet.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {jobs.map((job, idx) => (
            <div
              key={job.id.toString()}
              data-ocid={`jobs.item.${idx + 1}`}
              className="bg-card rounded-xl border border-border shadow-card p-5 flex items-start gap-4"
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                <Briefcase size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-foreground">{job.title}</h3>
                <p className="text-sm text-muted-foreground">{job.location}</p>
                <p className="text-sm text-foreground/70 mt-1 line-clamp-2">
                  {job.description}
                </p>
              </div>
              <Button
                data-ocid={`jobs.item.${idx + 1}.delete_button`}
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive hover:bg-destructive/10 flex-shrink-0"
                disabled={deleting === job.id.toString()}
                onClick={() => handleDelete(job.id)}
              >
                {deleting === job.id.toString() ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 size={15} />
                )}
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ApplicantsTab({
  session,
  actor,
}: {
  session: Session;
  actor: any;
}) {
  const [applicants, setApplicants] = useState<
    Array<{ app: Application; profile?: PharmacistProfile; jobTitle?: string }>
  >([]);
  const [loading, setLoading] = useState(true);

  const handleDownloadResume = async (resumeFileId: string) => {
    try {
      const config = await loadConfig();
      const agent = new HttpAgent({ host: config.backend_host });
      if (config.backend_host?.includes("localhost")) {
        await agent.fetchRootKey().catch(() => {});
      }
      const storageClient = new StorageClient(
        config.bucket_name,
        config.storage_gateway_url,
        config.backend_canister_id,
        config.project_id,
        agent,
      );
      const url = await storageClient.getDirectURL(resumeFileId);
      window.open(url, "_blank");
    } catch (err: any) {
      toast.error(
        `Failed to download resume: ${err?.message || "Unknown error"}`,
      );
    }
  };

  useEffect(() => {
    if (!actor) return;
    actor.getEmployerApplications(session.token).then(async (res: any) => {
      if ("ok" in res) {
        const apps = res.ok as Application[];
        const enriched = await Promise.all(
          apps.map(async (app) => {
            const [pharmRes, jobRes] = await Promise.all([
              actor.getPharmacistById(app.pharmacistId),
              actor.getJobById(app.jobId),
            ]);
            return {
              app,
              profile: "ok" in pharmRes ? pharmRes.ok : undefined,
              jobTitle: "ok" in jobRes ? jobRes.ok.title : "Unknown Job",
            };
          }),
        );
        setApplicants(enriched);
      }
      setLoading(false);
    });
  }, [actor, session.token]);

  if (loading) {
    return (
      <div
        data-ocid="applicants.loading_state"
        className="flex items-center justify-center h-48"
      >
        <Loader2 className="animate-spin text-primary" size={24} />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Applications"
        subtitle="Pharmacists who have applied to your jobs"
      />
      {applicants.length === 0 ? (
        <div
          data-ocid="applicants.empty_state"
          className="bg-card rounded-xl border border-border shadow-card p-12 text-center"
        >
          <ClipboardList
            size={36}
            className="mx-auto text-muted-foreground mb-3"
          />
          <p className="text-muted-foreground">No applications received yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {applicants.map(({ app, profile, jobTitle }, idx) => (
            <div
              key={app.id.toString()}
              data-ocid={`applicants.item.${idx + 1}`}
              className="bg-card rounded-xl border border-border shadow-card p-5 flex items-start gap-4"
            >
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                <User size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-foreground text-sm">
                    {profile?.name || "Unknown Pharmacist"}
                  </p>
                  {profile?.licenseStatus && (
                    <Badge
                      className={`text-xs border-0 ${
                        profile.licenseStatus === "Endorsed"
                          ? "bg-primary/10 text-primary"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {profile.licenseStatus}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {profile?.pciNumber && <span>PCI: {profile.pciNumber}</span>}
                  {profile?.state && (
                    <span className="ml-2">• {profile.state}</span>
                  )}
                  {profile?.companyName && (
                    <span className="ml-2">• {profile.companyName}</span>
                  )}
                </p>
                {profile?.mobileNumber && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    📞 {profile.mobileNumber}
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  Applied for:{" "}
                  <span className="font-medium text-foreground">
                    {jobTitle}
                  </span>
                </p>
                {profile?.resumeFileId && (
                  <div className="mt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs"
                      onClick={() => handleDownloadResume(profile.resumeFileId)}
                    >
                      <FileText size={13} className="mr-1" />
                      Resume
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TalentDatabaseTab({ actor }: { actor: any }) {
  const [profiles, setProfiles] = useState<PharmacistProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<PharmacistProfile | null>(null);

  useEffect(() => {
    if (!actor) {
      setLoading(false);
      return;
    }
    actor
      .getAllPharmacists()
      .then((res: any) => {
        if (Array.isArray(res)) setProfiles(res);
        else if (res && "ok" in res) setProfiles(res.ok);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [actor]);

  const filtered = profiles.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.state.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div>
      <PageHeader
        title="Talent Database"
        subtitle="Browse pharmacist profiles and find the right candidate"
      />
      <div className="mb-4">
        <Input
          data-ocid="talent.search_input"
          placeholder="Search by name or state..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      {loading ? (
        <div
          data-ocid="talent.loading_state"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-lg border bg-card p-4 space-y-3">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3 w-1/2" />
              <Skeleton className="h-3 w-1/3" />
              <Skeleton className="h-6 w-20" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div
          data-ocid="talent.empty_state"
          className="text-center py-16 text-muted-foreground"
        >
          <Users size={40} className="mx-auto mb-3 opacity-40" />
          <p className="text-sm">
            {search
              ? "No pharmacists match your search."
              : "No pharmacists registered yet."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((profile, idx) => (
            <button
              key={profile.userId}
              type="button"
              data-ocid={`talent.item.${idx + 1}` as string}
              className="rounded-lg border bg-card p-4 cursor-pointer hover:shadow-md transition-shadow text-left w-full"
              onClick={() => setSelected(profile)}
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-semibold text-foreground text-sm">
                    {profile.name}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {profile.state}, India
                  </p>
                </div>
                <Badge
                  variant={
                    profile.licenseStatus === "Endorsed"
                      ? "default"
                      : "secondary"
                  }
                  className={
                    profile.licenseStatus === "Endorsed"
                      ? "bg-green-100 text-green-800 border-green-200"
                      : ""
                  }
                >
                  {profile.licenseStatus || "Free"}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                PCI: {profile.pciNumber || "—"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {profile.mobileNumber}
              </p>
            </button>
          ))}
        </div>
      )}

      <Dialog
        open={!!selected}
        onOpenChange={(open) => !open && setSelected(null)}
      >
        <DialogContent data-ocid="talent.dialog" className="max-w-md">
          <DialogHeader>
            <DialogTitle>{selected?.name}</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-muted-foreground">Mobile</p>
                  <p className="font-medium">{selected.mobileNumber}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">State</p>
                  <p className="font-medium">{selected.state}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Country</p>
                  <p className="font-medium">India</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">PCI Number</p>
                  <p className="font-medium">{selected.pciNumber || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">
                    License Status
                  </p>
                  <Badge
                    variant={
                      selected.licenseStatus === "Endorsed"
                        ? "default"
                        : "secondary"
                    }
                    className={
                      selected.licenseStatus === "Endorsed"
                        ? "bg-green-100 text-green-800 border-green-200"
                        : ""
                    }
                  >
                    {selected.licenseStatus || "Free"}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">
                    Current Employer
                  </p>
                  <p className="font-medium">{selected.companyName || "—"}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Root App ─────────────────────────────────────────────────────────────────
type AuthView = "login" | "signup";

export default function App() {
  const [session, setSession] = useState<Session | null>(() => getSession());
  const [authView, setAuthView] = useState<AuthView>("login");
  const { actor, isFetching } = useActor();

  // Admin route check
  const [isAdmin] = useState(() => window.location.hash === "#admin");

  // Admin route: visit /#admin to access admin panel
  const handleLogin = (s: Session) => setSession(s);
  const handleSignup = (s: Session) => setSession(s);

  // Keep-alive: ping backend every 10s to prevent canister sleeping (uses getAllJobs, no auth required)
  useEffect(() => {
    if (!actor) return;
    const ping = () => {
      try {
        (actor as any).getAllJobs().catch(() => {});
      } catch {}
    };
    ping();
    const interval = setInterval(ping, 5000);
    return () => clearInterval(interval);
  }, [actor]);

  const handleLogout = async () => {
    if (actor && session) {
      try {
        await (actor as any).logout(session.token);
      } catch {}
    }
    clearSession();
    setSession(null);
  };

  if (isAdmin) return <AdminPanel />;

  if (!session) {
    if (authView === "login") {
      return (
        <>
          <LoginPage
            onLogin={handleLogin}
            onGoSignup={() => setAuthView("signup")}
            actor={actor}
          />
          <Toaster richColors />
        </>
      );
    }
    return (
      <>
        <SignupPage
          onSignup={handleSignup}
          onGoLogin={() => setAuthView("login")}
          actor={actor}
        />
        <Toaster richColors />
      </>
    );
  }

  if (isFetching && !actor) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  if (isAdmin) return <AdminPanel />;

  return (
    <>
      {session.role === "Pharmacist" ? (
        <PharmacistDashboard
          session={session}
          actor={actor}
          onLogout={handleLogout}
        />
      ) : (
        <EmployerDashboard
          session={session}
          actor={actor}
          onLogout={handleLogout}
        />
      )}
      <Toaster richColors />
    </>
  );
}
