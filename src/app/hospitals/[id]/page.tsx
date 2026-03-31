"use client";

import { useParams, useRouter } from "next/navigation";
import { 
  Star, Bed, Stethoscope, Activity, ShieldCheck, 
  Clock, Share2, Heart, ArrowLeft, MessageSquare, ClipboardList, 
  CheckCircle2, AlertCircle, Loader2, KeyRound, Ticket, LayoutDashboard, X,
  Mail, Phone, MapPin, Globe, Package, Users, ShieldCheck as Shield
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/Toast";

const reviewCategories = [
  { label: "Equipment Quality", key: "equipment_quality" },
  { label: "Treatment Efficiency", key: "treatment_quality" },
  { label: "Staff Behavior", key: "staff_behavior" },
  { label: "Facility Cleanliness", key: "cleanliness" },
  { label: "Waiting Time", key: "waiting_time" },
];

export default function HospitalDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const [activeTab, setActiveTab] = useState("reviews");
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [hospital, setHospital] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<string | null>(null);
  
  // Token Rating States
  const [tokenInput, setTokenInput] = useState("");
  const [tokenError, setTokenError] = useState("");
  const [isValidToken, setIsValidToken] = useState(false);
  const [isVerifyingToken, setIsVerifyingToken] = useState(false);
  
  // Review Form States
  const [ratings, setRatings] = useState<Record<string, number>>({
    equipment_quality: 5,
    treatment_quality: 5,
    staff_behavior: 5,
    cleanliness: 5,
    waiting_time: 5,
  });
  const [reviewText, setReviewText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const { showToast, hideToast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push(`/auth?redirect=/hospitals/${id}`);
        return;
      }

      setUser(session.user);
      const userRole = session.user.user_metadata?.role || "user";
      setRole(userRole);

      const [hRes, rRes, sRes, iRes] = await Promise.all([
        supabase.from("hospitals").select("*").eq("id", id).single(),
        supabase.from("reviews")
          .select("*, user_profiles(full_name)")
          .eq("hospital_id", id)
          .order("created_at", { ascending: false }),
        supabase.from("hospital_staff")
          .select("*")
          .eq("hospital_id", id),
        supabase.from("hospital_inventory")
          .select("*, equipment(*)")
          .eq("hospital_id", id)
      ]);

      if (hRes.data) setHospital(hRes.data);
      if (rRes.data) setReviews(rRes.data);
      if (sRes.data) setStaff(sRes.data);
      if (iRes.data) setInventory(iRes.data);
      
      setIsLoading(false);
    };
    if (id) fetchData();
  }, [id, router]);

  const verifyToken = async () => {
    if (!tokenInput.trim()) return;
    setIsVerifyingToken(true);
    setTokenError("");
    
    try {
      const { data: appointment, error } = await supabase
        .from("appointments")
        .select("*")
        .eq("token_number", tokenInput.trim())
        .eq("hospital_id", id)
        .eq("status", "completed")
        .single();
        
      if (error || !appointment) {
        setTokenError("Invalid or expired token. Please check your token number.");
      } else {
        // Check if token already used for a review
        const { data: existingReview } = await supabase
          .from("reviews")
          .select("id")
          .eq("token_number", tokenInput.trim())
          .single();
          
        if (existingReview) {
          setTokenError("This token has already been used to submit a review.");
        } else {
          setIsValidToken(true);
          setShowReviewModal(true);
          showToast("Token validated successfully!", "success");
        }
      }
    } catch (err) {
      setTokenError("Verification failed. Please try again later.");
    } finally {
      setIsVerifyingToken(false);
    }
  };

  const submitReview = async () => {
    if (!user) return;
    setIsSubmitting(true);
    
    const overall = Object.values(ratings).reduce((a, b) => a + b, 0) / 5;
    
    const { error } = await supabase.from("reviews").insert([{
      hospital_id: id,
      user_id: user.id,
      token_number: tokenInput,
      ...ratings,
      overall_rating: overall,
      review_text: reviewText
    }]);

    if (!error) {
      setShowReviewModal(false);
      setIsValidToken(false);
      setTokenInput("");
      // Refresh reviews
      const { data: newReviews } = await supabase
        .from("reviews")
        .select("*, user_profiles(full_name)")
        .eq("hospital_id", id)
        .order("created_at", { ascending: false });
      if (newReviews) setReviews(newReviews);
      showToast("Review published! Thank you for the feedback.", "success");
    } else {
      showToast(error.message, "error");
    }
    
    setIsSubmitting(false);
  };

  const handleBookAppointment = async () => {
    if (!user) {
      showToast("Please sign in to book an appointment", "error");
      router.push(`/auth?redirect=/hospitals/${id}`);
      return;
    }
    
    setIsSubmitting(true);
    const toastId = showToast("Generating medical token...", "loading");

    try {
      // Generate a structured medical token
      const token = `MC-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      
      const { error } = await supabase.from("appointments").insert([{
        hospital_id: id,
        user_id: user.id,
        appointment_date: new Date(Date.now() + 86400000).toISOString(), // Set for 24h from now
        status: 'pending',
        token_number: token
      }]);

      if (error) throw error;
      
      hideToast(toastId); // Fix: Use hideToast instead of 3-arg showToast
      showToast(`Booking Successful! Your token is ${token}. Track it in your dashboard.`, "success");
    } catch (err: any) {
      hideToast(toastId);
      showToast(err.message || "Failed to establish booking payload.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleFavorite = () => {
    setIsFavorited(!isFavorited);
    showToast(isFavorited ? "Removed from favorites" : "Added to favorites", "info");
  };

  if (isLoading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="animate-spin text-primary-600 mx-auto mb-4" size={48} />
        <p className="text-slate-500 font-bold">Connecting to facility analytics...</p>
      </div>
    </div>
  );

  if (!hospital) return <div>Hospital not found</div>;

  return (
    <div className="bg-slate-50 min-h-screen">
      {/* Top Banner & Header */}
      <section className="bg-white border-b sticky top-0 z-40 shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <Link href="/hospitals" className="flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-primary-600 mb-6 transition-colors group">
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            Back to Hospitals
          </Link>
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="flex-grow">
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-black text-emerald-600 ring-1 ring-emerald-600/20 uppercase tracking-widest">
                  <ShieldCheck size={14} />
                  Verified Facility
                </span>
                <span className="text-xs font-bold text-slate-400">• Registered ID: {hospital.id.slice(0, 8)}</span>
              </div>
              <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">{hospital.name}</h1>
              <div className="mt-3 flex flex-wrap items-center gap-6 text-sm font-medium text-slate-500">
                <div className="flex items-center gap-1.5">
                  <MapPin size={16} className="text-primary-600" />
                  {hospital.location}
                </div>
                <div className="flex items-center gap-1.5 text-amber-500 font-black">
                  <Star size={16} className="fill-amber-500" />
                  {reviews.length > 0 ? (reviews.reduce((acc, r) => acc + Number(r.overall_rating), 0) / reviews.length).toFixed(1) : "N/A"} ({reviews.length} reviews)
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button 
                onClick={toggleFavorite}
                className={cn(
                  "flex h-12 w-12 items-center justify-center rounded-2xl border transition-all active:scale-95",
                  isFavorited 
                    ? "bg-rose-50 border-rose-100 text-rose-500" 
                    : "bg-white border-slate-200 text-slate-400 hover:text-rose-500 hover:bg-rose-50"
                )}
              >
                <Heart size={20} className={cn(isFavorited && "fill-rose-500")} />
              </button>
              {role === "user" ? (
                <button 
                  onClick={() => setShowContactModal(true)}
                  className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-primary-600 px-8 font-black text-white shadow-xl shadow-primary-500/30 hover:bg-primary-700 transition-all active:scale-95"
                >
                  Contact Facility
                </button>
              ) : (
                <Link 
                  href={`/dashboard/${role}`}
                  className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-slate-900 px-8 font-black text-white shadow-xl shadow-slate-900/30 hover:bg-slate-800 transition-all active:scale-95"
                >
                  <LayoutDashboard size={20} />
                  Dashboard
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 mt-12 grid grid-cols-1 lg:grid-cols-3 gap-12 pb-24">
        {/* Left Side: Details */}
        <div className="lg:col-span-2 space-y-12">
          {/* Photos Mockup */}
          <div className="aspect-[21/9] w-full rounded-3xl bg-slate-200 overflow-hidden relative group shadow-inner">
            {hospital.image_url ? (
              <img src={hospital.image_url} alt={hospital.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000" />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-primary-300 font-black italic text-3xl opacity-50">
                Facility Gallery Placeholder
              </div>
            )}
          </div>

          {/* Description */}
          <div className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-100">
            <h3 className="text-2xl font-black text-slate-800 tracking-tight mb-6">About the Facility</h3>
            <p className="text-slate-600 leading-relaxed text-lg italic">
              &quot;{hospital.description || "No description available for this facility yet."}&quot;
            </p>
            
            <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-8 border-t pt-8">
              <div className="text-center">
                <div className="mx-auto h-12 w-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 mb-3">
                  <Bed size={24} />
                </div>
                <div className="text-xl font-black text-slate-900">{hospital.beds || 0}</div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Total Beds</div>
              </div>
              <div className="text-center">
                <div className="mx-auto h-12 w-12 rounded-2xl bg-teal-50 flex items-center justify-center text-teal-600 mb-3">
                  <Stethoscope size={24} />
                </div>
                <div className="text-xl font-black text-slate-900">{hospital.doctors || 0}</div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Specialists</div>
              </div>
              <div className="text-center">
                <div className="mx-auto h-12 w-12 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-600 mb-3">
                  <Activity size={24} />
                </div>
                <div className="text-xl font-black text-slate-900">24/7</div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Emergency</div>
              </div>
              <div className="text-center">
                <div className="mx-auto h-12 w-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 mb-3">
                  <ShieldCheck size={24} />
                </div>
                <div className="text-xl font-black text-slate-900">ISO</div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Certified</div>
              </div>
            </div>
          </div>

          {/* Review Token Entry Section (Only for Users) */}
          {role === "user" && (
            <div className="rounded-3xl bg-slate-900 p-8 text-white shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 -translate-y-4 translate-x-4 h-32 w-32 bg-primary-500/20 rounded-full blur-3xl group-hover:scale-150 transition-all duration-1000" />
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                  <Ticket className="text-primary-400" size={28} />
                  <h3 className="text-2xl font-black tracking-tight">Redeem Patient Token</h3>
                </div>
                <p className="text-slate-400 font-medium mb-8 max-w-lg">
                  Provided with a token after your visit? Enter it below to unlock detailed rating options for this facility and its equipment.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-grow">
                    <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <input 
                      type="text" 
                      placeholder="Enter Token (e.g., MC-XXXXXX)" 
                      value={tokenInput}
                      onChange={(e) => setTokenInput(e.target.value.toUpperCase())}
                      className="w-full h-14 rounded-2xl bg-white/10 border border-white/20 pl-12 pr-4 text-white font-bold focus:ring-4 focus:ring-primary-500/20 outline-none transition-all placeholder:text-slate-600"
                    />
                  </div>
                  <button 
                    onClick={verifyToken}
                    disabled={isVerifyingToken || !tokenInput}
                    className="h-14 px-8 rounded-2xl bg-primary-600 font-black text-white hover:bg-primary-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isVerifyingToken ? <Loader2 className="animate-spin" size={20} /> : "Validate Token"}
                  </button>
                </div>
                {tokenError && <p className="mt-4 text-rose-400 text-sm font-bold flex items-center gap-2"><AlertCircle size={16} /> {tokenError}</p>}
              </div>
            </div>
          )}

          {/* Tabs / Reviews */}
          <div className="rounded-3xl bg-white shadow-sm ring-1 ring-slate-100 overflow-hidden">
            <div className="flex border-b bg-slate-50/50">
              <button 
                onClick={() => setActiveTab("reviews")}
                className={cn(
                  "flex-1 px-8 py-5 text-sm font-black uppercase tracking-widest transition-all border-b-2",
                  activeTab === "reviews" ? "border-primary-600 text-primary-600 bg-white" : "border-transparent text-slate-400 hover:text-slate-600"
                )}
              >
                Patient Experiences ({reviews.length})
              </button>
              <button 
                onClick={() => setActiveTab("services")}
                className={cn(
                  "flex-1 px-8 py-5 text-sm font-black uppercase tracking-widest transition-all border-b-2",
                  activeTab === "services" ? "border-primary-600 text-primary-600 bg-white" : "border-transparent text-slate-400 hover:text-slate-600"
                )}
              >
                Services
              </button>
              <button 
                onClick={() => setActiveTab("staff")}
                className={cn(
                  "flex-1 px-8 py-5 text-sm font-black uppercase tracking-widest transition-all border-b-2",
                  activeTab === "staff" ? "border-primary-600 text-primary-600 bg-white" : "border-transparent text-slate-400 hover:text-slate-600"
                )}
              >
                Clinical Experts
              </button>
              <button 
                onClick={() => setActiveTab("assets")}
                className={cn(
                  "flex-1 px-8 py-5 text-sm font-black uppercase tracking-widest transition-all border-b-2",
                  activeTab === "assets" ? "border-primary-600 text-primary-600 bg-white" : "border-transparent text-slate-400 hover:text-slate-600"
                )}
              >
                Verified Assets
              </button>
            </div>

            <div className="p-8">
              {activeTab === "reviews" && (
                <div className="space-y-8">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-lg font-black text-slate-800 tracking-tight">Recent Feedback</h4>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1 rounded-full border">Verified Reviews Only</span>
                  </div>
                  
                  <div className="space-y-12">
                    {reviews.length > 0 ? reviews.map(review => (
                      <div key={review.id} className="group relative">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="h-12 w-12 rounded-2xl bg-primary-50 flex items-center justify-center text-primary-600 uppercase font-black text-sm ring-1 ring-primary-100">
                              {review.user_profiles?.full_name?.[0] || "P"}
                            </div>
                            <div>
                              <div className="text-sm font-black text-slate-900">{review.user_profiles?.full_name || "Patient"}</div>
                              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{new Date(review.created_at).toLocaleDateString()}</div>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <div className="flex items-center gap-1 font-black text-amber-500 text-sm">
                              <Star size={14} className="fill-amber-500" />
                              {Number(review.overall_rating).toFixed(1)}
                            </div>
                            <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 flex items-center gap-1">
                              <ShieldCheck size={10} /> Token Verified
                            </span>
                          </div>
                        </div>
                        <p className="text-slate-600 text-sm leading-relaxed italic border-l-4 border-slate-100 pl-6 py-2">
                          &quot;{review.review_text}&quot;
                        </p>
                        
                        {/* Rating Breakdown Badges */}
                        <div className="mt-4 flex flex-wrap gap-2 pl-6">
                           {reviewCategories.map(cat => (
                             <div key={cat.key} className="px-2 py-1 bg-slate-50 rounded text-[9px] font-bold text-slate-500 border border-slate-100">
                               {cat.label}: <span className="text-slate-900">{review[cat.key]}/5</span>
                             </div>
                           ))}
                        </div>
                      </div>
                    )) : (
                      <div className="py-12 text-center text-slate-400 border-2 border-dashed border-slate-100 rounded-3xl">
                        <MessageSquare size={48} className="mx-auto mb-4 opacity-20" />
                        <p className="font-bold">No verified reviews yet. Be the first to share your experience!</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === "services" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(hospital.services || []).map((service: string) => (
                    <div key={service} className="flex items-center gap-3 rounded-2xl bg-slate-50 p-4 border border-slate-100 transition-all hover:border-primary-200">
                      <div className="h-8 w-8 rounded-lg bg-white flex items-center justify-center text-primary-600 shadow-sm ring-1 ring-slate-200">
                        <CheckCircle2 size={18} />
                      </div>
                      <span className="text-sm font-bold text-slate-700">{service}</span>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === "staff" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {staff.map(member => (
                    <div key={member.id} className="rounded-2xl border border-slate-100 p-6 bg-slate-50/30 hover:bg-white transition-all shadow-sm">
                       <div className="flex items-center gap-4">
                          <div className="h-16 w-16 rounded-2xl bg-primary-100 overflow-hidden ring-1 ring-primary-200 shadow-inner">
                             {member.image_url ? <img src={member.image_url} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-primary-600 font-black text-2xl">{member.full_name[0]}</div>}
                          </div>
                          <div>
                             <h4 className="font-black text-slate-900">{member.full_name}</h4>
                             <p className="text-xs font-black text-primary-600 uppercase tracking-widest">{member.role}</p>
                             <p className="text-[10px] font-bold text-slate-400 uppercase mt-1 italic">{member.speciality || "Facility General Staff"}</p>
                          </div>
                       </div>
                    </div>
                  ))}
                  {staff.length === 0 && (
                    <div className="col-span-full py-12 text-center text-slate-400 border-2 border-dashed border-slate-100 rounded-3xl">
                      <Users size={40} className="mx-auto mb-4 opacity-10" />
                      <p className="font-bold">No professional directory available yet</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "assets" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {inventory.map(item => (
                    <div key={item.id} className="rounded-2xl border border-slate-100 p-6 bg-slate-50/30 hover:bg-white transition-all shadow-sm group">
                       <div className="flex items-center justify-between mb-4">
                          <div className="h-12 w-12 rounded-xl bg-white flex items-center justify-center text-primary-600 shadow-sm ring-1 ring-slate-100">
                             <Package size={24} />
                          </div>
                          <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-2 py-0.5 rounded ring-1 ring-emerald-100">Verified Unit</span>
                       </div>
                       <h4 className="font-black text-slate-900 group-hover:text-primary-600 transition-colors">{item.equipment?.name}</h4>
                       <p className="text-[10px] font-bold text-slate-400 mt-1 italic line-clamp-1">{item.equipment?.description}</p>
                    </div>
                  ))}
                  {inventory.length === 0 && (
                    <div className="col-span-full py-12 text-center text-slate-400 border-2 border-dashed border-slate-100 rounded-3xl">
                      <Package size={40} className="mx-auto mb-4 opacity-10" />
                      <p className="font-bold">No verified medical equipment listed</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Quick Info / Contact */}
        <div className="space-y-8">
          <div className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-100">
            <h3 className="text-xl font-bold mb-8 text-slate-900 tracking-tight flex items-center gap-2">
              <ClipboardList size={20} className="text-primary-600" />
              Information
            </h3>
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl bg-primary-50 flex items-center justify-center text-primary-600">
                  <MapPin size={20} />
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Facility Address</div>
                  <div className="text-sm font-bold text-slate-700 leading-tight">{hospital.address || hospital.location}</div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl bg-primary-50 flex items-center justify-center text-primary-600">
                  <Clock size={20} />
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Operating Hours</div>
                  <div className="text-sm font-bold text-slate-700">Open 24 Hours</div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl bg-primary-50 flex items-center justify-center text-primary-600">
                  <Phone size={20} />
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Direct Helpline</div>
                  <div className="text-sm font-bold text-slate-700">{hospital.phone || "+91 (555) 000-1111"}</div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl bg-primary-50 flex items-center justify-center text-primary-600">
                  <Mail size={20} />
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Inquiry Email</div>
                  <div className="text-sm font-bold text-slate-700">{hospital.email || "contact@facility.com"}</div>
                </div>
              </div>
              {hospital.website && (
                 <div className="flex items-center gap-4">
                   <div className="h-10 w-10 rounded-xl bg-primary-50 flex items-center justify-center text-primary-600">
                     <Globe size={20} />
                   </div>
                   <div>
                     <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Website</div>
                     <div className="text-sm font-bold text-slate-700 truncate">{hospital.website}</div>
                   </div>
                 </div>
              )}
            </div>
            
            {role === "user" ? (
              <button 
                onClick={handleBookAppointment}
                disabled={isSubmitting}
                className="mt-10 w-full py-4 rounded-2xl bg-primary-600 text-white font-black text-sm hover:bg-primary-700 transition-all active:scale-95 shadow-xl shadow-primary-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : null}
                Book Appointment
              </button>
            ) : (
              <Link 
                href={`/dashboard/${role}`}
                className="mt-10 flex items-center justify-center w-full py-4 rounded-2xl bg-slate-900 text-white font-black text-sm hover:bg-slate-800 transition-all active:scale-95 shadow-xl shadow-slate-900/20"
              >
                Manage Facility
              </Link>
            )}
          </div>

          <div className="rounded-3xl bg-amber-50 p-6 border border-amber-100/50">
            <div className="flex items-center gap-3 text-amber-700 mb-4">
              <AlertCircle size={24} />
              <h4 className="font-bold uppercase tracking-widest text-[10px]">Patient Advisory</h4>
            </div>
            <p className="text-xs text-amber-800/80 leading-relaxed font-bold italic">
               "Rating submission is currently locked to patients with valid appointment tokens. Tokens are valid for 7 days after visit completion."
            </p>
          </div>
        </div>
      </div>

      {/* Review Submission Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-3xl bg-white p-10 shadow-2xl relative overflow-hidden ring-1 ring-slate-100">
            <div className="absolute top-0 right-0 -translate-y-12 translate-x-12 h-32 w-32 bg-primary-100/30 rounded-full blur-3xl opacity-50" />
            
            <div className="flex items-center gap-3 mb-6">
              <div className="h-12 w-12 rounded-2xl bg-primary-600 flex items-center justify-center text-white shadow-lg">
                <Star size={24} className="fill-white" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">Verified Experience</h3>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Token: {tokenInput}</p>
              </div>
            </div>
            
            <div className="space-y-6">
              {reviewCategories.map((cat) => (
                <div key={cat.key} className="flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-600">{cat.label}</span>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button 
                        key={star} 
                        onClick={() => setRatings(prev => ({ ...prev, [cat.key]: star }))}
                        className={cn(
                          "transition-all duration-300 transform active:scale-90",
                          star <= ratings[cat.key] ? "text-amber-400" : "text-slate-100"
                        )}
                      >
                        <Star size={22} className={cn("fill-current", star <= ratings[cat.key] ? "drop-shadow-[0_0_8px_rgba(251,191,36,0.3)]" : "")} />
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              
              <div className="pt-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Tell us more about your visit</label>
                <textarea 
                  placeholder="Share details about the surgical equipment, staff care, or facility hygiene..."
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  className="w-full h-32 rounded-2xl bg-slate-50 border border-slate-200 p-4 text-sm font-medium focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all resize-none"
                />
              </div>

              <div className="flex gap-4 pt-6">
                <button 
                  onClick={() => setShowReviewModal(false)}
                  disabled={isSubmitting}
                  className="flex-1 py-4 rounded-2xl border border-slate-200 text-slate-500 font-bold hover:bg-slate-50 transition-all active:scale-95 disabled:opacity-50"
                >
                  Discard
                </button>
                <button 
                  onClick={submitReview}
                  disabled={isSubmitting || !reviewText.trim()}
                  className="flex-1 py-4 rounded-2xl bg-primary-600 text-white font-black shadow-xl shadow-primary-500/20 hover:bg-primary-700 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : "Publish Review"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Contact Modal */}
      {showContactModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
           <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl relative overflow-hidden ring-1 ring-slate-100 animate-in zoom-in duration-300">
              <button onClick={() => setShowContactModal(false)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
              <div className="flex items-center gap-4 mb-8">
                 <div className="h-14 w-14 rounded-2xl bg-primary-50 flex items-center justify-center text-primary-600">
                   <Phone size={28} />
                 </div>
                 <div>
                   <h3 className="text-xl font-black text-slate-900">Contact Facility</h3>
                   <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Immediate Medical Assistance</p>
                 </div>
              </div>
              
              <div className="space-y-4">
                 <a 
                   href="tel:+915550001111" 
                   className="flex items-center justify-between p-5 rounded-2xl bg-slate-50 border border-slate-100 hover:border-primary-200 transition-all group"
                 >
                    <div className="flex items-center gap-4">
                       <Phone size={20} className="text-primary-500" />
                       <span className="font-bold text-slate-700">Voice Call</span>
                    </div>
                    <span className="text-sm font-black text-primary-600 group-hover:translate-x-1 transition-transform">Dial Now</span>
                 </a>
                 <a 
                   href="mailto:contact@hospital.com" 
                   className="flex items-center justify-between p-5 rounded-2xl bg-slate-50 border border-slate-100 hover:border-primary-200 transition-all group"
                 >
                    <div className="flex items-center gap-4">
                       <Mail size={20} className="text-primary-500" />
                       <span className="font-bold text-slate-700">Email Inquiry</span>
                    </div>
                    <span className="text-sm font-black text-primary-600 group-hover:translate-x-1 transition-transform">Send Mail</span>
                 </a>
              </div>
              
              <button 
                onClick={() => setShowContactModal(false)}
                className="mt-8 w-full py-4 rounded-2xl bg-slate-900 text-white font-black text-sm active:scale-95 transition-all"
              >
                Close Protocol
              </button>
           </div>
        </div>
      )}
    </div>
  );
}
