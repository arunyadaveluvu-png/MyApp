import { useEffect, useState } from "react";
import { 
  User, Calendar, Star, MessageSquare, Clock, 
  Bookmark, ShieldCheck, History, LogOut,
  CheckCircle2, ChevronRight, Stethoscope, 
  Activity, FileText, CreditCard, Bell, Search, Filter
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/Toast";

const FALLBACK_HOSPITAL = "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=2053";

export default function UserDashboard() {
  const [activeTab, setActiveTab] = useState("appointments");
  const [profile, setProfile] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const navigate = useNavigate();
  const { showToast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }

    const role = user.user_metadata?.role || "user";
    if (role !== "user") {
      navigate(`/dashboard/${role}`);
      return;
    }

    const { data: prof } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("id", user.id)
      .single();
    
    setProfile(prof);

    const { data: revs } = await supabase
      .from("reviews")
      .select(`*, hospitals (name)`)
      .eq("user_id", user.id);

    if (revs) setReviews(revs);

    const { data: apps } = await supabase
      .from("appointments")
      .select("*, hospitals(name)")
      .eq("user_id", user.id)
      .order("appointment_date", { ascending: false });

    if (apps) setAppointments(apps);
  };

  const handleLogout = async () => {
    showToast("Signing out...", "loading");
    await supabase.auth.signOut();
    showToast("Signed out successfully", "success");
    navigate("/");
  };

  return (
    <div className="bg-[#F8FAFB] min-h-screen font-sans selection:bg-teal-100 selection:text-teal-900">
      {/* Top Bar - Clean & Minimal */}
      <nav className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-slate-100 px-6 h-20 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="h-10 w-10 bg-teal-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-teal-500/20 group-hover:scale-105 transition-transform">
              <Stethoscope size={24} />
            </div>
            <span className="text-xl font-black tracking-tighter text-slate-900 italic">MedicoCrew</span>
          </Link>
          
          <div className="hidden md:flex relative w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
            <input 
              type="text" 
              placeholder="Search appointments, labs..." 
              className="w-full h-11 bg-slate-50 border-none rounded-2xl pl-10 pr-4 text-sm font-medium focus:ring-2 focus:ring-teal-500/10 placeholder:text-slate-300 transition-all"
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button className="h-11 w-11 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-teal-500 hover:bg-teal-50 transition-all relative">
            <Bell size={20} />
            <span className="absolute top-3 right-3 h-2 w-2 bg-rose-500 rounded-full border-2 border-white"></span>
          </button>
          <div className="h-11 w-11 rounded-2xl bg-teal-50 flex items-center justify-center text-teal-600 font-bold border border-teal-100">
            {profile?.full_name?.charAt(0) || "U"}
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-10 lg:flex gap-10">
        {/* Modern Sidebar */}
        <aside className="lg:w-80 flex-shrink-0 space-y-8 mb-10 lg:mb-0">
          <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
              <ShieldCheck size={64} className="text-teal-600" />
            </div>
            <div className="flex items-center gap-4 relative z-10">
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white shadow-xl">
                 <User size={30} />
              </div>
              <div>
                <h2 className="font-black text-slate-900 tracking-tight">{profile?.full_name || "Patient User"}</h2>
                <div className="flex items-center gap-1.5 text-[10px] font-black text-teal-600 uppercase tracking-widest mt-1">
                  <Star size={10} className="fill-teal-500" />
                  Premium Patient
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            {[
              { id: "overview", label: "Health Hub", icon: Activity },
              { id: "appointments", label: "Appointments", icon: Calendar },
              { id: "history", label: "Medical Records", icon: FileText },
              { id: "billing", label: "Billing & Invoices", icon: CreditCard },
              { id: "reviews", label: "My Feedback", icon: MessageSquare },
              { id: "bookmarks", label: "Saved Clinics", icon: Bookmark },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={cn(
                  "flex w-full items-center gap-4 px-6 py-4 rounded-2xl text-sm font-bold transition-all group",
                  activeTab === item.id 
                    ? "bg-teal-500 text-white shadow-xl shadow-teal-500/20" 
                    : "text-slate-500 hover:bg-white hover:text-teal-600 hover:shadow-sm"
                )}
              >
                <item.icon size={20} className={cn("transition-transform group-hover:scale-110", activeTab === item.id ? "text-white" : "text-slate-300 group-hover:text-teal-500")} />
                {item.label}
              </button>
            ))}
          </div>

          <button 
            onClick={handleLogout}
            className="flex w-full items-center gap-4 px-6 py-4 rounded-2xl text-sm font-bold text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all active:scale-95 mt-10"
          >
            <LogOut size={20} />
            Sign Out
          </button>
        </aside>

        {/* Dynamic Content Area */}
        <main className="flex-grow space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-1000">
          
          <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="text-[10px] font-black text-teal-600 uppercase tracking-[0.4em] mb-2 px-1">Command Center</div>
              <h1 className="text-4xl font-black text-slate-900 tracking-tighter leading-none capitalize">{activeTab} Overview</h1>
            </div>
            <div className="flex gap-3">
              <button className="h-12 px-6 rounded-2xl border border-slate-100 bg-white text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 hover:bg-slate-50 transition-all shadow-sm">
                <Filter size={16} /> Filter
              </button>
              <Link to="/hospitals" className="h-12 px-8 rounded-2xl bg-teal-500 text-white text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-teal-600 transition-all shadow-xl shadow-teal-500/20 active:scale-95">
                New Booking <ChevronRight size={16} />
              </Link>
            </div>
          </header>

          <div className="space-y-8">
            {activeTab === "appointments" && (
              <div className="grid grid-cols-1 gap-6">
                {appointments.length > 0 ? appointments.map((app, i) => (
                  <div key={app.id} 
                    className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm transition-all hover:shadow-2xl hover:shadow-teal-500/5 group relative overflow-hidden"
                    style={{ animationDelay: `${i * 100}ms` }}
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                      <div className="flex items-center gap-6">
                        <div className="h-24 w-24 rounded-3xl bg-slate-100 overflow-hidden border border-slate-200 shadow-inner group-hover:scale-110 transition-transform duration-500">
                           <img 
                             src={app.hospitals?.image_url || FALLBACK_HOSPITAL} 
                             alt={app.hospitals?.name} 
                             className="w-full h-full object-cover filter brightness-90 group-hover:brightness-100 transition-all"
                           />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                             <span className={cn(
                               "h-2 w-2 rounded-full",
                               app.status === 'confirmed' ? "bg-teal-500 animate-pulse" : "bg-slate-300"
                             )} />
                             <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{app.status} Facility</span>
                          </div>
                          <h3 className="text-2xl font-black text-slate-900 tracking-tight">{app.hospitals?.name}</h3>
                          <div className="mt-3 flex flex-wrap gap-4">
                            <div className="flex items-center gap-2 text-xs font-bold text-slate-500 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                              <Calendar size={14} className="text-teal-500" />
                              {new Date(app.appointment_date).toLocaleDateString(undefined, { month: 'long', day: 'numeric' })}
                            </div>
                            <div className="flex items-center gap-2 text-xs font-bold text-slate-500 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                              <Clock size={14} className="text-teal-500" />
                              {new Date(app.appointment_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        <div className="text-right hidden sm:block">
                           <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Queue ID</div>
                           <div className="text-xl font-black text-slate-900">#{app.token_number}</div>
                        </div>
                        <Link 
                          to={`/hospitals/${app.hospital_id}`}
                          className="h-16 w-16 md:w-48 rounded-2xl bg-slate-900 hover:bg-teal-600 text-white flex items-center justify-center gap-3 transition-all active:scale-95 shadow-xl shadow-slate-900/10"
                        >
                          <span className="hidden md:block text-xs font-black uppercase tracking-widest">View Details</span>
                          <ChevronRight size={20} />
                        </Link>
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className="py-32 flex flex-col items-center justify-center bg-white rounded-[3rem] border border-dashed border-slate-200">
                    <Calendar size={64} className="text-slate-100 mb-6" />
                    <p className="text-slate-400 font-bold">No active appointments discovered.</p>
                    <Link to="/hospitals" className="mt-6 text-teal-600 font-black text-xs uppercase tracking-widest hover:underline">Book your first doctor</Link>
                  </div>
                )}
              </div>
            )}

            {activeTab === "history" && (
              <div className="bg-white rounded-[3rem] p-12 border border-slate-100 shadow-sm text-center">
                 <div className="h-24 w-24 bg-blue-50 rounded-[2rem] flex items-center justify-center text-blue-500 mx-auto mb-8 shadow-inner border border-blue-100">
                   <History size={40} />
                 </div>
                 <h3 className="text-2xl font-black text-slate-900 tracking-tight">Your Digital Health Vault</h3>
                 <p className="mt-4 text-slate-500 max-w-sm mx-auto font-medium leading-relaxed">
                   Access your lab results, prescriptions, and medical history. Your data is encrypted and secure.
                 </p>
                 <button className="mt-10 h-14 px-10 rounded-2xl bg-blue-500 text-white text-xs font-black uppercase tracking-widest shadow-xl shadow-blue-500/20 active:scale-95">
                   Request Access Logs
                 </button>
              </div>
            )}

            {activeTab === "billing" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden group">
                  <div className="absolute -top-10 -right-10 h-40 w-40 bg-white/5 rounded-full blur-3xl" />
                  <div className="relative z-10 flex flex-col h-full">
                    <div className="flex justify-between items-start mb-12">
                      <CreditCard size={32} className="text-teal-400" />
                      <div className="text-[10px] font-black uppercase tracking-widest opacity-50 italic">Digital Health Card</div>
                    </div>
                    <div className="mt-auto">
                      <div className="text-3xl font-black tracking-widest mb-2">**** **** **** 4812</div>
                      <div className="flex justify-between items-end">
                        <div>
                          <div className="text-[8px] font-black uppercase opacity-40 mb-1">Holder</div>
                          <div className="text-sm font-bold uppercase tracking-wider">{profile?.full_name || "Arun Kumar"}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-[8px] font-black uppercase opacity-40 mb-1">Balance</div>
                          <div className="text-xl font-black tracking-tight text-teal-400">₹0.00</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center">
                  <div className="h-20 w-20 bg-teal-50 rounded-full flex items-center justify-center text-teal-500 mb-6">
                    <CheckCircle2 size={32} />
                  </div>
                  <h4 className="text-xl font-black text-slate-900 mb-2">No Pending Dues</h4>
                  <p className="text-xs text-slate-400 font-medium">All your medical bills are settled. Use the history tab to view past invoices.</p>
                </div>
              </div>
            )}

            {activeTab === "reviews" && (
              <div className="grid grid-cols-1 gap-6">
                {reviews.length > 0 ? reviews.map((review) => (
                  <div key={review.id} className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-sm hover:shadow-xl transition-all group">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-4">
                         <div className="h-14 w-14 rounded-2xl bg-slate-100 overflow-hidden border border-slate-200 shadow-sm">
                            <img 
                              src={review.hospitals?.image_url || FALLBACK_HOSPITAL} 
                              alt={review.hospitals?.name} 
                              className="w-full h-full object-cover filter brightness-90 group-hover:brightness-100 transition-all"
                            />
                         </div>
                         <div>
                            <h4 className="font-black text-slate-900 group-hover:text-teal-600 transition-colors">{review.hospitals?.name}</h4>
                            <div className="flex items-center gap-2 mt-1">
                              <Star size={12} className="fill-amber-500 text-amber-500" />
                              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{review.overall_rating} / 5 Rating</span>
                            </div>
                         </div>
                      </div>
                      <div className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">{new Date(review.created_at).toLocaleDateString()}</div>
                    </div>
                    <p className="mt-8 text-slate-500 leading-relaxed font-italic border-l-4 border-teal-50 pl-6 py-1 italic">
                      &quot;{review.review_text}&quot;
                    </p>
                    <div className="mt-8 pt-8 border-t border-slate-50 flex justify-end gap-6 text-[10px] font-black uppercase tracking-widest text-slate-400">
                      <button className="hover:text-teal-600">Edit Review</button>
                      <button className="hover:text-rose-500">Delete Permanently</button>
                    </div>
                  </div>
                )) : (
                  <div className="py-32 flex flex-col items-center justify-center bg-white rounded-[3rem] border border-dashed border-slate-200">
                    <MessageSquare size={64} className="text-slate-100 mb-6" />
                    <p className="text-slate-400 font-bold">You haven&apos;t shared your experience yet.</p>
                  </div>
                )}
              </div>
            )}
            
            {activeTab === "bookmarks" && (
               <div className="py-40 text-center">
                  <Bookmark size={80} className="mx-auto text-slate-100 mb-8" />
                  <h3 className="text-2xl font-black text-slate-900 mb-4">Clinic Collection</h3>
                  <p className="text-slate-400 font-medium max-w-xs mx-auto">Save your preferred clinics and doctors for quick access later.</p>
                  <Link to="/hospitals" className="mt-8 inline-flex h-14 items-center bg-white border border-slate-200 px-10 rounded-2xl text-xs font-black uppercase tracking-widest text-slate-900 hover:bg-slate-50 transition-all active:scale-95">Discover New</Link>
               </div>
            )}
          </div>
        </main>
      </div>
      
      {/* Dynamic Health Stats Banner */}
      {activeTab === "overview" && (
        <div className="container mx-auto px-6 pb-24">
           <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                { label: "Heart Rate", value: "72", unit: "BPM", icon: Activity, color: "text-rose-500 bg-rose-50" },
                { label: "Blood Glucose", value: "98", unit: "mg/dL", icon: Stethoscope, color: "text-blue-500 bg-blue-50" },
                { label: "Vitals Pulse", value: "99%", unit: "Avg", icon: ShieldCheck, color: "text-teal-500 bg-teal-50" },
                { label: "Reports Sync", value: "03", unit: "Ready", icon: History, color: "text-amber-500 bg-amber-50" },
              ].map((stat, i) => (
                <div key={i} className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm flex items-center justify-between group hover:border-teal-500 transition-all">
                   <div>
                      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-black text-slate-900 tracking-tighter">{stat.value}</span>
                        <span className="text-xs font-bold text-slate-400 italic">{stat.unit}</span>
                      </div>
                   </div>
                   <div className={cn("h-14 w-14 rounded-2xl flex items-center justify-center transition-transform group-hover:rotate-12", stat.color)}>
                      <stat.icon size={24} />
                   </div>
                </div>
              ))}
           </div>
        </div>
      )}
    </div>
  );
}
