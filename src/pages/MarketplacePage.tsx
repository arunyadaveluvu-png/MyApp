import { useEffect, useState } from "react";
import { Search, ShoppingCart, Star, Package, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/Toast";

export default function MarketplacePage() {
  const [equipment, setEquipment] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    
    const [eRes, pRes] = await Promise.all([
      supabase.from("equipment").select("*"),
      session ? supabase.from("management_profiles").select("*").eq("id", session.user.id).single() : Promise.resolve({ data: null })
    ]);
    
    if (eRes.data) setEquipment(eRes.data);
    if (pRes.data) setProfile(pRes.data);
    setIsLoading(false);
  };

  const handleBuy = async (item: any) => {
    if (!profile) {
      showToast("Please login as Management to purchase equipment.", "error");
      return;
    }

    if (profile.budget < item.price) {
      showToast("Insufficient budget for this purchase.", "error");
      return;
    }

    setIsLoading(true);
    try {
      // 1. Deduct budget
      const { error: pError } = await supabase
        .from("management_profiles")
        .update({ budget: profile.budget - item.price })
        .eq("id", profile.id);

      if (pError) throw pError;

      // 2. Add to hospital inventory
      // Check if item already exists
      const { data: existing } = await supabase
        .from("hospital_inventory")
        .select("*")
        .eq("hospital_id", profile.hospital_id)
        .eq("equipment_id", item.id)
        .single();

      if (existing) {
        await supabase
          .from("hospital_inventory")
          .update({ quantity: existing.quantity + 1 })
          .eq("id", existing.id);
      } else {
        await supabase
          .from("hospital_inventory")
          .insert({
            hospital_id: profile.hospital_id,
            equipment_id: item.id,
            quantity: 1,
            acquisition_date: new Date().toISOString()
          });
      }

      showToast(`Successfully purchased ${item.name}!`, "success");
      fetchData(); // Refresh budget and data
    } catch (err: any) {
      showToast(err.message || "Purchase failed.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const categories = ["All", ...Array.from(new Set(equipment.map(item => item.category)))];

  const filteredItems = equipment.filter(item => 
    (selectedCategory === "All" || item.category === selectedCategory) &&
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="bg-slate-50 min-h-screen pb-24">
      {/* Header */}
      <section className="bg-slate-900 py-20 text-white overflow-hidden relative">
        <div className="absolute inset-0 bg-medical-pattern opacity-5" />
        <div className="container relative mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div>
              <h1 className="text-4xl font-black tracking-tight sm:text-5xl">Equipment Marketplace</h1>
              <p className="mt-4 max-w-2xl text-lg text-slate-400 font-medium">
                Sourcing premium diagnostic and therapeutic systems for your healthcare facility.
              </p>
            </div>
            {profile && (
              <div className="px-8 py-4 rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 flex items-center gap-4 animate-in fade-in slide-in-from-right duration-700">
                 <div className="h-12 w-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                   <ShoppingCart size={24} />
                 </div>
                 <div>
                   <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Facility Budget</div>
                   <div className="text-2xl font-black text-white leading-none mt-1">₹{profile.budget.toLocaleString()}</div>
                 </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Toolbar */}
      <div className="container mx-auto px-4 -translate-y-10 group">
        <div className="flex flex-col gap-6 rounded-3xl bg-white p-8 shadow-2xl shadow-slate-200/60 md:flex-row md:items-center border border-slate-100">
          <div className="relative flex-grow">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Search medical devices by name or category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-14 w-full rounded-2xl border border-slate-100 bg-slate-50 pl-12 pr-4 text-sm font-bold transition-all focus:border-primary-500 focus:outline-none focus:ring-4 focus:ring-primary-500/10"
            />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  "whitespace-nowrap rounded-xl px-6 py-3 text-xs font-black transition-all",
                  selectedCategory === cat 
                    ? "bg-slate-900 text-white shadow-xl shadow-slate-900/20 ring-1 ring-slate-900" 
                    : "bg-slate-50 text-slate-500 hover:bg-slate-100 border border-transparent hover:border-slate-200"
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Product Grid */}
      <main className="container mx-auto px-4">
        {isLoading && !equipment.length ? (
          <div className="flex flex-col items-center justify-center py-32 text-primary-600">
            <Loader2 className="animate-spin mb-4" size={64} strokeWidth={1} />
            <p className="text-slate-400 font-black tracking-widest uppercase text-xs">Syncing Medical Network...</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-3">
              {filteredItems.map((item) => (
                <div key={item.id} className="group flex flex-col overflow-hidden rounded-[2.5rem] bg-white shadow-sm ring-1 ring-slate-100 transition-all hover:shadow-[0_32px_64px_-12px_rgba(0,0,0,0.08)] hover:-translate-y-2">
                  <div className="relative aspect-[16/10] w-full bg-slate-50 p-16 flex items-center justify-center transition-transform duration-700 group-hover:scale-105">
                    <div className="absolute top-6 left-6 rounded-xl bg-white shadow-sm px-3 py-1.5 text-[10px] font-black text-slate-500 border border-slate-100 uppercase tracking-widest">
                      {item.category}
                    </div>
                    <div className="relative">
                      <div className="h-32 w-32 rounded-[3.5rem] bg-primary-50 flex items-center justify-center text-primary-600 relative z-10 animate-in zoom-in duration-1000">
                        <Package size={64} strokeWidth={1} />
                      </div>
                      <div className="absolute -bottom-4 -right-4 h-24 w-24 bg-primary-400/20 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    </div>
                  </div>

                  <div className="flex flex-col flex-grow p-10">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-xl font-black text-slate-900 leading-tight group-hover:text-primary-600 transition-colors uppercase tracking-tight">{item.name}</h3>
                        <p className="text-xs font-bold text-slate-400 mt-2 uppercase tracking-widest">By {item.supplier}</p>
                      </div>
                      <div className="flex items-center gap-1.5 font-black text-amber-500 text-sm bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-100">
                        <Star size={16} className="fill-amber-500" />
                        {Number(item.rating || 0).toFixed(1)}
                      </div>
                    </div>
                    
                    <p className="mt-8 text-sm font-medium leading-relaxed text-slate-500 line-clamp-3">
                      {item.description}
                    </p>

                    <div className="mt-auto pt-10 flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Market Value</span>
                        <span className="text-3xl font-black text-slate-900 tracking-tighter mt-1">₹{item.price.toLocaleString()}</span>
                      </div>
                      <button 
                        onClick={() => handleBuy(item)}
                        disabled={isLoading}
                        className={cn(
                          "flex h-16 px-6 items-center justify-center rounded-[1.5rem] text-white transition-all active:scale-95 disabled:opacity-50 gap-3 group/btn shadow-xl",
                          profile?.budget >= item.price
                           ? "bg-slate-900 hover:bg-primary-600 hover:shadow-primary-500/40"
                           : "bg-slate-400 cursor-not-allowed"
                        )}
                      >
                        {isLoading ? <Loader2 className="animate-spin" size={24} /> : <ShoppingCart size={24} />}
                        <span className="font-black text-sm uppercase tracking-widest">Buy</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {filteredItems.length === 0 && (
              <div className="mt-24 py-20 text-center rounded-[3rem] border-4 border-dashed border-slate-100">
                <div className="mx-auto flex h-32 w-32 items-center justify-center rounded-[2.5rem] bg-slate-50 text-slate-200">
                  <Package size={64} strokeWidth={1} />
                </div>
                <h3 className="mt-10 text-2xl font-black text-slate-900 tracking-tight">Discovery Limit Reached</h3>
                <p className="mt-2 text-slate-500 font-medium">We couldn't find any devices matching your query in the current network.</p>
                <button onClick={() => { setSearch(""); setSelectedCategory("All"); }} className="mt-8 text-primary-600 font-black text-xs uppercase tracking-widest hover:underline">Reset Inventory Search</button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
