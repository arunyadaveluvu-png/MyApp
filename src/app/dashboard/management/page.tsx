"use client";

import { useEffect, useState } from "react";
import { 
  Building, Users, Activity, Star, Bed, Stethoscope, ChevronRight, 
  Settings, Bell, Search, Plus, Filter, Calendar, MessageSquare,
  ClipboardList, Package, Wallet, Clock, CheckCircle2, ShieldCheck,
  AlertCircle, Loader2, ArrowRight, ExternalLink, Mail, Phone, Globe, MapPin
} from "lucide-react";
import Link from "next/link";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Cell, PieChart, Pie
} from "recharts";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/Toast";
import { useRouter } from "next/navigation";

const reviewCategories = [
  { key: "equipment_quality", label: "Equipment" },
  { key: "treatment_quality", label: "Treatment" },
  { key: "staff_behavior", label: "Staff" },
  { key: "cleanliness", label: "Cleanliness" },
  { key: "waiting_time", label: "Waiting" },
];

export default function ManagementDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [profile, setProfile] = useState<any>(null);
  const [hospital, setHospital] = useState<any>(null);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Hospital Settings States
  const [hospitalForm, setHospitalForm] = useState<any>({
    name: "",
    location: "",
    address: "",
    phone: "",
    email: "",
    website: "",
    description: "",
    image_url: "",
    beds: 0,
    doctors: 0
  });

  // Staff Modal States
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [currentStaff, setCurrentStaff] = useState<any>({
    full_name: "",
    role: "Doctor",
    speciality: "",
    email: "",
    phone: "",
    image_url: ""
  });

  const { showToast, hideToast } = useToast();
  const router = useRouter();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push("/auth");
      return;
    }

    const role = session.user.user_metadata?.role || "user";
    if (role !== "management") {
      showToast("Access Denied: Management privileges required.", "error");
      router.push(`/dashboard/${role}`);
      return;
    }

    // 1. Fetch Management Profile (with budget and hospital_id)
    const { data: prof } = await supabase
      .from("management_profiles")
      .select("*")
      .eq("id", session.user.id)
      .single();
    
    if (prof) {
      setProfile(prof);

      // 2. Fetch linked Hospital details
      if (prof.hospital_id) {
        const [hRes, aRes, rRes, iRes, sRes] = await Promise.all([
          supabase.from("hospitals").select("*").eq("id", prof.hospital_id).single(),
          supabase.from("appointments").select("*, user_profiles(full_name)").eq("hospital_id", prof.hospital_id).order("appointment_date", { ascending: false }),
          supabase.from("reviews").select("*, user_profiles(full_name)").eq("hospital_id", prof.hospital_id).order("created_at", { ascending: false }),
          supabase.from("hospital_inventory").select("*, equipment(*)").eq("hospital_id", prof.hospital_id),
          supabase.from("hospital_staff").select("*").eq("hospital_id", prof.hospital_id)
        ]);

        if (hRes.data) {
          setHospital(hRes.data);
          setHospitalForm(hRes.data);
        }
        if (aRes.data) setAppointments(aRes.data);
        if (rRes.data) setReviews(rRes.data);
        if (iRes.data) setInventory(iRes.data);
        if (sRes.data) setStaff(sRes.data);
      }
    }

    setIsLoading(false);
  };

  const updateHospital = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const toastId = showToast("Updating facility profile...", "loading");

    try {
      const { error } = await supabase
        .from("hospitals")
        .update(hospitalForm)
        .eq("id", hospital.id);

      if (error) throw error;
      setHospital(hospitalForm);
      showToast("Facility profile updated successfully!", "success");
    } catch (err: any) {
      showToast(err.message || "Failed to update profile.", "error");
    } finally {
      setIsSaving(false);
      hideToast(toastId);
    }
  };

  const handleStaffAction = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const toastId = showToast(currentStaff.id ? "Updating staff record..." : "Adding to clinical roster...", "loading");

    try {
      if (currentStaff.id) {
        const { error } = await supabase
          .from("hospital_staff")
          .update(currentStaff)
          .eq("id", currentStaff.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("hospital_staff")
          .insert([{ ...currentStaff, hospital_id: hospital.id }]);
        if (error) throw error;
      }

      // Refresh staff
      const { data } = await supabase.from("hospital_staff").select("*").eq("hospital_id", hospital.id);
      if (data) setStaff(data);
      
      setShowStaffModal(false);
      setCurrentStaff({ full_name: "", role: "Doctor", speciality: "", email: "", phone: "", image_url: "" });
      showToast("Clinical roster updated!", "success");
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setIsSaving(false);
      hideToast(toastId);
    }
  };

  const removeStaff = async (sid: string) => {
    if (!confirm("Remove this member from the facility roster?")) return;
    const toastId = showToast("Removing staff member...", "loading");
    
    try {
      const { error } = await supabase.from("hospital_staff").delete().eq("id", sid);
      if (error) throw error;
      setStaff(staff.filter(s => s.id !== sid));
      showToast("Staff member removed.", "success");
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      hideToast(toastId);
    }
  };

  const getPerformanceData = () => {
    if (reviews.length === 0) return [
      { name: "Equipment", value: 0 },
      { name: "Treatment", value: 0 },
      { name: "Staff", value: 0 },
      { name: "Cleanliness", value: 0 },
      { name: "Waiting", value: 0 },
    ];

    const sums = reviews.reduce((acc, r) => ({
      equipment: acc.equipment + Number(r.equipment_quality || 0),
      treatment: acc.treatment + Number(r.treatment_quality || 0),
      staff: acc.staff + Number(r.staff_behavior || 0),
      cleanliness: acc.cleanliness + Number(r.cleanliness || 0),
      waiting: acc.waiting + Number(r.waiting_time || 0),
    }), { equipment: 0, treatment: 0, staff: 0, cleanliness: 0, waiting: 0 });

    return [
      { name: "Equipment", value: Number((sums.equipment / reviews.length).toFixed(1)) },
      { name: "Treatment", value: Number((sums.treatment / reviews.length).toFixed(1)) },
      { name: "Staff", value: Number((sums.staff / reviews.length).toFixed(1)) },
      { name: "Cleanliness", value: Number((sums.cleanliness / reviews.length).toFixed(1)) },
      { name: "Waiting", value: Number((sums.waiting / reviews.length).toFixed(1)) },
    ];
  };

  const performanceData = getPerformanceData();

  const hospitalStats = [
    { label: "Active Budget", value: `₹${profile?.budget?.toLocaleString() || "0"}`, icon: Activity, sub: "Available Fund", color: "text-emerald-600 bg-emerald-50" },
    { label: "Inventory", value: inventory.length.toString(), icon: ClipboardList, sub: "Medical Units", color: "text-blue-600 bg-blue-50" },
    { label: "Appointments", value: appointments.length.toString(), icon: Calendar, sub: "Total Booked", color: "text-purple-600 bg-purple-50" },
    { label: "Avg Rating", value: reviews.length > 0 ? (reviews.reduce((acc, r) => acc + Number(r.overall_rating), 0) / reviews.length).toFixed(1) : "N/A", icon: Star, sub: "Patient Happiness", color: "text-amber-600 bg-amber-50" },
  ];  return (
    <div className="bg-slate-50 min-h-screen">
      {/* Top Banner */}
      <div className="bg-slate-900 h-64 w-full relative overflow-hidden">
        <div className="absolute inset-0 bg-medical-pattern opacity-5" />
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-slate-50 to-transparent" />
        <div className="container mx-auto px-4 pt-16 text-white relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-6">
               <div className="h-20 w-20 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center text-primary-400 shadow-2xl">
                 <Building size={40} />
               </div>
               <div>
                 <h1 className="text-3xl font-black tracking-tight">{hospital?.name || "Loading Facility..."}</h1>
                 <p className="text-slate-400 mt-1 flex items-center gap-2 font-medium">
                   <ShieldCheck size={16} className="text-emerald-400" />
                   Portal Management • {profile?.full_name || "Administrator"}
                 </p>
               </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              <div className="px-5 py-3 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 flex items-center gap-3">
                <Wallet className="text-emerald-400" size={20} />
                <div>
                   <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Available Budget</div>
                   <div className="text-lg font-black text-white">₹{profile?.budget?.toLocaleString() || "0"}</div>
                </div>
              </div>
              <button 
                onClick={() => showToast("You have 3 unread facility alerts.", "info")}
                className="h-12 w-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-white/10 transition-all active:scale-95"
              >
                <Bell size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 -translate-y-8 pb-32">
        {/* Main Stats Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {hospitalStats.map((stat, i) => (
            <div key={i} className="group rounded-3xl bg-white p-7 shadow-xl shadow-slate-200/40 border border-slate-100/50 transition-all hover:-translate-y-1 overflow-hidden relative">
              <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity">
                <stat.icon size={64} />
              </div>
              <div className="flex flex-col gap-4 relative z-10">
                <div className={cn("inline-flex h-12 w-12 items-center justify-center rounded-2xl", stat.color)}>
                  <stat.icon size={24} />
                </div>
                <div>
                  <div className="text-xs font-black text-slate-400 tracking-widest uppercase mb-1">{stat.label}</div>
                  <div className="text-3xl font-black text-slate-900">{stat.value}</div>
                  <div className="text-[11px] font-bold text-slate-500 mt-1.5 flex items-center gap-1.5">
                    <Activity size={12} className="text-primary-500" />
                    {stat.sub}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Dynamic Navigation Tabs */}
        <div className="mt-12 flex flex-wrap gap-2 mb-8 p-1.5 bg-slate-100 rounded-2xl w-fit">
           {[
             { id: "overview", label: "Overview", icon: Activity },
             { id: "appointments", label: "Appointments", icon: Calendar },
             { id: "inventory", label: "Inventory", icon: Package },
             { id: "feedback", label: "Patient Feedback", icon: MessageSquare },
             { id: "settings", label: "Facility Settings", icon: Settings }
           ].map(tab => (
             <button
               key={tab.id}
               onClick={() => setActiveTab(tab.id)}
               className={cn(
                 "flex items-center gap-2.5 px-6 py-3 rounded-xl text-sm font-black transition-all",
                 activeTab === tab.id 
                  ? "bg-white text-slate-900 shadow-lg ring-1 ring-slate-200" 
                  : "text-slate-500 hover:text-slate-800"
               )}
             >
               <tab.icon size={18} />
               {tab.label}
             </button>
           ))}
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-32 text-primary-600">
             <Loader2 className="animate-spin mb-4" size={48} />
             <p className="font-bold text-slate-400">Syncing facility data...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-10">
            {activeTab === "overview" && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Performance Chart */}
                <div className="lg:col-span-2 rounded-3xl bg-white p-10 shadow-sm ring-1 ring-slate-100">
                  <div className="mb-10 flex items-center justify-between">
                    <div>
                      <h3 className="text-2xl font-black text-slate-900 tracking-tight">Performance Analytics</h3>
                      <p className="text-slate-500 font-medium mt-1">Aggregate satisfaction scores from verified patient tokens.</p>
                    </div>
                    <Link href="/marketplace" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-900 text-white font-black text-xs hover:bg-slate-800 transition-all">
                       <Package size={16} />
                       Buy Equipment
                    </Link>
                  </div>
                  
                  <div className="h-[350px] w-full mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={performanceData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                        <XAxis type="number" domain={[0, 5]} hide />
                        <YAxis 
                          type="category" 
                          dataKey="name" 
                          width={120} 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{fill: "#64748b", fontSize: 13, fontWeight: 800}} 
                        />
                        <Tooltip 
                          cursor={{fill: '#f8fafc'}}
                          contentStyle={{borderRadius: "16px", border: "none", boxShadow: "0 25px 50px -12px rgb(0 0 0 / 0.15)"}}
                        />
                        <Bar dataKey="value" radius={[0, 12, 12, 0]} barSize={38}>
                          {performanceData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.value > 4.5 ? '#06b6d4' : entry.value > 3.5 ? '#2dd4bf' : '#fb7185'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Quick Appointments Feed */}
                <div className="rounded-3xl bg-white p-10 shadow-sm ring-1 ring-slate-100 flex flex-col">
                  <h3 className="text-xl font-black text-slate-900 mb-8 flex items-center justify-between">
                    Recent Bookings
                    <Calendar size={20} className="text-primary-600" />
                  </h3>
                  <div className="space-y-6 flex-grow">
                    {appointments.slice(0, 5).map(app => (
                      <div key={app.id} className="flex items-center justify-between group">
                        <div className="flex items-center gap-4">
                           <div className="h-11 w-11 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 font-black text-xs ring-1 ring-slate-100">
                             {app.user_profiles?.full_name?.[0] || "P"}
                           </div>
                           <div>
                             <div className="text-sm font-black text-slate-800">{app.user_profiles?.full_name || "Patient"}</div>
                             <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{new Date(app.appointment_date).toLocaleDateString()}</div>
                           </div>
                        </div>
                        <div className={cn(
                          "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest",
                          app.status === "completed" ? "bg-emerald-50 text-emerald-600" : "bg-primary-50 text-primary-600"
                        )}>
                          {app.status}
                        </div>
                      </div>
                    ))}
                    {appointments.length === 0 && (
                      <div className="flex flex-col items-center justify-center h-48 text-center text-slate-300">
                        <Calendar size={40} className="mb-4 opacity-10" />
                        <p className="text-sm font-bold mt-2">No bookings yet</p>
                      </div>
                    )}
                  </div>
                  <button 
                    onClick={() => {
                      setActiveTab("appointments");
                      showToast("Navigated to Master Schedule", "info");
                    }} 
                    className="mt-10 w-full py-4 rounded-2xl bg-slate-50 text-slate-600 font-black text-xs hover:bg-slate-100 transition-all flex items-center justify-center gap-2 active:scale-95"
                  >
                    View Master Schedule
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            )}

            {activeTab === "appointments" && (
                <div className="rounded-3xl bg-white p-10 shadow-sm ring-1 ring-slate-100">
                  <div className="flex items-center justify-between mb-10">
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">Booking Manifest</h3>
                    <div className="flex gap-3">
                       <div className="relative">
                         <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                         <input type="text" placeholder="Search patient ID..." className="h-10 pl-10 pr-4 rounded-xl bg-slate-50 text-xs font-bold border-none ring-1 ring-slate-200 focus:ring-2 focus:ring-primary-500/20" />
                       </div>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-slate-50">
                          <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Patient</th>
                          <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Token Number</th>
                          <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Appointment Date</th>
                          <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {appointments.map(app => (
                          <tr key={app.id} className="group hover:bg-slate-50/50 transition-colors">
                            <td className="py-5 font-black text-slate-800 text-sm">{app.user_profiles?.full_name}</td>
                            <td className="py-5">
                              <code className="px-2 py-1 bg-slate-100 rounded text-[10px] font-black text-primary-600">{app.token_number}</code>
                            </td>
                            <td className="py-5 text-sm font-bold text-slate-500">{new Date(app.appointment_date).toLocaleString()}</td>
                            <td className="py-5 text-right">
                               <span className={cn(
                                 "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest",
                                 app.status === "completed" ? "bg-emerald-50 text-emerald-600" : "bg-primary-50 text-primary-600"
                               )}>{app.status}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
            )}

            {activeTab === "inventory" && (
                <div className="rounded-3xl bg-white p-10 shadow-sm ring-1 ring-slate-100">
                   <div className="flex items-center justify-between mb-10">
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">Facility Inventory</h3>
                    <Link href="/marketplace" className="px-6 py-3 bg-primary-600 text-white rounded-xl font-black text-xs shadow-lg shadow-primary-500/20 hover:bg-primary-700 transition-all flex items-center gap-2">
                       <Plus size={16} /> Procure Assets
                    </Link>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {inventory.map(item => (
                      <div key={item.id} className="rounded-2xl border border-slate-100 p-6 bg-slate-50/50 hover:bg-white hover:shadow-xl transition-all group">
                         <div className="flex items-center justify-between mb-4">
                            <div className="h-12 w-12 rounded-xl bg-white flex items-center justify-center text-primary-600 shadow-sm ring-1 ring-slate-100 font-black text-lg">
                               {item.equipment?.name?.charAt(0)}
                            </div>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Qty: {item.quantity}</span>
                         </div>
                         <h4 className="font-black text-slate-800 mb-1">{item.equipment?.name}</h4>
                         <p className="text-[10px] font-bold text-slate-500 mb-6 flex items-center gap-1">
                           Acquired: {new Date(item.acquisition_date).toLocaleDateString()}
                         </p>
                         <button 
                           onClick={() => {
                             const tid = showToast(`Opening maintenance logs for ${item.equipment?.name}...`, "loading");
                             setTimeout(() => {
                               hideToast(tid);
                               showToast("Access Restricted: Maintenance logs are currently offline.", "info");
                             }, 1500);
                           }}
                           className="w-full py-3 rounded-xl bg-white text-slate-400 font-bold text-[10px] uppercase tracking-widest border border-slate-100 hover:text-primary-600 hover:border-primary-100 transition-all active:scale-95 shadow-sm"
                         >
                           Maintenance Logs
                         </button>
                      </div>
                    ))}
                    {inventory.length === 0 && (
                      <div className="col-span-full py-20 text-center text-slate-300 border-2 border-dashed border-slate-100 rounded-3xl">
                        <Package size={64} className="mx-auto mb-6 opacity-10" />
                        <h4 className="text-xl font-bold">No registered assets</h4>
                        <p className="mt-2 text-sm">Procure equipment from the marketplace to list them here.</p>
                      </div>
                    )}
                  </div>
                </div>
            )}

            {activeTab === "feedback" && (
                <div className="rounded-3xl bg-white p-10 shadow-sm ring-1 ring-slate-100">
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-10">Patient Voice</h3>
                  <div className="space-y-12">
                    {reviews.map(review => (
                      <div key={review.id} className="group relative border-b border-slate-50 pb-12 last:border-none">
                        <div className="flex items-start justify-between mb-6">
                           <div className="flex items-center gap-4">
                              <div className="h-12 w-12 rounded-2xl bg-primary-600 flex items-center justify-center text-white font-black shadow-lg">
                                 {review.user_profiles?.full_name?.[0]}
                              </div>
                              <div>
                                 <div className="text-sm font-black text-slate-800">{review.user_profiles?.full_name}</div>
                                 <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Token: {review.token_number}</div>
                              </div>
                           </div>
                           <div className="text-right">
                              <div className="flex items-center gap-1 font-black text-amber-500 text-sm justify-end">
                                 <Star size={16} className="fill-amber-500" />
                                 {Number(review.overall_rating).toFixed(1)}
                              </div>
                              <div className="text-[10px] font-bold text-slate-400 mt-1">{new Date(review.created_at).toLocaleString()}</div>
                           </div>
                        </div>
                        <p className="text-slate-600 text-sm leading-relaxed italic border-l-4 border-primary-100 pl-6 py-2 mb-6">
                          &quot;{review.review_text}&quot;
                        </p>
                        <div className="flex flex-wrap gap-3 pl-6">
                           {reviewCategories.map(cat => (
                             <div key={cat.key} className="px-3 py-1.5 bg-slate-50 rounded-lg text-[9px] font-black text-slate-500 border border-slate-100">
                               {cat.label}: <span className="text-slate-900">{review[cat.key]}/5</span>
                             </div>
                           ))}
                        </div>
                      </div>
                    ))}
                    {reviews.length === 0 && (
                      <div className="py-20 text-center text-slate-300">
                         <MessageSquare size={64} className="mx-auto mb-6 opacity-10" />
                         <p className="font-bold">No feedback yet</p>
                      </div>
                    )}
                  </div>
                </div>
            )}

            {activeTab === "settings" && (
              <div className="space-y-10">
                {/* Facility Profile Editor */}
                <div className="rounded-3xl bg-white p-10 shadow-sm ring-1 ring-slate-100">
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-8">Facility Registry</h3>
                  <form onSubmit={updateHospital} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Hospital Name</label>
                       <input 
                         type="text" 
                         value={hospitalForm.name}
                         onChange={e => setHospitalForm({...hospitalForm, name: e.target.value})}
                         className="w-full h-12 rounded-xl bg-slate-50 border border-slate-100 px-4 text-sm font-bold focus:ring-4 focus:ring-primary-500/10 outline-none"
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Location (City/Area)</label>
                       <input 
                         type="text" 
                         value={hospitalForm.location}
                         onChange={e => setHospitalForm({...hospitalForm, location: e.target.value})}
                         className="w-full h-12 rounded-xl bg-slate-50 border border-slate-100 px-4 text-sm font-bold focus:ring-4 focus:ring-primary-500/10 outline-none"
                       />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Physical Address</label>
                       <input 
                         type="text" 
                         value={hospitalForm.address}
                         onChange={e => setHospitalForm({...hospitalForm, address: e.target.value})}
                         className="w-full h-12 rounded-xl bg-slate-50 border border-slate-100 px-4 text-sm font-bold focus:ring-4 focus:ring-primary-500/10 outline-none"
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Direct Phone</label>
                       <input 
                         type="text" 
                         value={hospitalForm.phone}
                         onChange={e => setHospitalForm({...hospitalForm, phone: e.target.value})}
                         className="w-full h-12 rounded-xl bg-slate-50 border border-slate-100 px-4 text-sm font-bold focus:ring-4 focus:ring-primary-500/10 outline-none"
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Public Email</label>
                       <input 
                         type="email" 
                         value={hospitalForm.email}
                         onChange={e => setHospitalForm({...hospitalForm, email: e.target.value})}
                         className="w-full h-12 rounded-xl bg-slate-50 border border-slate-100 px-4 text-sm font-bold focus:ring-4 focus:ring-primary-500/10 outline-none"
                       />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Photo URL</label>
                       <input 
                         type="text" 
                         value={hospitalForm.image_url}
                         onChange={e => setHospitalForm({...hospitalForm, image_url: e.target.value})}
                         className="w-full h-12 rounded-xl bg-slate-50 border border-slate-100 px-4 text-sm font-bold focus:ring-4 focus:ring-primary-500/10 outline-none"
                       />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Facility Description</label>
                       <textarea 
                         value={hospitalForm.description}
                         onChange={e => setHospitalForm({...hospitalForm, description: e.target.value})}
                         className="w-full h-32 rounded-xl bg-slate-50 border border-slate-100 p-4 text-sm font-bold focus:ring-4 focus:ring-primary-500/10 outline-none resize-none"
                       />
                    </div>
                    <div className="md:col-span-2 flex justify-end pt-4">
                       <button 
                         type="submit"
                         disabled={isSaving}
                         className="px-10 py-4 bg-primary-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-primary-500/20 hover:bg-primary-700 transition-all active:scale-95 disabled:opacity-50"
                       >
                         Store Facility Payload
                       </button>
                    </div>
                  </form>
                </div>

                {/* Staff Management */}
                <div className="rounded-3xl bg-white p-10 shadow-sm ring-1 ring-slate-100">
                  <div className="flex items-center justify-between mb-10">
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">Clinical Roster</h3>
                    <button 
                      onClick={() => {
                        setCurrentStaff({ full_name: "", role: "Doctor", speciality: "", email: "", phone: "", image_url: "" });
                        setShowStaffModal(true);
                      }}
                      className="px-6 py-3 bg-slate-900 text-white rounded-xl font-black text-xs hover:bg-slate-800 transition-all flex items-center gap-2"
                    >
                      <Plus size={16} /> Enlist Member
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {staff.map(s => (
                      <div key={s.id} className="rounded-2xl border border-slate-100 p-6 bg-slate-50/10 hover:bg-white hover:shadow-xl transition-all group">
                         <div className="flex items-center gap-4 mb-4">
                            <div className="h-14 w-14 rounded-2xl bg-primary-50 overflow-hidden ring-1 ring-primary-100">
                               {s.image_url ? <img src={s.image_url} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-primary-600 font-black text-xl">{s.full_name[0]}</div>}
                            </div>
                            <div>
                               <h4 className="font-black text-slate-900">{s.full_name}</h4>
                               <p className="text-[10px] font-black text-primary-600 uppercase tracking-widest">{s.role} • {s.speciality}</p>
                            </div>
                         </div>
                         <div className="space-y-2 mb-6">
                            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 italic">
                               <Mail size={12} /> {s.email || "No email"}
                            </div>
                            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 italic">
                               <Phone size={12} /> {s.phone || "No phone"}
                            </div>
                         </div>
                         <div className="flex items-center gap-2">
                            <button 
                              onClick={() => {
                                setCurrentStaff(s);
                                setShowStaffModal(true);
                              }}
                              className="flex-1 py-2 bg-white rounded-lg text-[9px] font-black uppercase tracking-widest text-slate-400 border border-slate-100 hover:text-slate-900 hover:border-slate-300 transition-all"
                            >
                              Edit
                            </button>
                            <button 
                              onClick={() => removeStaff(s.id)}
                              className="px-3 py-2 bg-rose-50 text-rose-500 rounded-lg hover:bg-rose-100 transition-all"
                            >
                               <Users size={14} />
                            </button>
                         </div>
                      </div>
                    ))}
                    {staff.length === 0 && (
                      <div className="col-span-full py-20 text-center text-slate-300 border-2 border-dashed border-slate-100 rounded-3xl">
                        <Users size={64} className="mx-auto mb-6 opacity-10" />
                        <h4 className="text-xl font-bold">No registered staff</h4>
                        <p className="mt-2 text-sm">Enlist your medical team to build patient trust.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Staff Modal */}
      {showStaffModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-3xl bg-white p-10 shadow-2xl relative overflow-hidden animate-in zoom-in duration-300">
            <h3 className="text-2xl font-black text-slate-900 mb-8">Clinical Member Enrollment</h3>
            <form onSubmit={handleStaffAction} className="grid grid-cols-2 gap-6">
              <div className="col-span-2 space-y-2">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                 <input 
                   type="text" 
                   required
                   value={currentStaff.full_name}
                   onChange={e => setCurrentStaff({...currentStaff, full_name: e.target.value})}
                   className="w-full h-12 rounded-xl bg-slate-50 border border-slate-100 px-4 text-sm font-bold outline-none"
                 />
              </div>
              <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Role</label>
                 <select 
                   value={currentStaff.role}
                   onChange={e => setCurrentStaff({...currentStaff, role: e.target.value})}
                   className="w-full h-12 rounded-xl bg-slate-50 border border-slate-100 px-4 text-sm font-bold outline-none"
                 >
                   <option>Doctor</option>
                   <option>Surgeon</option>
                   <option>Nurse</option>
                   <option>Admin</option>
                   <option>Specialist</option>
                 </select>
              </div>
              <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Speciality</label>
                 <input 
                   type="text" 
                   placeholder="e.g. Cardiology"
                   value={currentStaff.speciality}
                   onChange={e => setCurrentStaff({...currentStaff, speciality: e.target.value})}
                   className="w-full h-12 rounded-xl bg-slate-50 border border-slate-100 px-4 text-sm font-bold outline-none"
                 />
              </div>
              <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email</label>
                 <input 
                   type="email" 
                   value={currentStaff.email}
                   onChange={e => setCurrentStaff({...currentStaff, email: e.target.value})}
                   className="w-full h-12 rounded-xl bg-slate-50 border border-slate-100 px-4 text-sm font-bold outline-none"
                 />
              </div>
              <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Phone</label>
                 <input 
                   type="text" 
                   value={currentStaff.phone}
                   onChange={e => setCurrentStaff({...currentStaff, phone: e.target.value})}
                   className="w-full h-12 rounded-xl bg-slate-50 border border-slate-100 px-4 text-sm font-bold outline-none"
                 />
              </div>
              <div className="col-span-2 space-y-2">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Staff Image URL</label>
                 <input 
                   type="text" 
                   value={currentStaff.image_url}
                   onChange={e => setCurrentStaff({...currentStaff, image_url: e.target.value})}
                   className="w-full h-12 rounded-xl bg-slate-50 border border-slate-100 px-4 text-sm font-bold outline-none"
                 />
              </div>
              <div className="col-span-2 flex gap-4 mt-6">
                 <button 
                   type="button"
                   onClick={() => setShowStaffModal(false)}
                   className="flex-1 py-4 rounded-2xl border border-slate-100 text-slate-400 font-bold hover:bg-slate-50 transition-all"
                 >
                   Cancel
                 </button>
                 <button 
                   type="submit"
                   disabled={isSaving}
                   className="flex-1 py-4 bg-primary-600 text-white rounded-2xl font-black text-sm shadow-lg shadow-primary-500/20 hover:bg-primary-700 transition-all disabled:opacity-50"
                 >
                   {isSaving ? "Syncing..." : "Provision Staff"}
                 </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
