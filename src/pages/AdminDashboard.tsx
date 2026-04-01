import { useEffect, useState } from "react";
import { 
  Users, Hospital, Package, DollarSign, TrendingUp, ArrowUpRight, ArrowDownRight, 
  Plus, MoreHorizontal, Search, LayoutGrid, List, FileDown, Trash2, Edit3, Check, X
} from "lucide-react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, Cell, PieChart, Pie
} from "recharts";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/Toast";
import { useNavigate } from "react-router-dom";

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
  { name: "ICU", value: 400 },
  { name: "Surgery", value: 300 },
  { name: "Diagnostics", value: 300 },
  { name: "General", value: 200 },
];

const COLORS = ["#0ea5e9", "#0d9488", "#f43f5e", "#8b5cf6"];

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [counts, setCounts] = useState({ users: 0, hospitals: 0, equipment: 0, revenue: 0 });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Modals & Forms
  const [isAddAdminOpen, setIsAddAdminOpen] = useState(false);
  const [isAddEquipmentOpen, setIsAddEquipmentOpen] = useState(false);
  const [editStockId, setEditStockId] = useState<string | null>(null);
  const [tempStockValue, setTempStockValue] = useState<string>("");
  const [newAdmin, setNewAdmin] = useState({ name: "", email: "" });
  const [newEquipment, setNewEquipment] = useState({ 
    name: "", category: "Emergency", price: "", stock: "0", supplier: "", description: "", image_url: "" 
  });

  const { showToast, hideToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchStats();
    fetchInventory();
  }, []);

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    const tid = showToast("Provisioning new administrator...", "loading");
    setTimeout(() => {
      hideToast(tid);
      showToast(`Administrator invitation sent to ${newAdmin.email}`, "success");
      setIsAddAdminOpen(false);
      setNewAdmin({ name: "", email: "" });
    }, 1500);
  };

  const handleAddEquipment = async (e: React.FormEvent) => {
    e.preventDefault();
    const toastId = showToast("Commencing equipment registration...", "loading");
    
    try {
      const { error } = await supabase.from("equipment").insert([{
        ...newEquipment,
        price: parseFloat(newEquipment.price),
        stock: parseInt(newEquipment.stock) || 0,
        rating: 4.5
      }]);

      if (error) throw error;

      hideToast(toastId);
      showToast(`${newEquipment.name} successfully cataloged in the network.`, "success");
      setIsAddEquipmentOpen(false);
      setNewEquipment({ name: "", category: "Emergency", price: "", stock: "0", supplier: "", description: "", image_url: "" });
      fetchInventory();
      fetchStats();
    } catch (err: any) {
      hideToast(toastId);
      showToast(err.message, "error");
    }
  };

  const handleUpdateStock = async (id: string, name: string) => {
    const newStock = parseInt(tempStockValue);
    if (isNaN(newStock)) {
      showToast("Invalid stock quantity.", "error");
      return;
    }

    const toastId = showToast(`Updating inventory for ${name}...`, "loading");
    try {
      const { error } = await supabase.from("equipment").update({ stock: newStock }).eq("id", id);
      if (error) throw error;
      hideToast(toastId);
      showToast(`${name} stock level updated to ${newStock}.`, "success");
      setEditStockId(null);
      fetchInventory();
    } catch (err: any) {
      hideToast(toastId);
      showToast(err.message, "error");
    }
  };

  const handleDeleteEquipment = async (id: string, name: string) => {
    if (!confirm(`Are you certain you want to decommission ${name} from the active inventory?`)) return;
    
    const toastId = showToast("Initiating decommissioning protocol...", "loading");
    try {
      const { error } = await supabase.from("equipment").delete().eq("id", id);
      if (error) throw error;
      hideToast(toastId);
      showToast(`${name} removed from the ecosystem.`, "success");
      fetchInventory();
      fetchStats();
    } catch (err: any) {
      hideToast(toastId);
      showToast(err.message, "error");
    }
  };

  const downloadSalesReport = () => {
    const tid = showToast("Compiling sales ledger...", "loading");
    
    if (recentOrders.length === 0) {
      hideToast(tid);
      showToast("No transaction data available for export.", "error");
      return;
    }

    const headers = ["Order ID", "Hospital", "Equipment", "Category", "Acquisition Price", "Status", "Date"];
    const rows = recentOrders.map(order => [
      order.id,
      order.hospitals?.name,
      order.equipment?.name,
      order.equipment?.category,
      order.equipment?.price,
      order.status,
      new Date(order.acquisition_date).toLocaleDateString()
    ]);

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `medico-crew-sales-report-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    hideToast(tid);
    showToast("Platform report generated successfully.", "success");
  };

  const fetchInventory = async () => {
    const { data } = await supabase.from("equipment").select("*").order("created_at", { ascending: false });
    if (data) setInventory(data);
  };

  const fetchStats = async () => {
    setIsLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }

    const role = user.user_metadata?.role || "user";
    if (role !== "admin") {
      showToast("Access Denied: Admin privileges required.", "error");
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
    const totalRev = inventoryData.reduce((acc, item: any) => acc + (item.equipment?.price || 0), 0) * 10;

    setCounts({
      users: uRes.count || 0,
      hospitals: hRes.count || 0,
      equipment: eRes.count || 0,
      revenue: totalRev
    });

    setRecentOrders(inventoryData);
    setIsLoading(false);
  };

  const stats = [
    { label: "Total Users", value: counts.users.toLocaleString(), icon: Users, trend: "+12%", up: true, color: "bg-blue-50 text-blue-600" },
    { label: "Partner Hospitals", value: counts.hospitals.toLocaleString(), icon: Hospital, trend: "+5%", up: true, color: "bg-teal-50 text-teal-600" },
    { label: "Equipments", value: counts.equipment.toLocaleString(), icon: Package, trend: "-2%", up: false, color: "bg-purple-50 text-purple-600" },
    { label: "Platform Revenue", value: `₹${(counts.revenue / 1000).toLocaleString()}K`, icon: DollarSign, trend: "+18%", up: true, color: "bg-emerald-50 text-emerald-600" },
  ];

  return (
    <div className="bg-slate-50 min-h-screen p-4 md:p-8 lg:p-12">
      <div className="container mx-auto">
        
        {/* Navigation Tabs */}
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center border-b border-slate-200">
          <div className="flex items-center gap-2">
            {(["overview", "inventory", "staff"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "px-6 py-4 text-sm font-black transition-all capitalize relative",
                  activeTab === tab
                    ? "text-primary-600"
                    : "text-slate-400 hover:text-slate-600"
                )}
              >
                {tab}
                {activeTab === tab && (
                  <div className="absolute bottom-0 left-0 h-1 w-full bg-primary-600 rounded-t-full shadow-lg shadow-primary-500/40" />
                )}
              </button>
            ))}
          </div>
          
          <div className="flex items-center gap-3 pb-2 md:pb-0">
            <button
              onClick={downloadSalesReport}
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-bold text-slate-600 shadow-sm hover:bg-slate-50 transition-all active:scale-95"
            >
              <FileDown size={16} />
              Export Sales
            </button>
            <button 
              onClick={() => setIsAddEquipmentOpen(true)}
              className="flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-slate-900/20 hover:bg-slate-800 transition-all active:scale-95"
            >
              <Plus size={16} />
              New Asset
            </button>
          </div>
        </div>

        {activeTab === "overview" && (
          <header className="mb-10">
            <div className="flex items-center gap-2 text-sm font-bold text-primary-600">
              <TrendingUp size={16} />
              Executive Summary
            </div>
            <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">Admin Console</h1>
            <p className="mt-1 text-slate-500">Real-time platform performance and transaction tracking.</p>
          </header>
        )}

        {activeTab === "overview" ? (
          <>
        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, i) => (
            <div key={i} className="group relative overflow-hidden rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100 transition-all hover:shadow-xl hover:-translate-y-1">
              <div className="flex items-start justify-between">
                <div className={cn("rounded-xl p-3", stat.color)}>
                  <stat.icon size={24} />
                </div>
                <div className={cn(
                  "flex items-center gap-1 text-xs font-bold",
                  stat.up ? "text-emerald-600" : "text-rose-600"
                )}>
                  {stat.up ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                  {stat.trend}
                </div>
              </div>
              <div className="mt-4">
                <div className="text-sm font-bold text-slate-500 uppercase tracking-tighter">{stat.label}</div>
                <div className="text-2xl font-black text-slate-900 tracking-tight">{stat.value}</div>
              </div>
              <div className="absolute bottom-0 left-0 h-1 w-full bg-slate-50 transition-all group-hover:bg-primary-500" />
            </div>
          ))}
        </div>

        {/* Charts & Analytics */}
        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
          
          {/* Main Sales Chart */}
          <div className="lg:col-span-2 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">Revenue Performance</h3>
              <select className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-600 focus:outline-none focus:ring-2 focus:ring-primary-500/20">
                <option>Last 7 Months</option>
                <option>Last Year</option>
              </select>
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={salesData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: "#94a3b8", fontSize: 12}}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: "#94a3b8", fontSize: 12}}
                  />
                  <Tooltip 
                    contentStyle={{borderRadius: "12px", border: "none", boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)"}}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#0ea5e9" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Category Distribution */}
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
            <h3 className="mb-6 text-lg font-bold text-slate-900">Sales by Category</h3>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 space-y-3">
              {categoryData.map((cat, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full" style={{backgroundColor: COLORS[i]}} />
                    <span className="text-sm font-medium text-slate-500">{cat.name}</span>
                  </div>
                  <span className="text-sm font-bold text-slate-900">{cat.value} Orders</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Orders Table */}
        <div className="mt-8 rounded-2xl bg-white shadow-sm ring-1 ring-slate-100 overflow-hidden">
          <div className="flex items-center justify-between bg-slate-50/50 p-6 border-b">
            <h3 className="text-lg font-bold text-slate-900">Recent Equipment Orders</h3>
            <div className="flex items-center gap-2">
              <div className="flex rounded-lg border border-slate-200 bg-white p-1">
                <button 
                  onClick={() => setView("grid")}
                  className={cn("p-1.5 rounded", view === "grid" ? "bg-slate-100 text-slate-900" : "text-slate-400")}
                >
                  <LayoutGrid size={16} />
                </button>
                <button 
                  onClick={() => setView("list")}
                  className={cn("p-1.5 rounded", view === "list" ? "bg-slate-100 text-slate-900" : "text-slate-400")}
                >
                  <List size={16} />
                </button>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b bg-slate-50/20 text-xs font-bold uppercase tracking-wider text-slate-400">
                  <th className="px-6 py-4">Hospital</th>
                  <th className="px-6 py-4">Equipment</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Total</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {recentOrders.map((order) => (
                  <tr key={order.id} className="group hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-900">{order.hospitals?.name}</td>
                    <td className="px-6 py-4 text-slate-600">{order.equipment?.name}</td>
                    <td className="px-6 py-4 text-slate-500">{new Date(order.acquisition_date).toLocaleDateString()}</td>
                    <td className="px-6 py-4 font-black text-slate-900">₹{order.equipment?.price?.toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-600 ring-1 ring-emerald-600/20">
                        Success
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => showToast(`Opening audit for Order #${order.id.substring(0, 8)}`, "info")}
                        className="text-slate-400 hover:text-primary-600 transition-colors active:scale-90"
                      >
                        <MoreHorizontal size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
                {recentOrders.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-20 text-center text-slate-400 font-bold">
                      No recent transactions detected in the network.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="bg-slate-50/50 p-4 border-t text-center">
            <button 
              onClick={() => showToast("Loading full ledger...", "loading")}
              className="text-sm font-bold text-primary-600 hover:text-primary-700 active:scale-95 transition-all"
            >
              View All Transactions
            </button>
          </div>
        </div>
        </>
        ) : activeTab === "inventory" ? (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
              <div>
                <h2 className="text-3xl font-black text-slate-900 tracking-tight">Inventory Management</h2>
                <p className="text-slate-500 mt-1">Catalog and manage medical equipment across the platform.</p>
              </div>
            </div>

            <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-100 overflow-hidden">
              <div className="p-6 border-b border-slate-50 flex items-center justify-between">
                <div className="relative w-full max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input 
                    type="text" 
                    placeholder="Search equipment catalog..." 
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                  />
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50/50 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-4">Equipment</th>
                      <th className="px-6 py-4">Category</th>
                      <th className="px-6 py-4">Supplier</th>
                      <th className="px-6 py-4 text-center">Stock</th>
                      <th className="px-6 py-4">Price</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {inventory.map((item) => (
                      <tr key={item.id} className="group hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            {item.image_url ? (
                              <img src={item.image_url} alt={item.name} className="h-10 w-10 rounded-lg object-cover ring-1 ring-slate-200" />
                            ) : (
                              <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400">
                                <Package size={20} />
                              </div>
                            )}
                            <p className="font-bold text-slate-900">{item.name}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-md">{item.category}</span>
                        </td>
                        <td className="px-6 py-4 text-xs font-medium text-slate-600">{item.supplier}</td>
                        <td className="px-6 py-4 text-center">
                          {editStockId === item.id ? (
                            <div className="flex items-center justify-center gap-1 animate-in zoom-in-95 duration-200">
                              <input 
                                type="number" 
                                autoFocus
                                value={tempStockValue}
                                onChange={(e) => setTempStockValue(e.target.value)}
                                className="w-16 h-8 rounded-lg bg-white border border-primary-300 text-center text-xs font-bold focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
                              />
                              <button onClick={() => handleUpdateStock(item.id, item.name)} className="p-1 text-emerald-600 hover:bg-emerald-50 rounded-md transition-all">
                                <Check size={14} />
                              </button>
                              <button onClick={() => setEditStockId(null)} className="p-1 text-rose-600 hover:bg-rose-50 rounded-md transition-all">
                                <X size={14} />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center gap-2 group/stock">
                              <span className={cn(
                                "text-sm font-black px-2 py-0.5 rounded-full transition-all",
                                item.stock <= 5 ? "bg-rose-50 text-rose-600 ring-1 ring-rose-600/20" : "text-slate-900"
                              )}>
                                {item.stock || 0}
                              </span>
                              <button 
                                onClick={() => {
                                  setEditStockId(item.id);
                                  setTempStockValue(String(item.stock || 0));
                                }}
                                className="opacity-0 group-hover/stock:opacity-100 p-1 text-slate-400 hover:text-primary-600 transition-all active:scale-90"
                              >
                                <Edit3 size={14} />
                              </button>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 font-black text-slate-900">₹{item.price?.toLocaleString()}</td>
                        <td className="px-6 py-4 text-right">
                          <button onClick={() => handleDeleteEquipment(item.id, item.name)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all">
                            <Trash2 size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {inventory.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-20 text-center text-slate-400 font-bold">
                          The equipment catalog is currently empty.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
              <div>
                <h2 className="text-3xl font-black text-slate-900 tracking-tight">Staff Management</h2>
                <p className="text-slate-500 mt-1">Manage administrative access and platform controllers.</p>
              </div>
              <button 
                onClick={() => setIsAddAdminOpen(true)}
                className="flex items-center gap-2 rounded-xl bg-primary-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-primary-600/20 hover:bg-primary-700 transition-all active:scale-95"
              >
                <Plus size={18} />
                Add Administrator
              </button>
            </div>
            <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-100 overflow-hidden">
              <div className="p-6 border-b border-slate-50 flex items-center justify-between">
                <h3 className="font-bold text-slate-900">Current Administrators</h3>
                <span className="bg-primary-50 text-primary-600 text-[10px] font-black uppercase px-2 py-1 rounded-full">Total: 1 Active</span>
              </div>
              <table className="w-full text-left">
                <thead className="bg-slate-50/50 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Name</th>
                    <th className="px-6 py-4">Role</th>
                    <th className="px-6 py-4">Access Level</th>
                    <th className="px-6 py-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  <tr className="group hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-black">A</div>
                        <div>
                          <p className="font-bold text-slate-900 leading-none">Arun Kumar</p>
                          <p className="text-xs text-slate-400 mt-1">aruneluvu@gmail.com</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4"><span className="text-xs font-bold text-slate-600 capitalize">System Admin</span></td>
                    <td className="px-6 py-4"><span className="text-xs font-bold text-emerald-600">Full Authorization</span></td>
                    <td className="px-6 py-4 text-right"><span className="bg-emerald-50 text-emerald-600 text-[10px] font-bold px-2 py-1 rounded-full ring-1 ring-emerald-600/20">Active Now</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Modals */}
        {isAddAdminOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 animate-in zoom-in-95 duration-300">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">Add Administrator</h3>
                <button onClick={() => setIsAddAdminOpen(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                  <Plus className="rotate-45 text-slate-400" size={20} />
                </button>
              </div>
              <form onSubmit={handleAddAdmin} className="space-y-5">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">Full Name</label>
                  <input type="text" required value={newAdmin.name} onChange={(e) => setNewAdmin({ ...newAdmin, name: e.target.value })} placeholder="Jane Smith" className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium focus:border-primary-500 focus:outline-none focus:ring-4 focus:ring-primary-500/10 transition-all" />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">Email Address</label>
                  <input type="email" required value={newAdmin.email} onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })} placeholder="jane@medicocrew.com" className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium focus:border-primary-500 focus:outline-none focus:ring-4 focus:ring-primary-500/10 transition-all" />
                </div>
                <button type="submit" className="w-full h-12 bg-slate-900 text-white rounded-xl font-bold shadow-xl shadow-slate-900/20 hover:bg-slate-800 transition-all">Send Invitation</button>
              </form>
            </div>
          </div>
        )}

        {isAddEquipmentOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl p-8 animate-in zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight">Register New Asset</h3>
                  <p className="text-slate-500 text-sm mt-1">Onboard medical equipment to the platform catalog.</p>
                </div>
                <button onClick={() => setIsAddEquipmentOpen(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                  <Plus className="rotate-45 text-slate-400" size={24} />
                </button>
              </div>
              <form onSubmit={handleAddEquipment} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="col-span-full">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">Equipment Name</label>
                  <input type="text" required value={newEquipment.name} onChange={(e) => setNewEquipment({ ...newEquipment, name: e.target.value })} placeholder="e.g. MRI Scanner Pro V4" className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium focus:border-primary-500 focus:outline-none focus:ring-4 focus:ring-primary-500/10 transition-all" />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">Category</label>
                  <select value={newEquipment.category} onChange={(e) => setNewEquipment({ ...newEquipment, category: e.target.value })} className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-black text-slate-700 focus:border-primary-500 focus:outline-none transition-all">
                    <option>Diagnostics</option><option>Surgery</option><option>Emergency</option><option>ICU</option><option>General</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">Price (₹)</label>
                  <input type="number" required value={newEquipment.price} onChange={(e) => setNewEquipment({ ...newEquipment, price: e.target.value })} placeholder="500000" className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium focus:border-primary-500 focus:outline-none transition-all" />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">Initial Stock</label>
                  <input type="number" required value={newEquipment.stock} onChange={(e) => setNewEquipment({ ...newEquipment, stock: e.target.value })} placeholder="10" className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium focus:border-primary-500 focus:outline-none transition-all" />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">Supplier</label>
                  <input type="text" required value={newEquipment.supplier} onChange={(e) => setNewEquipment({ ...newEquipment, supplier: e.target.value })} placeholder="MedTech Global" className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium focus:border-primary-500 focus:outline-none transition-all" />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">Image URL</label>
                  <input type="url" value={newEquipment.image_url} onChange={(e) => setNewEquipment({ ...newEquipment, image_url: e.target.value })} placeholder="https://images.unsplash.com/..." className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium focus:border-primary-500 focus:outline-none transition-all" />
                </div>
                <div className="col-span-full">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">Description</label>
                  <textarea rows={3} value={newEquipment.description} onChange={(e) => setNewEquipment({ ...newEquipment, description: e.target.value })} placeholder="Provide technical specifications and usage details..." className="w-full rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm font-medium focus:border-primary-500 focus:outline-none transition-all" />
                </div>
                <button type="submit" className="col-span-full h-14 bg-slate-900 text-white rounded-xl font-black shadow-xl shadow-slate-900/20 hover:bg-slate-800 transition-all text-lg">Register Asset</button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
