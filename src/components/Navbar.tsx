import { Link, useNavigate } from "react-router-dom";
import { 
  Hospital, LayoutDashboard, LogIn, LogOut, Menu, Search, X, 
  Bell
} from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/Toast";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [role, setRole] = useState<string | null>(null);
  const navigate = useNavigate();
  const { showToast } = useToast();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) setRole(session.user.user_metadata?.role || "user");
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) setRole(session.user.user_metadata?.role || "user");
    });

    return () => {
      subscription.unsubscribe();
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const handleLogout = async () => {
    showToast("Terminating session...", "loading");
    await supabase.auth.signOut();
    showToast("Session terminated successfully", "success");
    setIsOpen(false);
    navigate("/");
  };

  const navLinks = [
    { name: "Platform", href: "/" },
    { name: "Hospitals", href: "/hospitals" },
    { name: "Global Network", href: "/about" },
  ];

  if (role === "management" || role === "admin") {
    navLinks.push({ name: "Marketplace", href: "/marketplace" });
  }

  const dashboardHref = role === "admin" 
    ? "/dashboard/admin" 
    : role === "management" 
      ? "/dashboard/management" 
      : "/dashboard/user";


  return (
    <nav className={cn(
      "sticky top-0 z-[100] w-full transition-all duration-500",
      scrolled 
        ? "h-20 bg-white/80 backdrop-blur-2xl border-b border-slate-200/50 shadow-xl shadow-slate-900/5" 
        : "h-24 bg-transparent border-b border-transparent"
    )}>
      <div className="container mx-auto h-full flex items-center justify-between px-6 lg:px-10">
        
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-4 group">
          <div className="h-12 w-12 bg-indigo-600 rounded-[1rem] flex items-center justify-center text-white shadow-2xl shadow-indigo-600/30 group-hover:scale-110 transition-all duration-500 transform group-hover:rotate-6">
            <Hospital size={28} />
          </div>
          <div className="flex flex-col">
            <span className="text-2xl font-black tracking-tighter text-slate-900 leading-none italic">MedicoCrew</span>
            <span className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em] mt-1">Unified Command</span>
          </div>
        </Link>

        {/* Global Navigation - Desktop */}
        <div className="hidden lg:flex items-center gap-10">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              to={link.href}
              className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500 hover:text-indigo-600 transition-all relative group py-2"
            >
              {link.name}
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-indigo-500 transition-all group-hover:w-full rounded-full" />
            </Link>
          ))}
        </div>

        {/* Action Center - Desktop */}
        <div className="hidden lg:flex items-center gap-6">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={16} />
            <input
              type="text"
              placeholder="Query facilities..."
              className="h-12 w-64 rounded-2xl bg-slate-50 border border-slate-200 pl-12 pr-4 text-xs font-bold text-slate-900 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none placeholder:text-slate-400 placeholder:italic"
            />
          </div>
          
          {session ? (
            <div className="flex items-center gap-4">
              <button className="h-12 w-12 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-500 hover:text-indigo-600 hover:bg-white transition-all">
                 <Bell size={20} />
              </button>
              <Link
                to={dashboardHref}
                className="h-12 px-8 rounded-2xl bg-slate-900 text-[11px] font-black uppercase tracking-[0.2em] text-white shadow-xl shadow-slate-900/20 hover:bg-indigo-600 hover:shadow-indigo-600/30 transition-all active:scale-95 flex items-center gap-3"
              >
                <LayoutDashboard size={18} /> Dashboard
              </Link>
              <button
                onClick={handleLogout}
                className="h-12 w-12 rounded-2xl border border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all active:scale-95 flex items-center justify-center"
              >
                <LogOut size={20} />
              </button>
            </div>
          ) : (
            <Link
              to="/auth"
              className="h-12 px-10 rounded-2xl bg-indigo-600 text-[11px] font-black uppercase tracking-[0.2em] text-white shadow-xl shadow-indigo-600/30 hover:bg-indigo-500 hover:shadow-indigo-600/40 transition-all active:scale-95 flex items-center gap-3"
            >
              <LogIn size={18} /> Portal Access
            </Link>
          )}
        </div>

        {/* Mobile Command Toggle */}
        <button
          className="lg:hidden h-12 w-12 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-900 transition-all active:scale-90"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Command Center */}
      {isOpen && (
        <div className="absolute top-0 left-0 w-full h-screen bg-white z-[200] p-10 animate-in fade-in slide-in-from-top duration-500">
           <div className="flex items-center justify-between mb-20">
              <Link to="/" onClick={() => setIsOpen(false)} className="flex items-center gap-4">
                 <div className="h-12 w-12 bg-indigo-600 rounded-[1rem] flex items-center justify-center text-white">
                    <Hospital size={28} />
                 </div>
                 <span className="text-2xl font-black italic tracking-tighter">MedicoCrew</span>
              </Link>
              <button onClick={() => setIsOpen(false)} className="h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center">
                 <X size={24} />
              </button>
           </div>

           <div className="space-y-8">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.href}
                  className="block text-4xl font-black tracking-tighter text-slate-900 border-b border-slate-100 pb-6 hover:text-indigo-600 transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  {link.name}
                </Link>
              ))}
              
              <div className="pt-10 space-y-6">
                 {session ? (
                   <>
                      <Link
                        to={dashboardHref}
                        className="w-full h-16 rounded-[1.5rem] bg-indigo-600 text-white font-black uppercase tracking-widest flex items-center justify-center gap-3 shadow-2xl shadow-indigo-600/20"
                        onClick={() => setIsOpen(false)}
                      >
                         <LayoutDashboard size={20} /> Access Dashboard
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="w-full h-16 rounded-[1.5rem] border-2 border-rose-100 text-rose-600 font-black uppercase tracking-widest flex items-center justify-center gap-3"
                      >
                         <LogOut size={20} /> Terminate Session
                      </button>
                   </>
                 ) : (
                   <Link
                     to="/auth"
                     className="w-full h-16 rounded-[1.5rem] bg-indigo-600 text-white font-black uppercase tracking-widest flex items-center justify-center gap-3 shadow-2xl shadow-indigo-600/20"
                     onClick={() => setIsOpen(false)}
                   >
                     <LogIn size={20} /> Enterprise Login
                   </Link>
                 )}
              </div>
           </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
