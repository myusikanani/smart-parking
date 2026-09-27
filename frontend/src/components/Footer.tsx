import { Link } from 'react-router-dom';
import { FaInstagram, FaFacebookF, FaLinkedinIn, FaXTwitter, FaGithub, FaYoutube, FaWhatsapp } from 'react-icons/fa6';

const socialLinks = [
  {
    name: 'Instagram',
    url: 'https://instagram.com',
    icon: FaInstagram,
    defaultClass: 'bg-white/80 dark:bg-slate-900/80 text-[#E1306C] border-pink-500/20 shadow-sm',
    hoverClass: 'hover:bg-gradient-to-tr hover:from-[#f09433] hover:via-[#dc2743] hover:to-[#bc1888] hover:text-white hover:border-transparent hover:shadow-[0_0_22px_rgba(225,48,108,0.7)]',
  },
  {
    name: 'Facebook',
    url: 'https://facebook.com',
    icon: FaFacebookF,
    defaultClass: 'bg-white/80 dark:bg-slate-900/80 text-[#1877F2] border-blue-500/20 shadow-sm',
    hoverClass: 'hover:bg-gradient-to-tr hover:from-[#1877F2] hover:to-[#0c63d4] hover:text-white hover:border-transparent hover:shadow-[0_0_22px_rgba(24,119,242,0.7)]',
  },
  {
    name: 'LinkedIn',
    url: 'https://linkedin.com',
    icon: FaLinkedinIn,
    defaultClass: 'bg-white/80 dark:bg-slate-900/80 text-[#0A66C2] border-sky-500/20 shadow-sm',
    hoverClass: 'hover:bg-gradient-to-tr hover:from-[#0077B5] hover:to-[#0A66C2] hover:text-white hover:border-transparent hover:shadow-[0_0_22px_rgba(10,102,194,0.7)]',
  },
  {
    name: 'WhatsApp',
    url: 'https://wa.me/919876543210?text=Hello%20ParkEase%20Support',
    icon: FaWhatsapp,
    defaultClass: 'bg-white/80 dark:bg-slate-900/80 text-[#25D366] border-emerald-500/20 shadow-sm',
    hoverClass: 'hover:bg-gradient-to-tr hover:from-[#25D366] hover:to-[#128C7E] hover:text-white hover:border-transparent hover:shadow-[0_0_22px_rgba(37,211,102,0.7)]',
  },
  {
    name: 'X (Twitter)',
    url: 'https://x.com',
    icon: FaXTwitter,
    defaultClass: 'bg-white/80 dark:bg-slate-900/80 text-slate-800 dark:text-white border-slate-400/20 shadow-sm',
    hoverClass: 'hover:bg-gradient-to-tr hover:from-[#000000] hover:to-[#1e293b] hover:text-white hover:border-transparent hover:shadow-[0_0_22px_rgba(15,23,42,0.8)]',
  },
  {
    name: 'YouTube',
    url: 'https://youtube.com',
    icon: FaYoutube,
    defaultClass: 'bg-white/80 dark:bg-slate-900/80 text-[#FF0000] border-red-500/20 shadow-sm',
    hoverClass: 'hover:bg-gradient-to-tr hover:from-[#FF0000] hover:to-[#b30000] hover:text-white hover:border-transparent hover:shadow-[0_0_22px_rgba(255,0,0,0.7)]',
  },
  {
    name: 'GitHub',
    url: 'https://github.com/myusikanani/smart-parking',
    icon: FaGithub,
    defaultClass: 'bg-white/80 dark:bg-slate-900/80 text-slate-800 dark:text-gray-200 border-slate-400/20 shadow-sm',
    hoverClass: 'hover:bg-gradient-to-tr hover:from-[#24292e] hover:to-[#0d1117] hover:text-white hover:border-transparent hover:shadow-[0_0_22px_rgba(100,116,139,0.7)]',
  },
];

const footerNavs = [
  {
    title: 'Service',
    items: [
      { label: 'Home', to: '/' },
      { label: 'Solutions', to: '/book-parking' },
      { label: 'Smart Area', to: '/available-slots' },
    ],
  },
  {
    title: 'Pages',
    items: [
      { label: 'Pricing', to: '/subscriptions' },
      { label: 'Ecosystem', to: '/dashboard' },
      { label: 'Live Slots', to: '/available-slots' },
    ],
  },
  {
    title: 'Legal',
    items: [
      { label: 'Safeguards', to: '/security' },
      { label: 'Terms of Use', to: '/about' },
      { label: 'Contact Us', to: '/contact' },
    ],
  },
];

const Footer = () => (
  <footer className="bg-slate-100/90 dark:bg-[#030d22] border-t border-[var(--border)] py-12 text-slate-600 dark:text-gray-400 transition-colors">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-10">
        <div className="col-span-2">
          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/25">
              <span className="text-white font-bold text-sm">P</span>
            </div>
            <span className="text-xl font-extrabold text-slate-900 dark:text-white tracking-wide font-space">
              Park<span className="text-cyan-500 dark:text-cyan-400">Ease</span>
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-gray-400 max-w-sm mb-4 font-sans leading-relaxed">
            Smart, simple, and hassle-free parking management. Real-time slot availability, instant digital passes, and 3D parking navigation.
          </p>
          
          <div className="flex items-center gap-2.5 text-xs text-emerald-600 dark:text-emerald-400 font-mono mb-5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span>All Systems Operational • 99.98% Uptime</span>
          </div>

          {/* SOCIAL MEDIA CHANNELS */}
          <div className="space-y-2">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-gray-300 font-space">
              Connect With Us:
            </p>
            <div className="flex flex-wrap items-center gap-2.5">
              {socialLinks.map((social) => {
                const Icon = social.icon;
                return (
                  <a
                    key={social.name}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Visit our ${social.name} page`}
                    title={`Visit ParkEase on ${social.name}`}
                    className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-all duration-300 hover:scale-115 hover:-translate-y-1 active:scale-95 cursor-pointer ${social.defaultClass} ${social.hoverClass}`}
                  >
                    <Icon className="w-4 h-4 transition-colors duration-300" />
                  </a>
                );
              })}
            </div>
          </div>
        </div>

        {footerNavs.map((section) => (
          <div key={section.title}>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-gray-200 mb-3.5 font-space">{section.title}</h4>
            <ul className="space-y-2">
              {section.items.map((item) => (
                <li key={item.label}>
                  <Link to={item.to} className="text-xs text-slate-600 dark:text-gray-400 hover:text-cyan-600 dark:hover:text-cyan-300 transition-colors font-sans">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="pt-6 border-t border-[var(--border)] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-gray-500 font-mono">
        <p>&copy; {new Date().getFullYear()} ParkEase Inc. • All rights reserved • Model 100-243</p>
        <div className="flex items-center gap-4">
          <Link to="/about" className="hover:text-cyan-600 dark:hover:text-gray-300 transition-colors">Privacy</Link>
          <Link to="/about" className="hover:text-cyan-600 dark:hover:text-gray-300 transition-colors">Terms</Link>
          <Link to="/contact" className="hover:text-cyan-600 dark:hover:text-gray-300 transition-colors">Security</Link>
          <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
            Status • All systems Operational
          </span>
        </div>
      </div>
    </div>
  </footer>
);

export default Footer;

