import { Mail, Heart, Check, Copy, ChevronRight } from "lucide-react";
import { useState } from "react";

interface TeamMember {
  name: string;
  role: string;
  email: string;
  image: string;
  bio: string;
}

const team: TeamMember[] = [
  {
    name: "ANAKARY STEPHEN GRACEMANNA",
    role: "CEO",
    email: "stephen.24bca8009@vitapstudent.ac.in",
    image: "/images/stephen.jpeg",
    bio: "Visionary leader focused on building user-centric healthcare solutions and bridging the gap between patients and quality care."
  },
  {
    name: "PRABHAS",
    role: "CTO",
    email: "prabhas.24bca8023@vitapstudent.ac.in",
    image: "/images/prabhas.jpeg",
    bio: "Technical strategist leading the implementation of high-performance, secure, and scalable architectures for MedicoCrew."
  },
  {
    name: "YELUVU ARUN KUMAR",
    role: "CFO",
    email: "arun.24bca8011@vitapstudent.ac.in",
    image: "/images/arun.jpeg",
    bio: "Financial strategist managing resource allocation and ensuring the long-term sustainability and growth of the MedicoCrew platform."
  }
];

function TeamCard({ member }: { member: TeamMember }) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(member.email);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="group relative flex flex-col bg-white rounded-[2.5rem] overflow-hidden shadow-sm transition-all duration-500 hover:shadow-[0_48px_96px_-12px_rgba(0,0,0,0.12)] border border-slate-100">
      {/* 4:5 Aspect Ratio Photo Container */}
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-slate-900">
        <div className="absolute inset-0 bg-medical-pattern opacity-10 z-0" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 to-transparent z-10" />
        
        <img 
          src={member.image} 
          alt={member.name} 
          className="h-full w-full object-cover object-center group-hover:scale-110 transition-all duration-1000 ease-out z-0"
          onError={(e) => {
            (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1633332755192-727a05c4013d?auto=format&fit=crop&q=80&w=600";
          }}
        />
        
        {/* Floating Role Badge */}
        <div className="absolute top-6 left-6 z-20">
          <div className="inline-flex items-center backdrop-blur-md bg-white/10 px-4 py-2 rounded-2xl border border-white/20 text-white text-[10px] font-black uppercase tracking-widest shadow-xl">
            {member.role}
          </div>
        </div>
      </div>

      {/* Content Section: Glass-inspired details */}
      <div className="p-10 flex flex-col items-start flex-grow relative bg-white">
        <h3 className="text-2xl font-black text-slate-900 tracking-tighter leading-[0.9] mb-4 uppercase transition-colors group-hover:text-primary-600">
          {member.name}
        </h3>
        
        <p className="text-slate-500 text-sm font-medium leading-relaxed mb-8 flex-grow">
          {member.bio}
        </p>
        
        {/* Actions Grid */}
        <div className="grid grid-cols-5 gap-2 w-full">
          <a 
            href={`mailto:${member.email}`}
            className="col-span-4 flex items-center justify-center gap-3 bg-slate-900 hover:bg-primary-600 text-white h-14 rounded-2xl text-xs font-black transition-all active:scale-95 shadow-xl shadow-slate-900/10"
          >
            <Mail size={16} />
            CONTACT VIA EMAIL
          </a>
          <button 
            onClick={copyToClipboard}
            className="col-span-1 flex items-center justify-center bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-emerald-500 h-14 rounded-2xl transition-all border border-slate-100 active:scale-95"
            title="Copy Email"
          >
            {copied ? <Check size={18} className="text-emerald-500" /> : <Copy size={18} />}
          </button>
        </div>
        
        {/* Success Message Positioning */}
        {copied && (
          <div className="absolute top-4 right-10 bg-emerald-500 text-white text-[10px] font-black px-3 py-1 rounded-full animate-in fade-in slide-in-from-top-2">
            COPIED!
          </div>
        )}
      </div>
    </div>
  );
}

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#FDFDFD] py-16 md:py-32 px-4 selection:bg-primary-100 selection:text-primary-900">
      <div className="container mx-auto max-w-7xl">
        
        {/* Designer Header */}
        <div className="relative mb-24 md:mb-32">
          <div className="absolute -top-20 -left-10 w-64 h-64 bg-primary-50 rounded-full blur-3xl opacity-60 z-0" />
          <div className="relative z-10 max-w-3xl">
            <div className="flex items-center gap-3 text-xs font-black uppercase tracking-[0.2em] text-primary-600 mb-6">
              <span className="h-[1px] w-8 bg-primary-600" />
              OUR VISIONARY CORE
            </div>
            <h1 className="text-6xl md:text-8xl font-black text-slate-900 tracking-tighter leading-[0.85] mb-12">
              Transforming <br />
              <span className="text-primary-600">The Future.</span>
            </h1>
            <p className="text-xl md:text-2xl text-slate-400 font-medium leading-relaxed max-w-2xl">
              Meet the architects of MedicoCrew. We are committed to building the next generation of healthcare technology.
            </p>
          </div>
        </div>

        {/* High-End Team Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 md:gap-14">
          {team.map((member, i) => (
            <div key={i} className={`animate-in fade-in slide-in-from-bottom-10 duration-1000 fill-mode-both`} style={{ animationDelay: `${i * 200}ms` }}>
              <TeamCard member={member} />
            </div>
          ))}
        </div>

        {/* Bottom Call to Action / Quote */}
        <div className="mt-40 pt-20 border-t border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-12">
          <div className="max-w-xl">
            <Heart size={40} className="text-rose-500 mb-8" />
            <h2 className="text-4xl font-black text-slate-900 tracking-tighter mb-6">Built with empathy.</h2>
            <p className="text-lg text-slate-500 font-medium">Healthcare is human. Our mission is to make it accessible to every single person, without compromise.</p>
          </div>
          <a 
            href="/" 
            className="group flex h-20 items-center gap-4 bg-slate-100 hover:bg-slate-900 hover:text-white px-10 rounded-3xl transition-all duration-500"
          >
            <span className="text-sm font-black uppercase tracking-widest">Return to Homepage</span>
            <ChevronRight size={20} className="transition-transform group-hover:translate-x-1" />
          </a>
        </div>
        
        <div className="mt-32 text-center text-[10px] font-black uppercase tracking-[0.5em] text-slate-300">
          MEDICOCREW GLOBAL TEAM / 2026
        </div>
      </div>
    </div>
  );
}
