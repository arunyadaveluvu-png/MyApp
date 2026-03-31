"use client";

import { useEffect, useState } from "react";
import { 
  User, Mail, Calendar, Star, MessageSquare, Clock, MapPin, 
  Settings, LogOut, ChevronRight, Bookmark, ShieldCheck, History, Hospital,
  Ticket, CheckCircle2, ArrowRight
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/Toast";

export default function UserDashboard() {
  const [activeTab, setActiveTab] = useState("reviews");
  const [profile, setProfile] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { showToast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push("/auth");
      return;
    }

    const role = user.user_metadata?.role || "user";
    if (role !== "user") {
      router.push(`/dashboard/${role}`);
      return;
    }

    // Fetch from the NEW user_profiles table
    const { data: prof } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("id", user.id)
      .single();
    
    setProfile(prof);

    // Fetch user reviews with hospital names
    const { data: revs } = await supabase
      .from("reviews")
      .select(`
        *,
        hospitals (name)
      `)
      .eq("user_id", user.id);

    if (revs) setReviews(revs);

    // Fetch user appointments
    const { data: apps } = await supabase
      .from("appointments")
      .select("*, hospitals(name)")
      .eq("user_id", user.id)
      .order("appointment_date", { ascending: false });

    if (apps) setAppointments(apps);
    setIsLoading(false);
  };

  const handleLogout = async () => {
    showToast("Signing out...", "loading");
    await supabase.auth.signOut();
    showToast("Signed out successfully", "success");
    router.push("/");
  };

  return (
    <div className="bg-slate-50 min-h-screen pb-24">
      {/* Profile Header */}
      <section className="bg-white border-b pt-12 pb-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="relative group">
              <div className="h-28 w-28 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 ring-4 ring-primary-50 transition-all group-hover:scale-105">
                <User size={56} strokeWidth={1.5} />
              </div>
              <div className="absolute bottom-1 right-1 h-8 w-8 rounded-full bg-emerald-500 border-4 border-white flex items-center justify-center text-white">
                <ShieldCheck size={14} />
              </div>
            </div>
            
            <div className="flex-grow text-center md:text-left">
              <h1 className="text-3xl font-black tracking-tight text-slate-900 leading-tight">
                {profile?.full_name || "Arun Kumar"}
              </h1>
              <div className="mt-2 flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm font-medium text-slate-500">
                <div className="flex items-center gap-1.5">
                  <Mail size={16} />
                  {profile?.email || "arun@example.com"}
                </div>
                <div className="flex items-center gap-1.5 text-emerald-600 font-bold">
                  <Star size={16} className="fill-emerald-600" />
                  Premium Patient
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar size={16} />
                  Joined March 2026
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button className="rounded-xl border border-slate-200 p-2.5 text-slate-400 hover:bg-slate-50 transition-all">
                <Settings size={20} />
              </button>
              <button className="rounded-xl bg-slate-900 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-slate-900/20 active:scale-95 transition-all">
                Edit Profile
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="container mx-auto px-4 mt-12 grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Sidebar Nav */}
        <aside className="lg:col-span-1 space-y-2">
          {[
            { id: "appointments", label: "My Appointments", icon: Calendar },
            { id: "reviews", label: "My Reviews", icon: MessageSquare },
            { id: "bookmarks", label: "Saved Hospitals", icon: Bookmark },
            { id: "history", label: "Medical History", icon: History },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={cn(
                "flex w-full items-center gap-3 rounded-xl px-4 py-3.5 text-sm font-bold transition-all",
                activeTab === item.id 
                  ? "bg-primary-600 text-white shadow-lg shadow-primary-500/20" 
                  : "text-slate-500 hover:bg-white hover:text-primary-600 ring-1 ring-transparent hover:ring-slate-100"
              )}
            >
              <item.icon size={18} />
              {item.label}
            </button>
          ))}
          <div className="pt-8 mt-8 border-t border-slate-200">
            <button 
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3.5 text-sm font-bold text-rose-500 hover:bg-rose-50 transition-all active:scale-95"
            >
              <LogOut size={18} />
              Logout
            </button>
          </div>
        </aside>

        {/* Content Area */}
        <main className="lg:col-span-3 space-y-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-black text-slate-900 tracking-tight capitalize">{activeTab.replace("-", " ")}</h2>
            <button className="text-xs font-bold text-primary-600 hover:underline">View All</button>
          </div>

          {activeTab === "appointments" && (
            <div className="grid grid-cols-1 gap-6">
              {appointments.length > 0 ? appointments.map((app) => (
                <div key={app.id} className="group rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-100 transition-all hover:shadow-xl hover:ring-primary-500/30 overflow-hidden relative">
                   <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                     <Calendar size={64} />
                   </div>
                   <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                      <div className="flex items-center gap-6">
                         <div className="h-16 w-16 rounded-2xl bg-primary-50 flex items-center justify-center text-primary-600 border border-primary-100 shadow-inner">
                            <Hospital size={32} />
                         </div>
                         <div>
                            <div className="text-[10px] font-black text-primary-600 uppercase tracking-[0.2em] mb-1">Medical Booking</div>
                            <h3 className="text-xl font-black text-slate-900 tracking-tight">{app.hospitals?.name}</h3>
                            <div className="mt-2 flex items-center gap-3 text-xs font-bold text-slate-400">
                               <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-100">
                                 <Calendar size={12} className="text-slate-500" />
                                 {new Date(app.appointment_date).toLocaleDateString()}
                               </div>
                               <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-100">
                                 <Clock size={12} className="text-slate-500" />
                                 {new Date(app.appointment_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                               </div>
                            </div>
                         </div>
                      </div>

                      <div className="flex flex-col items-start md:items-end gap-3">
                         <div className="flex items-center gap-2 px-4 py-2 bg-slate-900 rounded-2xl shadow-lg">
                            <Ticket size={18} className="text-primary-400" />
                            <code className="text-sm font-black text-white tracking-widest">{app.token_number}</code>
                         </div>
                         <div className={cn(
                           "flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ring-1",
                           app.status === 'completed' ? "bg-emerald-50 text-emerald-600 ring-emerald-600/20" :
                           app.status === 'confirmed' ? "bg-blue-50 text-blue-600 ring-blue-600/20" :
                           "bg-primary-50 text-primary-600 ring-primary-600/20"
                         )}>
                           {app.status === 'completed' && <CheckCircle2 size={12} />}
                           {app.status}
                         </div>
                      </div>
                   </div>
                   
                   <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
                      <p className="text-[10px] font-bold text-slate-400 max-w-sm uppercase tracking-wider">
                         {app.status === 'pending' ? "Waiting for facility confirmation. Your token will be valid once confirmed." : 
                          app.status === 'completed' ? "Session finished. You can now use your token to leave a review." :
                          "Please reach the facility 15 minutes before your time slot."}
                      </p>
                      {app.status === 'completed' && (
                        <Link 
                          href={`/hospitals/${app.hospital_id}`}
                          className="flex items-center gap-2 text-xs font-black text-primary-600 hover:text-primary-700 transition-colors uppercase tracking-widest"
                        >
                          Submit Review
                          <ChevronRight size={14} />
                        </Link>
                      )}
                   </div>
                </div>
              )) : (
                <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-200">
                  <Calendar size={48} className="mx-auto text-slate-200 mb-4" />
                  <p className="text-sm font-black text-slate-400">No scheduled appointments found.</p>
                  <Link href="/hospitals" className="mt-4 inline-flex items-center gap-2 text-xs font-black text-primary-600 uppercase tracking-widest hover:underline">
                    Find a Facility
                    <ChevronRight size={14} className="rotate-90" />
                  </Link>
                </div>
              )}
            </div>
          )}

          {activeTab === "reviews" && (
            <div className="grid grid-cols-1 gap-6">
              {reviews.length > 0 ? reviews.map((review) => (
                <div key={review.id} className="group rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100 transition-all hover:shadow-xl hover:ring-primary-500/30">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-14 w-14 rounded-xl bg-slate-50 flex items-center justify-center text-primary-600 border border-slate-100">
                        <Hospital size={28} />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 group-hover:text-primary-600 transition-colors uppercase tracking-tight text-sm">
                          {review.hospitals?.name}
                        </h3>
                        <div className="mt-1 flex items-center gap-2 text-xs font-bold text-slate-400">
                          <Calendar size={12} />
                          {new Date(review.created_at).toLocaleDateString()}
                          <span className="mx-1">•</span>
                          <span className="text-emerald-500 font-black">Verified</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 rounded-lg bg-amber-50 px-2.5 py-1 text-sm font-black text-amber-600">
                      <Star size={14} className="fill-amber-600" />
                      {review.overall_rating}
                    </div>
                  </div>
                  
                  <p className="mt-5 text-sm leading-relaxed text-slate-600 italic">
                    &quot;{review.review_text}&quot;
                  </p>
                  
                  <div className="mt-6 flex items-center gap-4 pt-5 border-t border-slate-50">
                    <button className="text-xs font-bold text-slate-400 hover:text-primary-600 transition-colors uppercase tracking-widest">Edit Review</button>
                    <button className="text-xs font-bold text-slate-400 hover:text-rose-500 transition-colors uppercase tracking-widest">Delete</button>
                  </div>
                </div>
              )) : (
                <div className="text-center py-12 bg-white rounded-3xl border-2 border-dashed border-slate-200">
                  <MessageSquare size={32} className="mx-auto text-slate-300" />
                  <p className="mt-4 text-sm font-bold text-slate-500">You haven&apos;t written any reviews yet.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === "bookmarks" && (
            <div className="flex flex-col items-center justify-center h-64 bg-slate-100/50 rounded-3xl border-2 border-dashed border-slate-200">
              <div className="bg-white p-4 rounded-full shadow-sm text-slate-300">
                <Bookmark size={40} />
              </div>
              <p className="mt-4 text-sm font-bold text-slate-400">No saved hospitals yet.</p>
              <Link href="/hospitals" className="mt-4 text-xs font-black text-primary-600 uppercase tracking-widest hover:underline">Find your first hospital</Link>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
