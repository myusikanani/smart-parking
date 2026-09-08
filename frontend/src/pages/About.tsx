import { useRef, type ReactNode } from 'react';
import { motion, useInView } from 'framer-motion';
import {
  HiOutlineLightBulb,
  HiOutlineShieldCheck,
  HiOutlineChartBarSquare,
  HiOutlineEye,
  HiOutlineCodeBracketSquare,
  HiOutlineServerStack,
  HiOutlineDevicePhoneMobile,
  HiOutlineGlobeAlt,
  HiOutlineLockClosed,
} from 'react-icons/hi2';
import { CarSedan } from '../components/vehicles';
import AboutHero3D from '../components/3d/AboutHero3D';

const Reveal = ({ children, delay = 0 }: { children: ReactNode; delay?: number }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-100px' });
  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
      variants={{
        hidden: { opacity: 0, y: 40 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.25, 0.1, 0.25, 1], delay } },
      }}
    >
      {children}
    </motion.div>
  );
};

const team = [
  { initials: 'AK', name: 'Arjun Khanna', role: 'Founder & CEO' },
  { initials: 'SM', name: 'Sofia Martinez', role: 'CTO' },
  { initials: 'LW', name: 'Liam Wu', role: 'Lead Designer' },
  { initials: 'PR', name: 'Priya Rajan', role: 'Head of Operations' },
];

const technologies = [
  { icon: HiOutlineCodeBracketSquare, name: 'React & TypeScript', color: 'text-[#06b6d4]' },
  { icon: HiOutlineServerStack, name: 'Node.js', color: 'text-[#10b981]' },
  { icon: HiOutlineGlobeAlt, name: 'Tailwind CSS', color: 'text-[#ec4899]' },
  { icon: HiOutlineDevicePhoneMobile, name: 'PWA', color: 'text-[#06b6d4]' },
  { icon: HiOutlineLockClosed, name: 'AES-256', color: 'text-[#10b981]' },
  { icon: HiOutlineChartBarSquare, name: 'Analytics', color: 'text-[#ec4899]' },
];

const values = [
  {
    icon: HiOutlineLightBulb,
    title: 'Innovation',
    description: 'We leverage cutting-edge technology to redefine urban parking — from QR-based access to real-time analytics.',
    iconColor: 'text-[#06b6d4]',
  },
  {
    icon: HiOutlineShieldCheck,
    title: 'Security',
    description: 'Your data and transactions are protected with enterprise-grade encryption and compliance standards.',
    iconColor: 'text-[#10b981]',
  },
  {
    icon: HiOutlineChartBarSquare,
    title: 'Efficiency',
    description: 'Every feature is built to save time — for drivers, lot owners, and city planners alike.',
    iconColor: 'text-[#ec4899]',
  },
  {
    icon: HiOutlineEye,
    title: 'Accessibility',
    description: 'We design for everyone. Inclusive interfaces, multi-language support, and assistive technology compatibility.',
    iconColor: 'text-[#06b6d4]',
  },
];

const About = () => (
  <div className="min-h-screen overflow-x-hidden" style={{ backgroundColor: 'var(--bg)', color: 'var(--text)' }}>
    <section className="relative py-32 px-4 sm:px-6 lg:px-8 overflow-hidden grid-bg">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-10 left-10 w-72 h-72 bg-[#06b6d4]/10 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-[#ec4899]/10 rounded-full blur-3xl" />
      </div>
      <div className="relative z-10 max-w-4xl mx-auto text-center">
        <motion.span
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
          className="inline-block px-4 py-1.5 mb-6 text-xs font-semibold uppercase tracking-widest text-[#06b6d4] glass rounded-full border border-[#06b6d4]/20"
        >
          About Us
        </motion.span>
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.25, 0.1, 0.25, 1], delay: 0.15 }}
          className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-6 relative"
        >
          <div className="absolute right-0 -top-12 opacity-15 hidden sm:block">
            <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 3 }}>
              <CarSedan className="w-24 h-auto" color="#06b6d4" />
            </motion.div>
          </div>
          About{' '}
          <span className="neon-text">
            ParkEase
          </span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.25, 0.1, 0.25, 1], delay: 0.3 }}
          className="text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed mb-8" style={{ color: 'var(--text-secondary)' }}
        >
          Transforming urban mobility with intelligent parking solutions. We make finding a parking spot as simple as tapping your phone.
        </motion.p>

        {/* 3D SMART CITY ECOSYSTEM CANVAS */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="max-w-3xl mx-auto mt-6"
        >
          <AboutHero3D />
        </motion.div>
      </div>
    </section>

    <Reveal>
      <section className="px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto pb-24 -mt-10 relative z-10">
        <div className="glass-card p-10 sm:p-14 text-center relative overflow-hidden border-l-4 border-l-[#06b6d4]">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -top-20 -left-20 w-60 h-60 bg-[#06b6d4]/5 rounded-full blur-3xl" />
            <div className="absolute -bottom-20 -right-20 w-60 h-60 bg-[#ec4899]/5 rounded-full blur-3xl" />
          </div>
          <div className="relative z-10">
            <h2 className="text-3xl sm:text-4xl font-bold mb-6">Our Mission</h2>
            <p className="text-lg max-w-3xl mx-auto leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              To eliminate the frustration of urban parking by creating a seamless, secure, and intelligent ecosystem
              that connects drivers with available spaces in real time — reducing congestion, saving time, and lowering emissions.
            </p>
          </div>
        </div>
      </section>
    </Reveal>

    <section className="py-24 px-4 sm:px-6 lg:px-8">
      <Reveal>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1.5 mb-4 text-xs font-semibold uppercase tracking-widest text-[#ec4899] bg-[#ec4899]/10 rounded-full border border-[#ec4899]/20">
              Our Story
            </span>
            <h2 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">How it all began</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
            >
              <h3 className="text-2xl font-semibold mb-4">From frustration to innovation</h3>
              <div className="relative pl-8 border-l-2 border-[#06b6d4]/30 space-y-8">
                <div className="relative">
                  <div className="absolute -left-[1.35rem] w-3 h-3 rounded-full bg-[#06b6d4]" />
                  <p className="leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                    ParkEase was born in 2023 when our founders spent 45 minutes circling a downtown block looking for parking before missing an important meeting. That evening, they decided there had to be a better way.
                  </p>
                </div>
                <div className="relative">
                  <div className="absolute -left-[1.35rem] w-3 h-3 rounded-full bg-[#ec4899]" />
                  <p className="leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                    Combining expertise in IoT, software engineering, and urban planning, the team built the first prototype in a small garage. Within months, the system was managing 50 parking slots across three lots.
                  </p>
                </div>
                <div className="relative">
                  <div className="absolute -left-[1.35rem] w-3 h-3 rounded-full bg-[#10b981]" />
                  <p className="leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                    Today, ParkEase powers over 10,000 parking spaces in 50+ locations, processing thousands of transactions daily. But our mission remains the same: make parking effortless for everyone.
                  </p>
                </div>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, ease: [0.25, 0.1, 0.25, 1], delay: 0.2 }}
            >
              <div className="relative w-full aspect-square">
                <div className="absolute inset-0 bg-[#06b6d4]/10 rounded-[40px] rotate-6" />
                <div className="absolute inset-0 bg-[#ec4899]/10 rounded-[40px] -rotate-3" />
                <div className="absolute inset-4 glass rounded-[32px] flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-6xl font-bold neon-text">2023</div>
                    <p className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>Founded in Silicon Valley</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </Reveal>
    </section>

    <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
      <Reveal>
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-1.5 mb-4 text-xs font-semibold uppercase tracking-widest text-orange-400 bg-orange-500/10 rounded-full border border-orange-500/20">
            Team
          </span>
          <h2 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">Meet the people behind ParkEase</h2>
          <p className="text-lg max-w-2xl mx-auto" style={{ color: 'var(--text-secondary)' }}>
            A passionate team dedicated to solving urban parking challenges.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {team.map((member, i) => (
            <motion.div
              key={member.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
            >
              <div className="glass-card p-6 text-center group cursor-default">
                <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-105 transition-transform duration-300" style={{ background: 'linear-gradient(135deg, #06b6d4, #ec4899)' }}>
                  <span className="text-2xl font-bold text-white">{member.initials}</span>
                </div>
                <h3 className="text-lg font-semibold mb-1">{member.name}</h3>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{member.role}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </Reveal>
    </section>

    <section className="py-24 px-4 sm:px-6 lg:px-8">
      <Reveal>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1.5 mb-4 text-xs font-semibold uppercase tracking-widest text-[#06b6d4] bg-[#06b6d4]/10 rounded-full border border-[#06b6d4]/20">
              Technology
            </span>
            <h2 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">Built with modern tech</h2>
            <p className="text-lg max-w-2xl mx-auto" style={{ color: 'var(--text-secondary)' }}>
              Our stack is chosen for performance, scalability, and developer experience.
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {technologies.map((tech, i) => (
              <motion.div
                key={tech.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-30px' }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
              >
                <div className="glass-card p-5 text-center h-full flex flex-col items-center justify-center group">
                  <tech.icon className={`w-8 h-8 ${tech.color} mb-3 group-hover:scale-110 transition-transform duration-300`} />
                  <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>{tech.name}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </Reveal>
    </section>

    <Reveal>
      <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-1.5 mb-4 text-xs font-semibold uppercase tracking-widest text-[#ec4899] bg-[#ec4899]/10 rounded-full border border-[#ec4899]/20">
            Values
          </span>
          <h2 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">What we stand for</h2>
            <p className="text-lg max-w-2xl mx-auto" style={{ color: 'var(--text-secondary)' }}>
            Core principles that guide every decision we make.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {values.map((v, i) => (
            <motion.div
              key={v.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
            >
              <div className="glass-card p-6 h-full group">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300" style={{ backgroundColor: 'var(--glass-bg)' }}>
                  <v.icon className={`w-6 h-6 ${v.iconColor}`} />
                </div>
                <h3 className="text-lg font-semibold mb-2">{v.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{v.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>
    </Reveal>
  </div>
);

export default About;
