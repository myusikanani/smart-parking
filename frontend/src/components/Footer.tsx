import { Link } from 'react-router-dom';

const footerNavs = [
  {
    title: 'About Us',
    items: [
      { label: 'About ParkEase', to: '/about' },
      { label: 'How It Works', to: '/available-slots' },
      { label: 'Contact Support', to: '/contact' },
    ],
  },
  {
    title: 'Features',
    items: [
      { label: 'Find Parking', to: '/book-parking' },
      { label: 'Live Slots Radar', to: '/available-slots' },
      { label: 'Pricing & Subscriptions', to: '/subscriptions' },
    ],
  },
  {
    title: 'Portals & Legal',
    items: [
      { label: 'User Dashboard', to: '/dashboard' },
      { label: 'Admin Management', to: '/admin' },
      { label: 'Security Gate Check', to: '/security' },
    ],
  },
];

const Footer = () => (
  <footer className="bg-[#060b14] border-t border-cyan-500/10 py-12 text-gray-400">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
        <div className="col-span-2">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center shadow-lg shadow-cyan-500/25">
              <span className="text-white font-bold text-sm">P</span>
            </div>
            <span className="text-lg font-extrabold text-white tracking-wide">
              Park<span className="text-cyan-400">Ease</span>
            </span>
          </div>
          <p className="text-xs leading-relaxed text-gray-400 max-w-sm mb-4">
            Next-generation smart parking infrastructure. Effortless slot discovery, AI pathfinding, and frictionless ticketless drive-throughs.
          </p>
          <div className="flex items-center gap-3 text-xs text-emerald-400 font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>All Systems Operational • 99.98% Uptime</span>
          </div>
        </div>

        {footerNavs.map((section) => (
          <div key={section.title}>
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-200 mb-4">{section.title}</h4>
            <ul className="space-y-2.5">
              {section.items.map((item) => (
                <li key={item.label}>
                  <Link to={item.to} className="text-xs text-gray-400 hover:text-cyan-300 transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
        <p>&copy; {new Date().getFullYear()} ParkEase Inc. Fast-Track Smart Parking Solutions.</p>
        <div className="flex items-center gap-4">
          <Link to="/about" className="hover:text-gray-300 transition-colors">Privacy</Link>
          <Link to="/about" className="hover:text-gray-300 transition-colors">Terms</Link>
          <Link to="/contact" className="hover:text-gray-300 transition-colors">Security</Link>
          <button
            onClick={() => {
              sessionStorage.removeItem('hasSeen3DIntro');
              window.location.reload();
            }}
            className="px-3 py-1 rounded-full border border-cyan-500/20 text-[11px] font-mono text-cyan-400 hover:bg-cyan-500/10 transition-colors"
          >
            🎬 Replay 3D Intro
          </button>
        </div>
      </div>
    </div>
  </footer>
);

export default Footer;
