import { Link, useNavigate } from "react-router-dom";
import { Hospital, LayoutDashboard, LogIn, LogOut, Menu, Search, X } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/Toast";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [role, setRole] = useState<string | null>(null);
  const navigate = useNavigate();
  const { showToast } = useToast();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) setRole(session.user.user_metadata?.role || "user");
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) setRole(session.user.user_metadata?.role || "user");
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    showToast("Signing out...", "loading");
    await supabase.auth.signOut();
    showToast("Signed out successfully", "success");
    setIsOpen(false);
    navigate("/");
  };

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "Hospitals", href: "/hospitals" },
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
    <nav className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-600 text-white transition-transform group-hover:scale-110">
            <Hospital size={24} />
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900 group-hover:text-primary-700 transition-colors">
            Medico<span className="text-primary-600">Crew</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              to={link.href}
              className="text-sm font-medium text-slate-600 hover:text-primary-600 transition-colors"
            >
              {link.name}
            </Link>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Search hospitals..."
              className="h-10 w-64 rounded-full border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all"
            />
          </div>
          
          {session ? (
            <div className="flex items-center gap-2">
              <Link
                to={dashboardHref}
                className="flex items-center gap-2 rounded-full bg-slate-900 px-6 py-2 text-sm font-medium text-white shadow-lg shadow-slate-900/10 hover:bg-slate-800 transition-all active:scale-95"
              >
                <LayoutDashboard size={18} />
                Dashboard
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center justify-center h-10 w-10 rounded-full border border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all active:scale-95"
                title="Logout"
              >
                <LogOut size={18} />
              </button>
            </div>
          ) : (
            <Link
              to="/auth"
              className="flex items-center gap-2 rounded-full bg-primary-600 px-6 py-2 text-sm font-medium text-white shadow-lg shadow-primary-500/30 hover:bg-primary-700 hover:shadow-primary-600/40 transition-all active:scale-95"
            >
              <LogIn size={18} />
              Login
            </Link>
          )}
        </div>

        {/* Mobile Toggle */}
        <button
          className="rounded-lg p-2 md:hidden hover:bg-slate-100 transition-colors"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      <div
        className={cn(
          "absolute top-16 left-0 w-full bg-white border-b p-4 md:hidden transition-all duration-300 transform",
          isOpen ? "translate-y-0 opacity-100 pointer-events-auto" : "-translate-y-4 opacity-0 pointer-events-none"
        )}
      >
        <div className="flex flex-col gap-4">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              to={link.href}
              className="text-lg font-medium text-slate-700 p-2 hover:bg-slate-50 rounded-lg"
              onClick={() => setIsOpen(false)}
            >
              {link.name}
            </Link>
          ))}
          {!session && (
            <Link
              to="/auth"
              className="flex items-center justify-center gap-2 rounded-lg bg-primary-600 py-3 text-white font-medium"
              onClick={() => setIsOpen(false)}
            >
              <LogIn size={20} />
              Login
            </Link>
          )}
          {session && (
            <>
              <Link
                to={dashboardHref}
                className="flex items-center justify-center gap-2 rounded-lg bg-slate-900 py-3 text-white font-medium"
                onClick={() => setIsOpen(false)}
              >
                <LayoutDashboard size={20} />
                Dashboard
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center justify-center gap-2 rounded-lg border-2 border-slate-100 py-3 text-slate-600 font-medium hover:bg-rose-50 hover:text-rose-600 hover:border-rose-100 transition-all"
              >
                <LogOut size={20} />
                Logout
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
