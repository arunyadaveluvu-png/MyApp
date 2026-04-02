import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { 
  ArrowRight, Activity, ShieldCheck, Users, Star, MapPin, 
  Database, ChevronRight, Play
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

// Premium Image Fallbacks (Generated earlier)
const FALLBACK_HOSPITAL = "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=2053";

export default function HomePage() {
  const [featuredHospitals, setFeaturedHospitals] = useState<any[]>([]);
  const [session, setSession] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);

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
    { label: "Partner Facilities", value: "320+", icon: Activity, color: "text-indigo-400" },
    { label: "Medical Assets", value: "15k+", icon: Database, color: "text-teal-400" },
    { label: "Verified Reviews", value: "82k+", icon: Star, color: "text-pink-400" },
    { label: "Active Users", value: "2M+", icon: Users, color: "text-emerald-400" },
  ];

  return (
    <div className="flex flex-col bg-[#05070A]">
      
      {/* Premium Hero Section - Dark & Sophisticated */}
      <section className="relative min-h-screen flex items-center pt-24 overflow-hidden">
        <div className="absolute inset-0 z-0">
           <img 
             src={FALLBACK_HOSPITAL} 
             alt="Modern Medical Center" 
             className="w-full h-full object-cover opacity-20 filter grayscale hover:grayscale-0 transition-all duration-1000 scale-110"
           />
           <div className="absolute inset-0 bg-gradient-to-t from-[#05070A] via-[#05070A]/80 to-transparent" />
           <div className="absolute inset-0 bg-gradient-to-r from-[#05070A] via-transparent to-transparent" />
        </div>

        <div className="container relative z-10 mx-auto px-6 lg:px-10">
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-3 rounded-full bg-indigo-500/10 px-5 py-2.5 text-[10px] font-black text-indigo-400 shadow-2xl border border-indigo-500/20 uppercase tracking-[0.3em] mb-10 animate-in fade-in slide-in-from-left duration-1000">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-indigo-500"></span>
              </span>
              World's Premier Healthcare Command
            </div>
            
            <h1 className="text-6xl md:text-8xl lg:text-[9rem] font-black tracking-tighter text-white leading-[0.85] italic mb-10 mix-blend-difference animate-in fade-in slide-in-from-bottom-8 duration-1000">
              Precision <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-violet-500 to-pink-500">Healthcare.</span>
            </h1>

            <p className="max-w-2xl text-lg md:text-xl font-medium leading-relaxed text-slate-400 mb-12 animate-in fade-in slide-in-from-bottom duration-1000 delay-200">
              Onboarding 320+ premium medical facilities into a unified management ecosystem. Experience absolute transparency and efficiency in global healthcare.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-6 animate-in fade-in slide-in-from-bottom duration-1000 delay-300">
              <Link
                to="/hospitals"
                className="h-16 px-12 rounded-2xl bg-indigo-600 text-[11px] font-black uppercase tracking-[0.2em] text-white shadow-2xl shadow-indigo-600/30 hover:bg-indigo-500 hover:shadow-indigo-600/50 transition-all active:scale-95 flex items-center gap-3 group"
              >
                Access Network
                <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              {!session && (
                <Link
                  to="/auth"
                  className="h-16 px-12 rounded-2xl bg-white/5 border border-white/10 text-[11px] font-black uppercase tracking-[0.2em] text-white hover:bg-white/10 transition-all active:scale-95 flex items-center gap-3 backdrop-blur-xl"
                >
                  Onboard Facility
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Global Dashboard Video Showcase */}
      <section className="relative py-32 bg-[#05070A]">
        <div className="container mx-auto px-6 lg:px-10">
           <div 
             className="relative group rounded-[3rem] overflow-hidden border border-white/5 shadow-4xl aspect-video bg-[#0A0D12] animate-in fade-in zoom-in duration-1000 cursor-pointer"
             onClick={() => !isVideoPlaying && setIsVideoPlaying(true)}
           >
              <iframe
                src={`https://drive.google.com/file/d/1y_tXW_mxESqcdWHzjVNUOluTjoLpeOQ_/preview${isVideoPlaying ? '?autoplay=1' : ''}`}
                className={cn(
                  "w-full h-full border-none transition-all duration-1000",
                  isVideoPlaying ? "opacity-100 scale-100" : "opacity-40 scale-105 blur-sm contrast-125"
                )}
                allow="autoplay; fullscreen"
                title="MedicoCrew Terminal Overview"
              />
              
              {!isVideoPlaying && (
                <>
                  <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-[#05070A] via-transparent to-[#05070A]/40" />
                  <div className="absolute bottom-12 left-12 flex flex-col gap-2 pointer-events-none group-hover:translate-x-2 transition-transform duration-500">
                     <div className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.4em]">Operational Briefing</div>
                     <h2 className="text-4xl font-black text-white italic tracking-tighter uppercase leading-none">Terminal Alpha-01 Overview</h2>
                  </div>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-24 w-24 rounded-full bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 group-hover:scale-125 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500 shadow-2xl shadow-indigo-600/20">
                     <Play size={32} className="fill-current" />
                  </div>
                </>
              )}
           </div>
        </div>
      </section>

      {/* Real-time Network Metrics */}
      <section className="py-24 border-y border-white/5 relative bg-navy-light overflow-hidden">
        <div className="absolute top-0 right-0 h-[500px] w-[500px] bg-indigo-600/5 rounded-full blur-[100px]" />
        <div className="container relative z-10 mx-auto px-6 lg:px-10">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-20">
            {featuredStats.map((stat, i) => (
              <div key={i} className="flex flex-col items-center lg:items-start group">
                <div className={cn("mb-6 h-16 w-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center transition-all group-hover:scale-110 group-hover:border-indigo-500/20 shadow-inner", stat.color)}>
                  <stat.icon size={28} strokeWidth={1.5} />
                </div>
                <div className="text-5xl font-black text-white tracking-tighter tabular-nums leading-none">
                   {stat.value}
                </div>
                <div className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-600 mt-4 italic">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Medical Facilities */}
      <section className="py-32 bg-[#05070A] relative">
        <div className="container mx-auto px-6 lg:px-10">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-10 mb-24">
            <div>
              <div className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.5em] mb-4">Institutional Roster</div>
              <h2 className="text-5xl font-black tracking-tighter text-white italic leading-none">Global Network Nodes</h2>
              <p className="mt-4 text-lg text-slate-500 font-medium max-w-xl italic">
                 Explore state-of-the-art facilities already synchronized with the MedicoCrew command center.
              </p>
            </div>
            <Link to="/hospitals" className="h-14 px-8 rounded-2xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-white hover:bg-white/10 transition-all flex items-center gap-3">
              Full Directory <ArrowRight size={18} />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 lg:gap-16">
            {isLoading ? (
              [1, 2, 3].map((i) => (
                <div key={i} className="h-[500px] w-full animate-pulse rounded-[3rem] bg-navy-light border border-white/5" />
              ))
            ) : (
              featuredHospitals.map((hospital) => (
                <div key={hospital.id} className="group flex flex-col bg-navy-light rounded-[3rem] border border-white/5 overflow-hidden transition-all hover:border-indigo-500/30 hover:shadow-4xl hover:-translate-y-4">
                  <div className="aspect-[1.2/1] relative overflow-hidden">
                    <div className="absolute top-8 right-8 z-20 flex items-center gap-2 rounded-xl bg-navy/80 backdrop-blur-xl px-4 py-2 text-[10px] font-black text-amber-400 border border-amber-400/20 tracking-widest uppercase shadow-2xl">
                      <Star size={14} className="fill-amber-400" />
                      {hospital.rating || "Finalizing Audit"}
                    </div>
                    <img 
                      src={hospital.image_url || FALLBACK_HOSPITAL} 
                      alt={hospital.name} 
                      className="w-full h-full object-cover transition-all duration-1000 group-hover:scale-110 filter brightness-75 group-hover:brightness-100"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-navy-light via-transparent to-transparent opacity-80" />
                  </div>

                  <div className="p-10 flex-1 flex flex-col">
                    <div className="flex items-center gap-2 text-[9px] font-black text-indigo-500 uppercase tracking-widest mb-3">
                       <MapPin size={12} /> {hospital.location}
                    </div>
                    <h3 className="text-3xl font-black text-white italic leading-none group-hover:text-indigo-400 transition-colors uppercase tracking-tight">{hospital.name}</h3>
                    
                    <div className="mt-auto pt-10">
                      <Link 
                        to={session ? `/hospitals/${hospital.id}` : "/auth"} 
                        className={cn(
                          "flex items-center justify-center gap-3 w-full h-14 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95",
                          session 
                            ? "bg-white/5 border border-white/10 text-slate-400 hover:bg-indigo-600 hover:text-white hover:border-none" 
                            : "bg-indigo-600 text-white hover:bg-indigo-500"
                        )}
                      >
                        {session ? "Access Node Interface" : "Authorize View"}
                        <ChevronRight size={18} />
                      </Link>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Global Partnership Section */}
      <section className="py-40 bg-navy relative border-t border-white/5 overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[800px] w-[800px] bg-indigo-600/5 rounded-full blur-[150px] animate-pulse" />
          <div className="container relative z-10 mx-auto px-6 text-center">
             <div className="mx-auto h-24 w-24 rounded-[2.5rem] bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-12 shadow-inner transform rotate-12 transition-transform hover:rotate-0 duration-500">
                <ShieldCheck size={48} />
             </div>
             <h2 className="text-5xl md:text-7xl font-black text-white italic tracking-tighter leading-none mb-8">Synchronize Your Node.</h2>
             <p className="mx-auto mt-8 max-w-3xl text-xl text-slate-500 font-medium leading-relaxed italic mb-16">
                Register your institution into the MedicoCrew ecosystem. Real-time patient analytics, procurement throughput monitoring, and global synchronization.
             </p>
             <Link
                to="/auth"
                className="inline-flex h-20 px-16 rounded-[2rem] bg-indigo-600 text-[11px] font-black uppercase tracking-[0.4em] text-white shadow-3xl shadow-indigo-600/40 hover:bg-indigo-500 transition-all active:scale-95 items-center gap-4"
             >
                Initiate Onboarding <ChevronRight size={20} />
             </Link>
          </div>
      </section>

    </div>
  );
}
