"use client";

import { useEffect, useState } from "react";
import { Search, MapPin, Star, Filter, ArrowRight, Hospital, Bed, Stethoscope, Activity, Layers, Loader2, Lock } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function HospitalsPage() {
  const router = useRouter();
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [selectedService, setSelectedService] = useState("All");
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [managedHospitalId, setManagedHospitalId] = useState<string | null>(null);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUser(session.user);
        const role = session.user.user_metadata?.role || "user";
        setUserRole(role);
        
        if (role === "management") {
          const { data: profile } = await supabase
            .from("management_profiles")
            .select("hospital_id")
            .eq("id", session.user.id)
            .single();
          if (profile) setManagedHospitalId(profile.hospital_id);
        }
      }
      fetchHospitals();
    };
    checkUser();
  }, []);

  const fetchHospitals = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("hospitals")
      .select("*");
    
    if (data) setHospitals(data);
    setIsLoading(false);
  };

  const allServices = ["All", ...Array.from(new Set(hospitals.flatMap(h => h.services || [])))];

  const filteredHospitals = hospitals.filter(h => {
    const matchesSearch = h.name.toLowerCase().includes(search.toLowerCase()) || h.location.toLowerCase().includes(search.toLowerCase());
    const matchesService = selectedService === "All" || h.services?.includes(selectedService);
    
    // Management sees only their hospital
    if (userRole === "management" && managedHospitalId) {
      return h.id === managedHospitalId && matchesSearch && matchesService;
    }
    
    return matchesSearch && matchesService;
  });

  return (
    <div className="bg-slate-50 min-h-screen pb-24">
      {/* Search Header */}
      <section className="bg-primary-600 py-20 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-medical-pattern opacity-10" />
        <div className="container relative mx-auto px-4 text-center">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">Find Your Trusted Care</h1>
          <p className="mt-4 text-primary-100 max-w-2xl mx-auto italic font-medium">
            "Browse our network of verified hospitals, compare facility stats, and read real patient experiences."
          </p>
          
          <div className="mt-12 max-w-3xl mx-auto flex flex-col md:flex-row gap-4">
            <div className="relative flex-grow">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input 
                type="text" 
                placeholder="Search by hospital name or location..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-14 rounded-2xl bg-white pl-12 pr-4 text-slate-900 font-medium focus:ring-4 focus:ring-primary-500/20 outline-none transition-all"
              />
            </div>
            <button className="h-14 px-8 rounded-2xl bg-slate-900 font-bold text-white shadow-lg hover:bg-slate-800 transition-all active:scale-95 flex items-center justify-center gap-2">
              <Filter size={20} />
              Refine
            </button>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 mt-12 grid grid-cols-1 lg:grid-cols-4 gap-12">
        {/* Sidebar Filters */}
        <aside className="lg:col-span-1 space-y-8">
          <div>
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Core Services</h3>
            <div className="flex flex-col gap-2">
              {allServices.map(service => (
                <button 
                  key={service}
                  onClick={() => setSelectedService(service)}
                  className={cn(
                    "flex items-center justify-between px-4 py-3 rounded-xl font-bold transition-all text-sm",
                    selectedService === service 
                      ? "bg-white text-primary-600 shadow-md ring-1 ring-slate-100" 
                      : "text-slate-500 hover:bg-white/50"
                  )}
                >
                  {service}
                  {selectedService === service && <div className="h-1.5 w-1.5 rounded-full bg-primary-600" />}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl bg-primary-600 p-6 text-white shadow-xl shadow-primary-600/20">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white mb-4">
              <Activity size={24} />
            </div>
            <h4 className="font-bold text-lg leading-tight">Need Urgent Assistance?</h4>
            <p className="mt-2 text-primary-100 text-sm leading-relaxed italic">
              "Find nearest emergency care units with real-time bed availability tracking."
            </p>
            <button className="mt-6 w-full py-3 rounded-xl bg-white text-primary-600 font-black text-sm hover:bg-primary-50 transition-all">
              EMERGENCY ONLY
            </button>
          </div>
        </aside>

        {/* Hospital List */}
        <main className="lg:col-span-3">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              {isLoading ? "Searching..." : `${filteredHospitals.length} Result${filteredHospitals.length !== 1 ? 's' : ''} Found`}
            </h2>
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-32 text-primary-600">
              <Loader2 className="animate-spin mb-4" size={48} />
              <p className="text-slate-500 font-bold">Fetching medical facilities...</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {filteredHospitals.map(hospital => (
                  <div key={hospital.id} className="group flex flex-col rounded-3xl bg-white shadow-sm ring-1 ring-slate-200 overflow-hidden transition-all hover:shadow-2xl hover:-translate-y-2">
                    <div className="aspect-[16/10] w-full relative bg-slate-100 overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 to-transparent z-10" />
                      <div className="absolute top-4 right-4 z-20 flex items-center gap-1.5 rounded-xl bg-white/90 backdrop-blur px-3 py-1.5 text-sm font-black text-emerald-600 shadow-lg">
                        <Star size={16} className="fill-emerald-600" />
                        {hospital.rating || 0}
                      </div>
                      <div className="h-full w-full bg-primary-100 flex items-center justify-center text-primary-300 font-black italic text-2xl group-hover:scale-110 transition-transform duration-700">
                        {hospital.name.charAt(0)}
                      </div>
                    </div>

                    <div className="p-8">
                      <h3 className="text-xl font-bold text-slate-800 tracking-tight group-hover:text-primary-600 transition-colors">{hospital.name}</h3>
                      <div className="mt-2 flex items-center gap-2 text-sm text-slate-500 font-medium">
                        <MapPin size={16} />
                        {hospital.location}
                      </div>

                      <div className="mt-8 grid grid-cols-2 gap-4">
                        <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100">
                          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                            <Bed size={12} /> Beds
                          </div>
                          <div className="text-lg font-black text-slate-900">{hospital.beds || 0}</div>
                        </div>
                        <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100">
                          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                            <Stethoscope size={12} /> Doctors
                          </div>
                          <div className="text-lg font-black text-slate-900">{hospital.doctors || 0}</div>
                        </div>
                      </div>

                      <div className="mt-8 flex flex-wrap gap-2">
                        {hospital.services?.map((service: string) => (
                          <span key={service} className="px-3 py-1.5 bg-primary-100/50 text-primary-700 text-[10px] font-black uppercase tracking-widest rounded-lg">
                            {service}
                          </span>
                        ))}
                      </div>

                      <div className="mt-8 pt-6 border-t border-slate-50">
                        {user ? (
                          <Link 
                            href={`/hospitals/${hospital.id}`} 
                            className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl bg-slate-50 text-primary-600 font-black text-sm hover:bg-primary-600 hover:text-white transition-all group-active:scale-95 shadow-sm"
                          >
                            Explore Facility
                            <ArrowRight size={18} />
                          </Link>
                        ) : (
                          <Link 
                            href={`/auth?redirect=/hospitals/${hospital.id}`} 
                            className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl bg-amber-50 text-amber-700 font-black text-sm hover:bg-amber-100 transition-all group-active:scale-95 border border-amber-100/50"
                          >
                            <Lock size={16} />
                            Login to View Details
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {filteredHospitals.length === 0 && (
                <div className="mt-20 text-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-200">
                  <Search size={48} className="mx-auto text-slate-300" />
                  <h3 className="mt-6 text-xl font-bold text-slate-900">No Hospitals Found</h3>
                  <p className="mt-2 text-slate-500">Try adjusting your search filters or browse other locations.</p>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
