import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Activity, ShieldCheck, Stethoscope, Users, Star, MapPin } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

export default function HomePage() {
  const [featuredHospitals, setFeaturedHospitals] = useState<any[]>([]);
  const [session, setSession] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const [{ data: hospitals }, { data: { session: authSession } }] = await Promise.all([
        supabase.from("hospitals").select("*").limit(3),
        supabase.auth.getSession()
      ]);
      
      if (hospitals) setFeaturedHospitals(hospitals);
      setSession(authSession);
      setIsLoading(false);
    }
    fetchData();
  }, []);

  const featuredStats = [
    { label: "Partner Hospitals", value: "250+", icon: Activity },
    { label: "Verified Reviews", value: "50k+", icon: ShieldCheck },
    { label: "Equipments sold", value: "10k+", icon: Stethoscope },
    { label: "Satisfied Users", value: "1M+", icon: Users },
  ];

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-white py-24 lg:py-32">
        <div className="absolute inset-0 bg-medical-pattern opacity-5" />
        <div className="container relative mx-auto px-4">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-sm font-black text-emerald-600 shadow-sm border border-emerald-100">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
              </span>
              Now trusted by 250+ Premier Hospitals
            </div>
            <h1 className="mt-8 text-4xl font-black tracking-tighter text-slate-900 sm:text-7xl lg:text-8xl leading-[0.95]">
              Find Your <br />
              <span className="text-primary-600">Perfect Care.</span>
            </h1>
            <p className="mt-8 max-w-xl text-lg font-medium leading-relaxed text-slate-500">
              Discover verified hospitals, browse state-of-the-art facilities, and join the network for a transparent healthcare experience.
            </p>
            <div className="mt-12 flex flex-col items-center gap-6 sm:flex-row">
              <Link
                to="/hospitals"
                className="flex h-16 items-center gap-3 rounded-2xl bg-slate-900 px-10 text-lg font-black text-white shadow-2xl shadow-slate-900/20 transition-all hover:bg-primary-600 hover:shadow-primary-500/40 active:scale-95"
              >
                Find a Hospital
                <ArrowRight size={24} />
              </Link>
              {!session && (
                <Link
                  to="/auth"
                  className="flex h-16 items-center gap-2 rounded-2xl border-2 border-slate-100 bg-white px-10 text-lg font-black text-slate-900 transition-all hover:border-primary-100 hover:bg-slate-50 active:scale-95"
                >
                  Join MedicoCrew
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Video Showcase Section */}
      <section className="bg-white pb-16 md:pb-24">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="relative group">
              {/* Decorative Background Elements */}
              <div className="absolute -inset-2 md:-inset-4 bg-gradient-to-tr from-primary-500/10 to-emerald-500/10 rounded-3xl md:rounded-[3rem] blur-2xl opacity-50 group-hover:opacity-100 transition-opacity duration-700" />
              
              {/* Premium Video Container */}
              <div className="relative aspect-video w-full rounded-2xl md:rounded-[2.5rem] bg-slate-900 overflow-hidden shadow-2xl border border-slate-100 ring-1 ring-slate-900/5 transition-transform duration-700 group-hover:scale-[1.01]">
                <iframe
                  src="https://drive.google.com/file/d/1y_tXW_mxESqcdWHzjVNUOluTjoLpeOQ_/preview"
                  className="absolute inset-0 w-full h-full border-none"
                  allow="autoplay"
                  title="MedicoCrew Overview Video"
                />
              </div>
              
              {/* Video Tagline */}
              <div className="mt-6 md:mt-8 flex items-center justify-center gap-3 text-[10px] md:text-xs font-black uppercase tracking-[0.2em] md:tracking-[0.3em] text-slate-400">
                <span className="hidden sm:inline h-[1px] w-8 md:w-12 bg-slate-200" />
                Experience MedicoCrew In 60 Seconds
                <span className="hidden sm:inline h-[1px] w-8 md:w-12 bg-slate-200" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-slate-50 py-16 border-y border-slate-100">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 gap-12 md:grid-cols-4">
            {featuredStats.map((stat, i) => (
              <div key={i} className="flex flex-col items-center md:items-start text-center md:text-left">
                <div className="mb-4 rounded-2xl bg-white p-4 text-primary-600 shadow-sm ring-1 ring-slate-100">
                  <stat.icon size={32} strokeWidth={1.5} />
                </div>
                <div className="text-4xl font-black text-slate-900 tracking-tighter">{stat.value}</div>
                <div className="text-xs font-black uppercase tracking-widest text-slate-400 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Hospitals Section */}
      <section className="py-24 bg-white relative">
        <div className="container mx-auto px-4">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <div className="text-xs font-black text-primary-600 uppercase tracking-widest mb-3">Top Institutions</div>
              <h2 className="text-4xl font-black tracking-tight text-slate-900">Featured Hospitals</h2>
              <p className="mt-2 text-lg text-slate-500 font-medium">Verified healthcare facilities at your service.</p>
            </div>
            <Link to="/hospitals" className="font-black text-sm uppercase tracking-widest text-slate-900 hover:text-primary-600 transition-colors flex items-center gap-2 bg-slate-50 px-6 py-3 rounded-xl border border-slate-100 shadow-sm">
              View Directory <ArrowRight size={16} />
            </Link>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-3">
            {isLoading ? (
              [1, 2, 3].map((i) => (
                <div key={i} className="h-[450px] w-full animate-pulse rounded-[2.5rem] bg-slate-50 border border-slate-100" />
              ))
            ) : (
              featuredHospitals.map((hospital) => (
                <div key={hospital.id} className="group flex flex-col overflow-hidden rounded-[2.5rem] bg-white shadow-sm ring-1 ring-slate-100 transition-all hover:shadow-[0_32px_64px_-12px_rgba(0,0,0,0.08)] hover:-translate-y-2">
                  <div className="aspect-[16/10] w-full bg-slate-100 overflow-hidden relative">
                    <div className="absolute top-6 right-6 z-20 flex items-center gap-1.5 rounded-2xl bg-white px-4 py-2 text-sm font-black text-amber-500 shadow-xl border border-amber-50">
                      <Star size={18} className="fill-amber-500" />
                      {hospital.rating || "New"}
                    </div>
                    <div className="h-full w-full bg-primary-50 flex items-center justify-center text-primary-200 font-black italic text-4xl group-hover:scale-110 transition-transform duration-1000">
                      {hospital.name.charAt(0)}
                    </div>
                  </div>
                  <div className="p-10">
                    <h3 className="text-2xl font-black text-slate-900 leading-tight group-hover:text-primary-600 transition-colors tracking-tight">{hospital.name}</h3>
                    <div className="mt-3 flex items-center gap-2 text-sm text-slate-400 font-bold uppercase tracking-widest">
                      <MapPin size={16} />
                      {hospital.location}
                    </div>
                    
                    <div className="mt-10 pt-8 border-t border-slate-50">
                      <Link 
                        to={session ? `/hospitals/${hospital.id}` : "/auth"} 
                        className={cn(
                          "flex items-center justify-center gap-2 w-full py-5 rounded-2xl font-black text-sm transition-all shadow-sm active:scale-95 group/btn",
                          session 
                            ? "bg-slate-900 text-white hover:bg-primary-600 hover:shadow-primary-600/30" 
                            : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                        )}
                      >
                        {session ? "Explore Facility" : "Login to View"}
                        <ArrowRight size={20} className="transition-transform group-hover/btn:translate-x-1" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Facility Registration Section */}
      {!session && (
        <section className="bg-slate-900 py-32 text-white overflow-hidden relative">
          <div className="absolute inset-0 bg-medical-pattern opacity-5" />
          <div className="container relative mx-auto px-4 text-center">
            <div className="mx-auto h-20 w-20 rounded-[2rem] bg-white/10 flex items-center justify-center text-white mb-10">
              <ShieldCheck size={40} />
            </div>
            <h2 className="text-4xl font-black sm:text-6xl tracking-tight leading-tight">Institutional Management?</h2>
            <p className="mx-auto mt-8 max-w-2xl text-xl text-slate-400 font-medium leading-relaxed">
              Join our network to register your facility, track real-time patient feedback, and optimize your procurement workflow.
            </p>
            <div className="mt-14">
              <Link
                to="/auth"
                className="inline-flex h-16 items-center gap-3 rounded-2xl bg-white px-12 text-lg font-black text-slate-900 hover:bg-emerald-500 hover:text-white hover:shadow-2xl hover:shadow-emerald-500/40 transition-all active:scale-95 shadow-xl shadow-white/5"
              >
                Register Your Hospital
                <ArrowRight size={24} />
              </Link>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
