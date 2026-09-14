/**
 * @file src/pages/Contact.jsx
 * @description Support and sales touchpoint utilizing customized form inputs.
 */
import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function Contact() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-paper py-16 px-4 sm:px-6 lg:px-8 flex items-center">
      <div className="max-w-5xl w-full mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 bg-white border border-border rounded-2xl p-8 sm:p-12 shadow-subtle">
        
        <div className="space-y-8">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-chinarRed">Support & Sales</span>
            <h1 className="text-3xl font-extrabold text-dalBlue mt-2">Get in Touch</h1>
            <p className="text-sm text-charcoal/70 mt-3 leading-relaxed font-medium">
              Need assistance setting up automated portal alerts or integrating our API? Contact our engineering desk.
            </p>
          </div>
          <div className="space-y-5 text-sm text-charcoal font-medium">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-dalBlue/10 text-dalBlue flex items-center justify-center shrink-0">
                <MapPin className="w-4 h-4" />
              </div>
              <span>NIT Campus, Hazratbal, Srinagar, J&K 190006</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-dalBlue/10 text-dalBlue flex items-center justify-center shrink-0">
                <Mail className="w-4 h-4" />
              </div>
              <span>support@tenderhub.in</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-dalBlue/10 text-dalBlue flex items-center justify-center shrink-0">
                <Phone className="w-4 h-4" />
              </div>
              <span>+91 (0194) 242-XXXX</span>
            </div>
          </div>
        </div>

        <div>
          {submitted ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 bg-successGreen/5 rounded-2xl border border-successGreen/20">
              <CheckCircle2 className="w-12 h-12 text-successGreen mb-4" />
              <h3 className="text-xl font-bold text-dalBlue mb-2">Message Dispatched</h3>
              <p className="text-sm font-medium text-charcoal/70">An operations officer will respond within 24 business hours.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-charcoal mb-1.5">Full Name</label>
                <Input required placeholder="Ravi Shankar" />
              </div>
              <div>
                <label className="block text-xs font-bold text-charcoal mb-1.5">Work Email</label>
                <Input type="email" required placeholder="contact@domain.com" />
              </div>
              <div>
                <label className="block text-xs font-bold text-charcoal mb-1.5">Request Details</label>
                {/* Standardized textarea mimicking the Input primitive's classes */}
                <textarea
                  required rows="4"
                  placeholder="Describe your inquiry..."
                  className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-charcoal placeholder:text-charcoal/40 focus:outline-none focus:ring-2 focus:ring-dalBlue/30 focus:border-dalBlue transition-all"
                ></textarea>
              </div>
              <Button type="submit" className="w-full gap-2 mt-2">
                Send Message <Send className="w-4 h-4" />
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}