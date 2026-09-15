import { Link } from 'react-router-dom';

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
  <footer className="bg-[#030d22] border-t border-cyan-500/15 py-12 text-gray-400">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-10">
        <div className="col-span-2">
          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/25">
              <span className="text-white font-bold text-sm">P</span>
            </div>
            <span className="text-xl font-extrabold text-white tracking-wide font-space">
              Park<span className="text-cyan-400">Ease</span>
            </span>
          </div>
          <p className="text-xs text-gray-400 max-w-sm mb-4 font-sans leading-relaxed">
            Autonomous Ecosystem Platforms. Next-generation smart parking infrastructure powered by real-time IoT sensors and 3D navigation.
          </p>
          <div className="flex items-center gap-2.5 text-xs text-emerald-400 font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>All Systems Operational • 99.98% Uptime</span>
          </div>
        </div>

        {footerNavs.map((section) => (
          <div key={section.title}>
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-200 mb-3.5 font-space">{section.title}</h4>
            <ul className="space-y-2">
              {section.items.map((item) => (
                <li key={item.label}>
                  <Link to={item.to} className="text-xs text-gray-400 hover:text-cyan-300 transition-colors font-sans">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500 font-mono">
        <p>&copy; {new Date().getFullYear()} ParkEase Inc. • All rights reserved • Model 100-243</p>
        <div className="flex items-center gap-4">
          <Link to="/about" className="hover:text-gray-300 transition-colors">Privacy</Link>
          <Link to="/about" className="hover:text-gray-300 transition-colors">Terms</Link>
          <Link to="/contact" className="hover:text-gray-300 transition-colors">Security</Link>
          <span className="text-emerald-400 flex items-center gap-1.5 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
            Status • All systems Operational
          </span>
        </div>
      </div>
    </div>
  </footer>
);

export default Footer;

