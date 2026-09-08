import { Link } from 'react-router-dom';

const footerNavs: { title: string; items: { label: string; to: string }[] }[] = [
  {
    title: 'Quick Links',
    items: [
      { label: 'Home', to: '/' },
      { label: 'Book Parking', to: '/book-parking' },
      { label: 'Available Slots', to: '/available-slots' },
    ],
  },
  {
    title: 'Support',
    items: [
      { label: 'About Us', to: '/about' },
      { label: 'Contact Support', to: '/contact' },
    ],
  },
  {
    title: 'Portals',
    items: [
      { label: 'User Dashboard', to: '/dashboard' },
      { label: 'Admin Portal', to: '/admin' },
      { label: 'Security Gate', to: '/security' },
    ],
  },
];

const Footer = () => (
  <footer className="bg-dark-elevated border-t border-dark-border py-8">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
              <span className="text-cyan-400 font-bold text-[10px]">P</span>
            </div>
            <span className="text-sm font-extrabold neon-text">ParkEase</span>
          </div>
          <p className="text-xs leading-relaxed text-gray-500">Smart parking solutions for modern cities.</p>
        </div>
        {footerNavs.map((section) => (
          <div key={section.title}>
            <h4 className="text-sm font-bold text-gray-300 mb-3">{section.title}</h4>
            <ul className="space-y-1.5">
              {section.items.map((item) => (
                <li key={item.label}>
                  <Link to={item.to} className="text-xs text-gray-500 hover:text-cyan-400 transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="pt-6 border-t border-dark-border flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-xs text-gray-500">&copy; {new Date().getFullYear()} ParkEase. All rights reserved.</p>
        <button
          onClick={() => {
            sessionStorage.removeItem('hasSeen3DIntro');
            window.location.reload();
          }}
          className="px-3.5 py-1.5 rounded-full glass border border-indigo-500/30 text-xs font-mono font-bold text-indigo-300 hover:bg-indigo-500 hover:text-white transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
        >
          <span>🎬</span> Replay 3D Intro Animation
        </button>
      </div>
    </div>
  </footer>
);

export default Footer;
