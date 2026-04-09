import { useEffect, useState } from "react";
import { 
  Hospital, ArrowUpRight, ArrowDownRight, 
  Plus, Search, FileDown, Filter, Trash2, Edit3,
  Shield, Globe, Database, CreditCard, Activity, Bell, Package, CheckCircle2
} from "lucide-react";
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, Cell, PieChart, Pie
} from "recharts";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/Toast";
import { useNavigate, Link } from "react-router-dom";

const FALLBACK_HOSPITAL = "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=2053";
const FALLBACK_EQUIPMENT = "https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&q=80&w=2070";

const salesData = [
  { name: "Jan", sales: 4000, revenue: 120000 },
  { name: "Feb", sales: 3000, revenue: 98000 },
  { name: "Mar", sales: 2000, revenue: 76000 },
  { name: "Apr", sales: 2780, revenue: 89000 },
  { name: "May", sales: 1890, revenue: 65000 },
  { name: "Jun", sales: 2390, revenue: 78000 },
  { name: "Jul", sales: 3490, revenue: 110000 },
];

const categoryData = [
  { name: "Diagnostics", value: 450 },
  { name: "Surgery", value: 280 },
  { name: "Emergencies", value: 390 },
  { name: "General", value: 520 },
];

const COLORS = ["#6366f1", "#8b5cf6", "#ec4899", "#f43f5e"];

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [counts, setCounts] = useState({ users: 0, hospitals: 0, equipment: 0, revenue: 0 });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  
  // Modals & Forms
  const [isAddAdminOpen, setIsAddAdminOpen] = useState(false);
  const [isAddEquipmentOpen, setIsAddEquipmentOpen] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<any>(null);
  const [allHospitals, setAllHospitals] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  
  const [newAdmin, setNewAdmin] = useState({ name: "", email: "" });
  const [newEquipment, setNewEquipment] = useState({ 
    name: "", category: "Emergency", price: "", stock: "0", supplier: "", description: "", image_url: "" 
  });

  const { showToast, hideToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchStats();
    fetchInventory();
    fetchAllNodes();
  }, []);

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    const tid = showToast("Provisioning administrative credentials...", "loading");
    setTimeout(() => {
      hideToast(tid);
      showToast(`Encrypted invitation dispatched to ${newAdmin.email}`, "success");
      setIsAddAdminOpen(false);
      setNewAdmin({ name: "", email: "" });
    }, 1500);
  };

  const handleAddEquipment = async (e: React.FormEvent) => {
    e.preventDefault();
    const isEdit = !!editingEquipment;
    const toastId = showToast(isEdit ? "Synchronizing asset updates..." : "Registering asset in global ledger...", "loading");
    
    try {
      if (isEdit) {
        const { error } = await supabase.from("equipment")
          .update({
            ...newEquipment,
            price: parseFloat(newEquipment.price),
            stock: parseInt(newEquipment.stock) || 0,
          })
          .eq("id", editingEquipment.id);
        if (error) throw error;
        showToast(`${newEquipment.name} updated successfully.`, "success");
      } else {
        const { error } = await supabase.from("equipment").insert([{
          ...newEquipment,
          price: parseFloat(newEquipment.price),
          stock: parseInt(newEquipment.stock) || 0,
          rating: 4.5
        }]);
        if (error) throw error;
        showToast(`${newEquipment.name} cataloged in the ecosystem.`, "success");
      }

      hideToast(toastId);
      setIsAddEquipmentOpen(false);
      setEditingEquipment(null);
      setNewEquipment({ name: "", category: "Emergency", price: "", stock: "0", supplier: "", description: "", image_url: "" });
      fetchInventory();
      fetchStats();
    } catch (err: any) {
      hideToast(toastId);
      showToast(err.message, "error");
    }
  };

  const decommissionEquipment = async (id: string) => {
    if (!confirm("Are you sure you want to decommission this asset? This action is permanent.")) return;
    const toastId = showToast("Decommissioning medical asset...", "loading");
    try {
      const { error } = await supabase.from("equipment").delete().eq("id", id);
      if (error) throw error;
      showToast("Asset successfully removed from global catalog.", "success");
      fetchInventory();
      fetchStats();
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      hideToast(toastId);
    }
  };

  const downloadSalesReport = () => {
    const tid = showToast("Compiling global financial ledger...", "loading");
    
    if (recentOrders.length === 0) {
      hideToast(tid);
      showToast("No transaction data detected.", "error");
      return;
    }

    const headers = ["Order ID", "Hospital", "Equipment", "Category", "Price", "Status", "Timestamp"];
    const rows = recentOrders.map(order => [
      order.id, order.hospitals?.name, order.equipment?.name, order.equipment?.category, order.equipment?.price, order.status, new Date(order.acquisition_date).toISOString()
    ]);

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `medico-global-ledger-${new Date().toISOString()}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    hideToast(tid);
    showToast("Ledger exported successfully.", "success");
  };

  const fetchInventory = async () => {
    const { data } = await supabase.from("equipment").select("*").order("created_at", { ascending: false });
    if (data) setInventory(data);
  };

  const fetchStats = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }

    const role = user.user_metadata?.role || "user";
    if (role !== "admin") {
      showToast("Access Denied: Administrative authorization required.", "error");
      navigate(`/dashboard/${role}`);
      return;
    }
    
    const [uRes, hRes, eRes, iRes] = await Promise.all([
      supabase.from("user_profiles").select("*", { count: "exact", head: true }),
      supabase.from("hospitals").select("*", { count: "exact", head: true }),
      supabase.from("equipment").select("*", { count: "exact", head: true }),
      supabase.from("hospital_inventory").select("*, equipment(price), hospitals(name)").order("acquisition_date", { ascending: false }).limit(10)
    ]);
    
    const inventoryData = iRes.data || [];
    const totalRev = inventoryData.reduce((acc, item: any) => acc + (item.equipment?.price || 0), 0) * 12.5;

    setCounts({
      users: uRes.count || 0,
      hospitals: hRes.count || 0,
      equipment: eRes.count || 0,
      revenue: totalRev
    });

    setRecentOrders(inventoryData);
  };

  const fetchAllNodes = async () => {
    const [hRes, uRes] = await Promise.all([
      supabase.from("hospitals").select("*").order("name"),
      supabase.from("user_profiles").select("*").order("full_name")
    ]);
    if (hRes.data) setAllHospitals(hRes.data);
    if (uRes.data) setAllUsers(uRes.data);
  };

  const stats = [
    { label: "Total Nodes", value: counts.users.toLocaleString(), icon: Globe, trend: "+14.2%", up: true, color: "bg-indigo-500/10 text-indigo-400" },
    { label: "Partner Facilities", value: counts.hospitals.toLocaleString(), icon: Hospital, trend: "+3.1%", up: true, color: "bg-violet-500/10 text-violet-400" },
    { label: "Global Catalog", value: counts.equipment.toLocaleString(), icon: Database, trend: "-1.2%", up: false, color: "bg-pink-500/10 text-pink-400" },
    { label: "Platform Revenue", value: `₹${(counts.revenue / 1000).toLocaleString()}K`, icon: CreditCard, trend: "+22.8%", up: true, color: "bg-emerald-500/10 text-emerald-400" },
  ];

  return (
    <div className="bg-[#05070A] min-h-screen text-slate-400 font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      
      {/* Executive Command Bar */}
      <nav className="sticky top-0 z-50 bg-[#05070A]/80 backdrop-blur-2xl border-b border-white/5 px-10 h-20 flex items-center justify-between">
        <div className="flex items-center gap-12">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="h-10 w-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-2xl shadow-indigo-600/30 group-hover:scale-110 transition-all duration-500">
              <Shield size={24} />
            </div>
            <span className="text-xl font-black tracking-tighter text-white italic">MedicoCrew</span>
          </Link>
          
          <div className="hidden lg:flex items-center gap-8 text-[10px] font-black uppercase tracking-[0.3em]">
            {["overview", "inventory", "orders", "nodes", "staff"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "transition-all hover:text-white relative py-8",
                  activeTab === tab ? "text-white" : "text-slate-500"
                )}
              >
                {tab}
                {activeTab === tab && <div className="absolute bottom-0 left-0 h-1 w-full bg-indigo-500 rounded-t-full shadow-lg shadow-indigo-500/40" />}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="hidden md:flex relative w-64 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-indigo-500 transition-colors" size={16} />
            <input 
              type="text" 
              placeholder="Query global data..." 
              className="w-full h-11 bg-white/5 border border-white/10 rounded-2xl pl-10 pr-4 text-xs font-bold text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/50 outline-none transition-all placeholder:text-slate-700 font-mono"
            />
          </div>
          <button className="h-11 w-11 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-500 hover:text-indigo-400 transition-all shadow-lg relative">
            <Bell size={18} />
            <span className="absolute top-3 right-3 h-1.5 w-1.5 bg-indigo-500 rounded-full ring-2 ring-[#05070A]" />
          </button>
          <div className="h-11 w-11 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-black">
            A
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-10 py-12 pb-32 space-y-16">
        
        {/* Header Section */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-8">
           <div>
              <div className="flex items-center gap-3 text-[10px] font-black text-indigo-400 uppercase tracking-[0.5em] mb-4">
                 <Activity size={14} />
                 Terminal Alpha-01
              </div>
              <h1 className="text-5xl font-black text-white tracking-tighter italic">Platform Overlord</h1>
              <p className="mt-3 text-slate-500 font-medium max-w-xl">
                 Real-time synchronization with global healthcare nodes. Monitoring transaction throughput and facility health across the ecosystem.
              </p>
           </div>
           <div className="flex gap-4">
              <button 
                onClick={downloadSalesReport}
                className="h-14 px-8 rounded-2xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-white hover:bg-white/10 transition-all flex items-center gap-3"
              >
                <FileDown size={18} /> Download Ledger
              </button>
              <button 
                onClick={() => setIsAddEquipmentOpen(true)}
                className="h-14 px-8 rounded-2xl bg-indigo-600 text-white text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-indigo-600/30 hover:bg-indigo-500 transition-all active:scale-95 flex items-center gap-3"
              >
                <Plus size={18} /> Register Asset
              </button>
           </div>
        </header>

        {activeTab === "overview" && (
          <div className="space-y-12 h-content animate-in fade-in slide-in-from-bottom-8 duration-1000">
             {/* Stats Grid */}
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {stats.map((stat, i) => (
                  <div key={i} className="group bg-[#0A0D12] rounded-[2.5rem] p-10 border border-white/5 shadow-2xl relative overflow-hidden transition-all hover:border-indigo-500/20 active:scale-95">
                     <div className="absolute -top-10 -right-10 h-32 w-32 bg-white/5 rounded-full blur-3xl group-hover:bg-indigo-500/5 transition-all" />
                     <div className="relative z-10">
                        <div className={cn("h-14 w-14 rounded-2xl flex items-center justify-center mb-8 shadow-inner", stat.color)}>
                           <stat.icon size={28} />
                        </div>
                        <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">{stat.label}</div>
                        <div className="flex items-end gap-3 justify-between">
                           <span className="text-4xl font-black text-white tracking-tighter">{stat.value}</span>
                           <div className={cn(
                             "text-[10px] font-black px-2 py-1 rounded-lg border flex items-center gap-1",
                             stat.up ? "bg-emerald-500/5 text-emerald-400 border-emerald-500/20" : "bg-rose-500/5 text-rose-400 border-rose-500/20"
                           )}>
                             {stat.up ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                             {stat.trend}
                           </div>
                        </div>
                     </div>
                  </div>
                ))}
             </div>

             {/* Analytics Cluster */}
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                <div className="lg:col-span-2 bg-[#0A0D12] rounded-[3rem] p-12 border border-white/5 shadow-2xl">
                   <div className="flex items-center justify-between mb-12">
                      <div>
                         <h3 className="text-2xl font-black text-white tracking-tight uppercase italic">Revenue Throughput</h3>
                         <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Real-time financial flow from global facility procurements</p>
                      </div>
                      <select className="h-10 px-4 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black text-slate-400 uppercase tracking-widest outline-none focus:border-indigo-500/50 transition-all">
                        <option>Last 30 Cycles</option>
                        <option>Last 12 Cycles</option>
                      </select>
                   </div>
                   <div className="h-[400px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                         <AreaChart data={salesData}>
                            <defs>
                               <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                               </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                            <XAxis 
                              dataKey="name" 
                              axisLine={false} 
                              tickLine={false} 
                              tick={{fill: "#64748b", fontSize: 11, fontWeight: 900}} 
                              dy={15}
                            />
                            <YAxis hide domain={[0, 150000]} />
                            <Tooltip 
                              contentStyle={{backgroundColor: "#05070A", borderRadius: "16px", border: "1px solid #1e293b", boxShadow: "0 25px 50px -12px rgb(0 0 0 / 0.8)"}}
                              itemStyle={{color: "#6366f1", fontSize: "12px", fontWeight: "900"}}
                              labelStyle={{color: "#475569", marginBottom: "8px", fontSize: "10px", fontWeight: "900", textTransform: "uppercase"}}
                            />
                            <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={4} fillOpacity={1} fill="url(#colorRev)" />
                         </AreaChart>
                      </ResponsiveContainer>
                   </div>
                </div>

                <div className="bg-[#0A0D12] rounded-[3rem] p-12 border border-white/5 shadow-2xl flex flex-col">
                   <h3 className="text-2xl font-black text-white tracking-tight uppercase italic mb-12 text-center">Load Scaling</h3>
                   <div className="h-[300px] w-full relative">
                      <ResponsiveContainer width="100%" height="100%">
                         <PieChart>
                            <Pie
                               data={categoryData}
                               cx="50%"
                               cy="50%"
                               innerRadius={80}
                               outerRadius={110}
                               paddingAngle={8}
                               dataKey="value"
                               stroke="none"
                            >
                               {categoryData.map((_entry, index) => (
                                 <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                               ))}
                            </Pie>
                            <Tooltip />
                         </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                         <div className="text-4xl font-black text-white leading-none tracking-tighter">1.6K+</div>
                         <div className="text-[8px] font-black text-slate-500 uppercase tracking-widest mt-1 italic">Total Catalog</div>
                      </div>
                   </div>
                   <div className="mt-auto space-y-4">
                      {categoryData.map((cat, i) => (
                        <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-indigo-500/20 transition-all">
                           <div className="flex items-center gap-3">
                              <div className="h-2 w-2 rounded-full" style={{backgroundColor: COLORS[i]}} />
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{cat.name}</span>
                           </div>
                           <span className="text-xs font-black text-white font-mono">{cat.value}</span>
                        </div>
                      ))}
                   </div>
                </div>
             </div>

             {/* Ledger Table Section */}
             <div className="bg-[#0A0D12] rounded-[3rem] border border-white/5 shadow-2xl overflow-hidden">
                <div className="p-12 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                   <div>
                      <h3 className="text-2xl font-black text-white tracking-tight uppercase italic">Global Acquisition Log</h3>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Audit trail for all cross-facility equipment transactions</p>
                   </div>
                   <div className="flex gap-2">
                       <button className="h-11 px-5 rounded-xl bg-slate-900 border border-slate-800 text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 hover:text-indigo-400 transition-all">
                          <Filter size={14} /> Refine Log
                       </button>
                   </div>
                </div>
                <div className="overflow-x-auto min-h-[400px]">
                   <table className="w-full text-left">
                      <thead>
                         <tr className="border-b border-white/5">
                            <th className="px-12 py-6 text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">Medical Node</th>
                            <th className="px-12 py-6 text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">Allocated Asset</th>
                            <th className="px-12 py-6 text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">Auth Date</th>
                            <th className="px-12 py-6 text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">Transaction Total</th>
                            <th className="px-12 py-6 text-right text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">Verification Status</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                         {recentOrders.map(order => (
                           <tr key={order.id} className="group hover:bg-white/[0.03] transition-colors">
                              <td className="px-12 py-6">
                                 <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 rounded-xl bg-slate-900 overflow-hidden border border-white/10 shadow-inner">
                                       <img 
                                         src={order.hospitals?.image_url || FALLBACK_HOSPITAL} 
                                         alt={order.hospitals?.name}
                                         className="w-full h-full object-cover filter brightness-90 group-hover:brightness-100 transition-all"
                                       />
                                    </div>
                                    <span className="text-sm font-black text-white">{order.hospitals?.name}</span>
                                 </div>
                              </td>
                              <td className="px-12 py-6">
                                 <div className="flex flex-col">
                                    <span className="text-xs font-bold text-slate-300">{order.equipment?.name}</span>
                                    <span className="text-[9px] font-black text-slate-600 uppercase mt-1 tracking-widest">{order.equipment?.category}</span>
                                 </div>
                              </td>
                              <td className="px-12 py-6 text-xs font-mono text-slate-500">{new Date(order.acquisition_date).toLocaleDateString()}</td>
                              <td className="px-12 py-6 text-sm font-black text-white tracking-tighter">₹{order.equipment?.price?.toLocaleString()}</td>
                              <td className="px-12 py-6 text-right">
                                 <span className="px-4 py-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/5">
                                    Finalized
                                 </span>
                              </td>
                           </tr>
                         ))}
                      </tbody>
                   </table>
                </div>
             </div>
          </div>
        )}

        {activeTab === "inventory" && (
           <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-1000">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                 {inventory.map(item => (
                   <div key={item.id} className="bg-[#0A0D12] rounded-[3rem] p-10 border border-white/5 shadow-2xl relative group overflow-hidden hover:border-indigo-500/30 transition-all">
                      <div className="absolute top-0 right-0 p-8 opacity-0 group-hover:opacity-100 transition-opacity">
                         <div className="flex gap-2">
                             <button 
                               onClick={() => {
                                 setEditingEquipment(item);
                                 setNewEquipment({
                                   name: item.name,
                                   category: item.category || "General",
                                   price: item.price.toString(),
                                   stock: item.stock.toString(),
                                   supplier: item.supplier || "",
                                   description: item.description || "",
                                   image_url: item.image_url || ""
                                 });
                                 setIsAddEquipmentOpen(true);
                               }}
                               className="h-10 w-10 rounded-xl bg-white/5 text-indigo-400 flex items-center justify-center border border-white/5 hover:bg-indigo-600 hover:text-white transition-all shadow-xl"
                             >
                                <Edit3 size={18} />
                             </button>
                             <button 
                               onClick={() => decommissionEquipment(item.id)}
                               className="h-10 w-10 rounded-xl bg-white/5 text-rose-500 flex items-center justify-center border border-white/5 hover:bg-rose-600 hover:text-white transition-all shadow-xl"
                             >
                                <Trash2 size={18} />
                             </button>
                          </div>
                      </div>

                      <div className="h-20 w-20 bg-slate-900 rounded-3xl border border-white/10 overflow-hidden shadow-inner mb-8 transform group-hover:scale-110 transition-transform duration-500">
                         <img 
                           src={item.image_url || FALLBACK_EQUIPMENT} 
                           alt={item.name}
                           className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-all"
                         />
                      </div>
                      
                      <h4 className="text-xl font-black text-white uppercase tracking-tight leading-tight">{item.name}</h4>
                      <div className="mt-2 flex items-center gap-3">
                         <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest px-3 py-1 bg-indigo-500/5 rounded-lg border border-indigo-500/10">{item.category}</span>
                         <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{item.supplier}</span>
                      </div>

                      <div className="mt-10 flex items-end justify-between border-t border-white/5 pt-8">
                         <div>
                            <div className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">Stock Level</div>
                            <div className={cn("text-4xl font-black tracking-tighter italic", item.stock <= 5 ? "text-rose-500" : "text-white")}>
                               {item.stock}
                            </div>
                         </div>
                         <div className="text-right">
                            <div className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">Unit Valuation</div>
                            <div className="text-xl font-black text-indigo-400 tracking-tight">₹{(item.price / 1000).toFixed(1)}K</div>
                         </div>
                      </div>
                   </div>
                 ))}
              </div>
           </div>
        )}

        {activeTab === "orders" && (
           <div className="bg-[#0A0D12] rounded-[3rem] border border-white/5 shadow-2xl p-12 animate-in fade-in slide-in-from-bottom-8 duration-1000">
              <div className="flex items-center justify-between mb-12">
                 <div>
                    <h3 className="text-2xl font-black text-white tracking-tight uppercase italic">Logistics Hub</h3>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Cross-referencing all facility procurement request streams</p>
                 </div>
                 <div className="flex gap-4">
                    <div className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-white/5 border border-white/10 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                       <Package size={16} className="text-indigo-500" />
                       {recentOrders.length} active streams
                    </div>
                 </div>
              </div>
              
              <div className="space-y-6">
                 {recentOrders.map(order => (
                   <div key={order.id} className="p-8 rounded-[2.5rem] bg-white/[0.02] border border-white/5 hover:border-indigo-500/20 transition-all flex flex-col md:flex-row items-center justify-between gap-8">
                      <div className="flex items-center gap-6">
                         <div className="h-20 w-20 rounded-3xl bg-slate-900 border border-white/10 overflow-hidden shadow-inner">
                            <img src={order.hospitals?.image_url || FALLBACK_HOSPITAL} className="w-full h-full object-cover" />
                         </div>
                         <div>
                            <h4 className="text-lg font-black text-white italic uppercase tracking-tight">{order.hospitals?.name}</h4>
                            <p className="text-xs font-bold text-indigo-400 mt-1">{order.equipment?.name}</p>
                            <div className="flex items-center gap-3 mt-3 text-[9px] font-black text-slate-600 uppercase tracking-widest">
                               <span>ID: #{order.id.slice(0, 8)}</span>
                               <span>•</span>
                               <span>{new Date(order.acquisition_date).toLocaleDateString()}</span>
                            </div>
                         </div>
                      </div>
                      
                      <div className="flex items-center gap-8">
                         <div className="text-center">
                            <div className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">Payload Value</div>
                            <div className="text-xl font-black text-white tracking-tighter">₹{order.equipment?.price?.toLocaleString()}</div>
                         </div>
                         <div className="h-12 w-px bg-white/5 mx-2" />
                         <div className="flex flex-col items-end gap-3">
                            <span className="px-4 py-1.5 rounded-xl bg-emerald-500/5 text-emerald-400 border border-emerald-500/20 text-[9px] font-black uppercase tracking-widest">Confirmed Receipt</span>
                            <button className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] hover:underline">Download Invoice</button>
                         </div>
                      </div>
                   </div>
                 ))}
              </div>
           </div>
        )}

        {activeTab === "nodes" && (
           <div className="bg-[#0A0D12] rounded-[3rem] border border-white/5 shadow-2xl p-12 animate-in fade-in slide-in-from-bottom-8 duration-1000">
              <div className="flex items-center justify-between mb-12">
                 <div>
                    <h3 className="text-2xl font-black text-white tracking-tight uppercase italic">Global Facility Grid</h3>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Status and verification monitor for all platform facility nodes</p>
                 </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 {allHospitals.map(hospital => (
                   <div key={hospital.id} className="p-8 rounded-[2.5rem] bg-white/[0.02] border border-white/5 hover:border-indigo-500/20 transition-all flex items-start justify-between">
                      <div className="flex items-center gap-6">
                         <div className="h-16 w-16 rounded-2xl bg-slate-900 border border-white/10 overflow-hidden">
                            <img src={hospital.image_url || FALLBACK_HOSPITAL} className="w-full h-full object-cover" />
                         </div>
                         <div>
                            <h4 className="text-lg font-black text-white uppercase tracking-tighter">{hospital.name}</h4>
                            <p className="text-xs font-bold text-slate-500 mt-1">{hospital.location}</p>
                            <div className="flex items-center gap-3 mt-4">
                               <span className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-500/5 text-emerald-400 border border-emerald-500/20 text-[8px] font-black uppercase tracking-widest">
                                  <CheckCircle2 size={10} /> Verified Facility
                               </span>
                            </div>
                         </div>
                      </div>
                      <div className="flex flex-col items-end gap-2 text-right">
                         <div className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Clinical Expert Load</div>
                         <div className="text-2xl font-black text-indigo-400">{hospital.doctors || 0} specialists</div>
                      </div>
                   </div>
                 ))}
              </div>
           </div>
        )}

        {activeTab === "staff" && (
           <div className="bg-[#0A0D12] rounded-[3rem] p-12 border border-white/5 shadow-2xl animate-in fade-in slide-in-from-bottom-8 duration-1000 min-h-[600px]">
              <div className="flex items-center justify-between mb-16">
                 <div>
                    <h3 className="text-3xl font-black text-white italic uppercase tracking-tighter leading-none">Security Roster</h3>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.4em] mt-3">Personnel with global administrative authorization</p>
                 </div>
                 <button 
                   onClick={() => setIsAddAdminOpen(true)}
                   className="h-12 px-8 rounded-2xl bg-indigo-600 text-white font-black text-[10px] uppercase tracking-widest shadow-2xl shadow-indigo-600/30 hover:bg-indigo-500 active:scale-95 transition-all flex items-center gap-2"
                 >
                    <Plus size={18} /> Provision Access
                 </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                 {allUsers.filter((u, index) => u.role === "admin" || index === 0).slice(0, 6).map((admin: any, i) => (
                   <div key={i} className="bg-white/5 rounded-[2.5rem] p-10 border border-white/5 group hover:border-indigo-500/30 transition-all text-center">
                      <div className="h-24 w-24 rounded-[2rem] bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 text-4xl font-black mx-auto mb-8 shadow-inner group-hover:scale-110 transition-transform duration-700">
                         {admin.full_name?.[0] || "A"}
                      </div>
                      <h4 className="text-xl font-black text-white tracking-tight uppercase leading-none">{admin.full_name}</h4>
                      <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mt-2">{admin.role || "Admin Node"}</p>
                      
                      <div className="mt-8 space-y-3">
                         <div className="px-6 py-3 bg-black/40 rounded-2xl border border-white/5 text-[10px] font-bold text-slate-500 italic truncate tracking-wide">{admin.id.slice(0, 15)}...</div>
                         <div className="px-6 py-2 bg-emerald-500/5 rounded-xl border border-emerald-500/20 text-[9px] font-black text-emerald-400 tracking-[0.3em] uppercase">Full Auth</div>
                      </div>
                   </div>
                 ))}
                 {allUsers.length === 0 && (
                    <div className="col-span-full py-20 text-center">
                       <Shield size={48} className="mx-auto mb-4 opacity-10" />
                       <p className="font-bold text-slate-600 uppercase tracking-widest">Scanning for administrative signatures...</p>
                    </div>
                 )}
              </div>
           </div>
        )}

      </div>

      {/* Admin Provisioning Modal */}
      {isAddAdminOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-8 bg-[#05070A]/95 backdrop-blur-3xl animate-in fade-in duration-500">
           <div className="w-full max-w-md bg-[#0A0D12] rounded-[3rem] p-12 border border-white/10 shadow-3xl animate-in zoom-in-95 duration-500">
              <div className="flex items-center justify-between mb-12">
                 <h3 className="text-3xl font-black text-white italic uppercase tracking-tighter leading-none">Access Grant</h3>
                 <button onClick={() => setIsAddAdminOpen(false)} className="h-12 w-12 rounded-2xl bg-white/5 flex items-center justify-center text-slate-400 hover:text-white transition-all transform hover:rotate-90">
                    <Plus className="rotate-45" size={24} />
                 </button>
              </div>
              <form onSubmit={handleAddAdmin} className="space-y-10">
                 <div className="space-y-4">
                    <label className="text-[9px] font-black text-slate-600 uppercase tracking-[0.5em] ml-2">Identity Signature</label>
                    <input type="text" required value={newAdmin.name} onChange={(e) => setNewAdmin({ ...newAdmin, name: e.target.value })} placeholder="Full Name" className="w-full h-16 bg-white/5 border border-white/10 rounded-2xl px-6 text-sm font-bold text-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/50 outline-none transition-all placeholder:text-slate-800" />
                 </div>
                 <div className="space-y-4">
                    <label className="text-[9px] font-black text-slate-600 uppercase tracking-[0.5em] ml-2">Neural Email</label>
                    <input type="email" required value={newAdmin.email} onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })} placeholder="email@protocol.com" className="w-full h-16 bg-white/5 border border-white/10 rounded-2xl px-6 text-sm font-bold text-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/50 outline-none transition-all placeholder:text-slate-800" />
                 </div>
                 <button className="w-full h-16 bg-indigo-600 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-[0.4em] shadow-2xl shadow-indigo-600/30 active:scale-95 transition-all">Dispatch Credentials</button>
              </form>
           </div>
        </div>
      )}

      {/* Asset Onboarding / Edit Modal */}
      {isAddEquipmentOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-8 bg-[#05070A]/95 backdrop-blur-3xl animate-in fade-in duration-500">
           <div className="w-full max-w-2xl bg-[#0A0D12] rounded-[3.5rem] p-16 border border-white/10 shadow-3xl animate-in zoom-in-95 duration-500 max-h-[90vh] overflow-y-auto custom-scrollbar">
              <div className="flex items-center justify-between mb-16">
                 <div>
                    <h3 className="text-4xl font-black text-white italic uppercase tracking-tighter leading-none">{editingEquipment ? "Modify Asset" : "Asset Onboarding"}</h3>
                    <p className="text-[9px] font-bold text-slate-600 uppercase tracking-[0.5em] mt-4">Integrate medical technology into the global node catalog</p>
                 </div>
                 <button 
                  onClick={() => {
                    setIsAddEquipmentOpen(false);
                    setEditingEquipment(null);
                  }} 
                  className="h-14 w-14 rounded-2xl bg-white/5 flex items-center justify-center text-slate-400 hover:text-white transition-all transform hover:rotate-90"
                >
                    <Plus className="rotate-45" size={28} />
                 </button>
              </div>
              <form onSubmit={handleAddEquipment} className="grid grid-cols-1 md:grid-cols-2 gap-12">
                 <div className="md:col-span-2 space-y-4">
                    <label className="text-[9px] font-black text-slate-600 uppercase tracking-[0.5em] ml-2">Technological Designation</label>
                    <input type="text" required value={newEquipment.name} onChange={(e) => setNewEquipment({ ...newEquipment, name: e.target.value })} placeholder="e.g., Quantum resonance Scanner X" className="w-full h-16 bg-white/5 border border-white/10 rounded-2xl px-8 text-sm font-bold text-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/50 outline-none transition-all placeholder:text-slate-800" />
                 </div>
                 <div className="space-y-4">
                    <label className="text-[9px] font-black text-slate-600 uppercase tracking-[0.5em] ml-2">Asset Classification</label>
                    <select value={newEquipment.category} onChange={(e) => setNewEquipment({ ...newEquipment, category: e.target.value })} className="w-full h-16 bg-white/5 border border-white/10 rounded-2xl px-8 text-sm font-bold text-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/50 outline-none transition-all appearance-none">
                       {["Emergency", "Surgery", "Diagnostics", "Wards", "Laboratory", "General"].map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                 </div>
                 <div className="space-y-4">
                    <label className="text-[9px] font-black text-slate-600 uppercase tracking-[0.5em] ml-2">Market Valuation (₹)</label>
                    <input type="number" required value={newEquipment.price} onChange={(e) => setNewEquipment({ ...newEquipment, price: e.target.value })} placeholder="Price" className="w-full h-16 bg-white/5 border border-white/10 rounded-2xl px-8 text-sm font-bold text-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/50 outline-none transition-all" />
                 </div>
                 <div className="space-y-4">
                    <label className="text-[9px] font-black text-slate-600 uppercase tracking-[0.5em] ml-2">Inventory Stock</label>
                    <input type="number" required value={newEquipment.stock} onChange={(e) => setNewEquipment({ ...newEquipment, stock: e.target.value })} placeholder="Available Units" className="w-full h-16 bg-white/5 border border-white/10 rounded-2xl px-8 text-sm font-bold text-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/50 outline-none transition-all" />
                 </div>
                 <div className="space-y-4">
                    <label className="text-[9px] font-black text-slate-600 uppercase tracking-[0.5em] ml-2">Asset Visual (URL)</label>
                    <input type="text" value={newEquipment.image_url} onChange={(e) => setNewEquipment({ ...newEquipment, image_url: e.target.value })} placeholder="https://unsplash.com/..." className="w-full h-16 bg-white/5 border border-white/10 rounded-2xl px-8 text-sm font-bold text-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/50 outline-none transition-all" />
                 </div>
                 <div className="md:col-span-2 space-y-4">
                    <label className="text-[9px] font-black text-slate-600 uppercase tracking-[0.5em] ml-2">Strategic Description</label>
                    <textarea value={newEquipment.description} onChange={(e) => setNewEquipment({ ...newEquipment, description: e.target.value })} placeholder="Detail clinical advantages..." className="w-full h-32 bg-white/5 border border-white/10 rounded-2xl px-8 py-4 text-sm font-bold text-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/50 outline-none transition-all resize-none" />
                 </div>
                 <button className="md:col-span-2 h-20 bg-indigo-600 text-white rounded-[2rem] font-black text-sm uppercase tracking-[0.4em] shadow-2xl shadow-indigo-600/40 active:scale-95 transition-all text-center">
                    {editingEquipment ? "Synchronize Updates" : "Finalize Asset Enrollment"}
                 </button>
              </form>
           </div>
        </div>
      )}

    </div>
  );
}
