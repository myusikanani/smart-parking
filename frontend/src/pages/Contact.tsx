import { useState, type FormEvent } from 'react';
import { motion } from 'framer-motion';
import {
  HiOutlineMapPin,
  HiOutlinePhone,
  HiOutlineEnvelope,
  HiOutlineClock,
  HiOutlinePaperAirplane,
  HiOutlineCheckCircle,
} from 'react-icons/hi2';
import { ElectricCar } from '../components/vehicles';
import ContactHero3D from '../components/3d/ContactHero3D';

interface FormData {
  fullName: string;
  email: string;
  subject: string;
  message: string;
}

const contactInfo = [
  { icon: HiOutlineMapPin, label: 'Address', value: '742 Innovation Drive, Suite 200, San Francisco, CA 94105', color: 'text-[#06b6d4]' },
  { icon: HiOutlinePhone, label: 'Phone', value: '+1 (555) 123-4567', color: 'text-[#10b981]' },
  { icon: HiOutlineEnvelope, label: 'Email', value: 'support@parksmart.io', color: 'text-[#ec4899]' },
  { icon: HiOutlineClock, label: 'Working Hours', value: 'Mon - Fri: 8:00 AM - 8:00 PM', color: 'text-[#06b6d4]' },
];

const Contact = () => {
  const [form, setForm] = useState<FormData>({ fullName: '', email: '', subject: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Partial<FormData>>({});

  const validate = () => {
    const errs: Partial<FormData> = {};
    if (!form.fullName.trim()) errs.fullName = 'Full name is required';
    if (!form.email.trim()) errs.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Invalid email address';
    if (!form.subject.trim()) errs.subject = 'Subject is required';
    if (!form.message.trim()) errs.message = 'Message is required';
    return errs;
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length === 0) {
      setSubmitted(true);
      setForm({ fullName: '', email: '', subject: '', message: '' });
      setTimeout(() => setSubmitted(false), 5000);
    }
  };

  const handleChange = (field: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  return (
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
            Contact
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.25, 0.1, 0.25, 1], delay: 0.15 }}
            className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-6 relative"
          >
            <div className="absolute right-0 -top-12 opacity-15 hidden sm:block">
              <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 3 }}>
                <ElectricCar className="w-24 h-auto" color="#10b981" />
              </motion.div>
            </div>
            Get in{' '}
            <span className="neon-text">
              Touch
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.25, 0.1, 0.25, 1], delay: 0.3 }}
            className="text-lg max-w-2xl mx-auto leading-relaxed" style={{ color: 'var(--text-secondary)' }}
          >
            Have a question, feedback, or want to partner with us? We would love to hear from you.
          </motion.p>
        </div>
      </section>

      <section className="pb-24 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto -mt-10 relative z-10">
        <div className="grid lg:grid-cols-5 gap-8 items-start">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, ease: [0.25, 0.1, 0.25, 1], delay: 0.4 }}
            className="lg:col-span-3"
          >
            <div className="glass-card p-8 sm:p-10">
              <h2 className="text-2xl font-bold mb-6">Send us a message</h2>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid sm:grid-cols-2 gap-5">
                  <div>
                    <label htmlFor="fullName" className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                      Full Name
                    </label>
                    <input
                      id="fullName"
                      value={form.fullName}
                      onChange={(e) => handleChange('fullName', e.target.value)}
                      className={`input-neon w-full ${errors.fullName ? '!border-red-500' : ''}`}
                      placeholder="John Doe"
                    />
                    {errors.fullName && <p className="mt-1 text-xs text-red-400">{errors.fullName}</p>}
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                      Email
                    </label>
                    <input
                      id="email"
                      type="email"
                      value={form.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      className={`input-neon w-full ${errors.email ? '!border-red-500' : ''}`}
                      placeholder="john@example.com"
                    />
                    {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email}</p>}
                  </div>
                </div>
                <div>
                  <label htmlFor="subject" className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                    Subject
                  </label>
                  <input
                    id="subject"
                    value={form.subject}
                    onChange={(e) => handleChange('subject', e.target.value)}
                    className={`input-neon w-full ${errors.subject ? '!border-red-500' : ''}`}
                    placeholder="How can we help?"
                  />
                  {errors.subject && <p className="mt-1 text-xs text-red-400">{errors.subject}</p>}
                </div>
                <div>
                  <label htmlFor="message" className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                    Message
                  </label>
                  <textarea
                    id="message"
                    rows={5}
                    value={form.message}
                    onChange={(e) => handleChange('message', e.target.value)}
                    className={`input-neon resize-none w-full ${errors.message ? '!border-red-500' : ''}`}
                    placeholder="Tell us more about your inquiry..."
                  />
                  {errors.message && <p className="mt-1 text-xs text-red-400">{errors.message}</p>}
                </div>
                <button
                  type="submit"
                  className="btn-neon px-8 py-3 flex items-center gap-2 text-sm"
                >
                  <HiOutlinePaperAirplane className="w-4 h-4" />
                  Send Message
                </button>
              </form>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, ease: [0.25, 0.1, 0.25, 1], delay: 0.5 }}
            className="lg:col-span-2 space-y-6"
          >
            {contactInfo.map((info, i) => (
              <motion.div
                key={info.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.6 + i * 0.1 }}
              >
                <div className="glass-card p-5 flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'var(--glass-bg)' }}>
                    <info.icon className={`w-5 h-5 ${info.color}`} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest mb-0.5" style={{ color: 'var(--text-muted)' }}>
                      {info.label}
                    </p>
                    <p className="text-sm text-gray-200">{info.value}</p>
                  </div>
                </div>
              </motion.div>
            ))}

            <div className="rounded-3xl overflow-hidden border border-[var(--border)] shadow-xl">
              <ContactHero3D />
            </div>
          </motion.div>
        </div>
      </section>

      {submitted && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          className="fixed bottom-6 right-6 z-50"
        >
          <div className="glass-card px-6 py-4 flex items-center gap-3" style={{ boxShadow: '0 0 20px rgba(16, 185, 129, 0.3)' }}>
            <HiOutlineCheckCircle className="w-6 h-6 text-[#10b981] flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-[#10b981]">Message sent!</p>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>We will get back to you soon.</p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default Contact;
