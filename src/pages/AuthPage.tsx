import { useEffect, useState, Suspense } from "react";
import { 
  Stethoscope, Mail, Lock, User, ShieldCheck, 
  ChevronRight, Building2, Loader2
} from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";

type AuthRole = "user" | "management" | "admin";

function AuthForm() {
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState<AuthRole>("user");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [selectedHospital, setSelectedHospital] = useState("");
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isNewHospital, setIsNewHospital] = useState(false);
  const [hospitalName, setHospitalName] = useState("");
  
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get("redirect");

  useEffect(() => {
    const fetchHospitals = async () => {
      const { data } = await supabase.from("hospitals").select("id, name");
      if (data) setHospitals(data);
    };
    fetchHospitals();
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (isLogin) {
        const { data, error: authError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (authError) throw authError;

        const userRole = data.user.user_metadata?.role || "user";
        
        // Strict Role Enforcement
        if (role !== userRole) {
          setError(`Access Denied: This account is registered as a ${userRole.toUpperCase()}. Please select the correct portal to sign in.`);
          await supabase.auth.signOut();
          return;
        }
        
        // Logical redirection
        if (redirectTo && userRole === "user") {
          navigate(redirectTo);
        } else {
          navigate(`/dashboard/${userRole}`);
        }
      } else {
        if (role === "management" && !isNewHospital && !selectedHospital) {
          setError("Please select a hospital to manage.");
          setIsLoading(false);
          return;
        }

        if (role === "management" && isNewHospital && !hospitalName) {
          setError("Please enter the name of your new hospital.");
          setIsLoading(false);
          return;
        }

        const { data, error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              role: role,
              hospital_id: (role === "management" && !isNewHospital) ? selectedHospital : null,
              hospital_name: (role === "management" && isNewHospital) ? hospitalName : null,
            },
          },
        });

        if (authError) throw authError;

        if (data.user) {
          alert("Registration successful! Please check your email or click login.");
          setIsLogin(true);
        }
      }
    } catch (err: any) {
      setError(err.message || "An authentication error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isLogin && role === "admin") {
      setRole("user");
    }
  }, [isLogin, role]);

  return (
    <div className="container relative mx-auto flex max-w-5xl items-stretch overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-slate-100">
      
      {/* Left Side: Branding/Image */}
      <div className="hidden w-1/2 flex-col justify-between bg-primary-600 p-12 text-white lg:flex relative overflow-hidden">
        <div className="absolute inset-0 bg-medical-pattern opacity-10" />
        <div className="relative z-10 flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-primary-600">
            <Stethoscope size={24} />
          </div>
          <span className="text-xl font-bold tracking-tight">MedicoCrew</span>
        </div>

        <div className="relative z-10">
          <h2 className="text-4xl font-bold leading-tight">
            {isLogin ? "Welcome back!" : "Join the medical network."}
          </h2>
          <p className="mt-4 text-primary-100/80 leading-relaxed max-w-sm">
            {isLogin 
              ? "Access your dashboard to manage ratings, view equipment, or monitor hospital stats."
              : "Create an account to start contributing to hospital quality and explore medical tools."}
          </p>
          <div className="mt-8 flex items-center gap-4 text-sm font-semibold">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10">
              <ShieldCheck size={20} />
            </div>
            Verified Healthcare Platform
          </div>
        </div>

        <div className="relative z-10 text-xs text-primary-200">
          © {new Date().getFullYear()} MedicoCrew. All rights reserved.
        </div>
      </div>

      {/* Right Side: Form */}
      <div className="flex w-full flex-col p-8 sm:p-12 lg:w-1/2">
        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight capitalize">
            {isLogin ? "Sign In" : "Create Account"}
          </h2>
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-sm font-semibold text-primary-600 hover:text-primary-700 transition-colors"
          >
            {isLogin ? "New here? Register" : "Have an account? Login"}
          </button>
        </div>

        {/* Role Selection */}
        <div className="mb-8 grid grid-cols-3 gap-2">
          {(["user", "management", "admin"] as const)
            .filter((r) => isLogin || r !== "admin")
            .map((r) => (
            <button
               key={r}
               type="button"
               onClick={() => setRole(r)}
               className={cn(
                 "rounded-xl border px-3 py-2 text-xs font-bold transition-all capitalize",
                 role === r
                   ? "border-primary-600 bg-primary-50 text-primary-600 shadow-sm"
                   : "border-slate-200 text-slate-500 hover:border-primary-200 hover:bg-slate-50"
               )}
             >
               {r}
             </button>
           ))}
         </div>

        <form onSubmit={handleAuth} className="flex flex-col gap-5">
          {error && (
            <div className="rounded-xl bg-red-50 p-4 text-xs font-medium text-red-600 ring-1 ring-red-100">
              {error}
            </div>
          )}

          {!isLogin && (
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">Full Name</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="John Doe"
                  className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm font-medium transition-all focus:border-primary-500 focus:outline-none focus:ring-4 focus:ring-primary-500/10"
                />
              </div>
            </div>
          )}

          {!isLogin && role === "management" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between ml-1">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  {isNewHospital ? "Hospital Name" : "Select Hospital"}
                </label>
                <button 
                  type="button"
                  onClick={() => setIsNewHospital(!isNewHospital)}
                  className="text-[10px] font-black text-primary-600 uppercase tracking-widest hover:underline"
                >
                  {isNewHospital ? "Choose Existing?" : "New Facility?"}
                </button>
              </div>
              
              <div className="relative">
                {isNewHospital ? (
                  <>
                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      type="text"
                      required
                      value={hospitalName}
                      onChange={(e) => setHospitalName(e.target.value)}
                      placeholder="City General Hospital"
                      className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm font-medium transition-all focus:border-primary-500 focus:outline-none focus:ring-4 focus:ring-primary-500/10"
                    />
                  </>
                ) : (
                  <>
                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <select
                      required
                      value={selectedHospital}
                      onChange={(e) => setSelectedHospital(e.target.value)}
                      className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm font-medium transition-all focus:border-primary-500 focus:outline-none focus:ring-4 focus:ring-primary-500/10 appearance-none"
                    >
                      <option value="">Select a facility...</option>
                      {hospitals.map(h => (
                        <option key={h.id} value={h.id}>{h.name}</option>
                      ))}
                    </select>
                  </>
                )}
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="john@hospital.com"
                className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm font-medium transition-all focus:border-primary-500 focus:outline-none focus:ring-4 focus:ring-primary-500/10"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm font-medium transition-all focus:border-primary-500 focus:outline-none focus:ring-4 focus:ring-primary-500/10"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary-600 font-bold text-white shadow-xl shadow-primary-500/20 transition-all hover:bg-primary-700 active:scale-95 disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <>
                {isLogin ? "Sign In" : "Register"}
                <ChevronRight size={20} />
              </>
            )}
          </button>

          <p className="mt-4 text-center text-xs leading-relaxed text-slate-400 px-4">
            By continuing, you agree to MedicoCrew's <Link to="/terms" className="underline underline-offset-2">Terms of Service</Link> and <Link to="/privacy" className="underline underline-offset-2">Privacy Policy</Link>.
          </p>
        </form>
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <div className="flex min-h-[calc(100vh-64px)] items-center justify-center bg-slate-50 py-12 px-4 relative overflow-hidden">
      <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/3 h-96 w-96 rounded-full bg-primary-100/50 blur-3xl opacity-50" />
      <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/3 h-96 w-96 rounded-full bg-primary-50/10 blur-3xl opacity-50" />
      
      <Suspense fallback={<div className="flex items-center justify-center p-12 bg-white rounded-3xl shadow-2xl"><Loader2 className="animate-spin text-primary-600" size={48} /></div>}>
        <AuthForm />
      </Suspense>
    </div>
  );
}
