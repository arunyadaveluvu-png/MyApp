import { Link } from "react-router-dom";
import { Globe, Share2, Mail, Phone, MapPin, Hospital } from "lucide-react";

const Footer = () => {
  return (
    <footer className="w-full border-t bg-slate-50 pt-16 pb-8 transition-colors">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-4">
          <div className="flex flex-col gap-6">
            <Link to="/" className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-600 text-white">
                <Hospital size={24} />
              </div>
              <span className="text-xl font-bold tracking-tight text-slate-900 font-sans">
                Medico<span className="text-primary-600">Crew</span>
              </span>
            </Link>
            <p className="text-sm leading-relaxed text-slate-500 max-w-xs">
              Empowering healthcare excellence through transparent ratings, advanced equipment, and seamless hospital management.
            </p>
            <div className="flex gap-4">
              {[Globe, Share2].map((Icon, i) => (
                <button
                  key={i}
                  className="rounded-full bg-white p-2 text-slate-400 shadow-sm transition-all hover:bg-primary-600 hover:text-white"
                >
                  <Icon size={18} />
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="mb-6 font-semibold text-slate-900">Platform</h3>
            <ul className="flex flex-col gap-4 text-sm text-slate-500">
              <li><Link to="/hospitals" className="hover:text-primary-600">Find Hospitals</Link></li>
              <li><Link to="/marketplace" className="hover:text-primary-600">Medical Marketplace</Link></li>
              <li><Link to="/about" className="hover:text-primary-600">About Us</Link></li>
              <li><Link to="/contact" className="hover:text-primary-600">Contact Support</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="mb-6 font-semibold text-slate-900">For Facilities</h3>
            <ul className="flex flex-col gap-4 text-sm text-slate-500">
              <li><Link to="/auth" className="hover:text-primary-600">Hospital Login</Link></li>
              <li><Link to="/register" className="hover:text-primary-600">Partner with Us</Link></li>
              <li><Link to="/equipment-sales" className="hover:text-primary-600">Equipment Sales</Link></li>
              <li><Link to="/resources" className="hover:text-primary-600">Resources</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="mb-6 font-semibold text-slate-900">Contact Info</h3>
            <ul className="flex flex-col gap-4 text-sm text-slate-500">
              <li className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-100 text-primary-600">
                  <Phone size={16} />
                </div>
                +1 (555) 000-HEALTH
              </li>
              <li className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-100 text-primary-600">
                  <Mail size={16} />
                </div>
                contact@medicocrew.com
              </li>
              <li className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-100 text-primary-600">
                  <MapPin size={16} />
                </div>
                Healthcare District, 12th St.
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-16 border-t pt-8 text-center text-xs text-slate-400">
          <p>© {new Date().getFullYear()} MedicoCrew. All rights reserved. Designed for Excellence in Healthcare.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
