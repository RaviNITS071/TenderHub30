/**
 * @file src/pages/Pricing.jsx
 * @description Clear tier structure highlighting features for different contractor scales.
 */
import React from 'react';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function Pricing() {
  const plans = [
    {
      name: 'Contractor Free',
      price: '₹0',
      period: 'forever',
      desc: 'Ideal for independent contractors searching manually.',
      perks: ['Search active tenders', 'Save up to 10 favorite tenders', 'Direct official links', 'Basic filtering'],
      cta: 'Current Plan',
      popular: false,
    },
    {
      name: 'Pro Intelligence',
      price: '₹2,499',
      period: 'per month',
      desc: 'Engineered for active bidders who cannot afford to miss caveats.',
      perks: ['Unlimited AI Document Parsing', 'Corrigendum WhatsApp Alerts', 'Automated Turnover Scoring', 'Export Pipeline to CSV'],
      cta: 'Upgrade to Pro',
      popular: true,
    },
    {
      name: 'Enterprise API',
      price: '₹7,999',
      period: 'per month',
      desc: 'Full API access and multi-user seats for infrastructure consortia.',
      perks: ['All Pro features', 'Custom Webhooks for ERP', 'Multi-user Access (10 seats)', 'Priority Regional Support'],
      cta: 'Contact Sales',
      popular: false,
    },
  ];

  return (
    <div className="min-h-screen bg-paper py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-dalBlue tracking-tight">Invest in Intelligence.</h1>
          <p className="text-base text-charcoal/70 font-medium">
            Winning a single additional contract pays for TenderHub for years. Choose your bidding volume.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
          {plans.map((plan, i) => (
            <div key={i} className={`bg-white rounded-2xl p-8 border flex flex-col justify-between relative transition-all ${
                plan.popular ? 'border-chinarRed shadow-xl scale-100 lg:scale-105 z-10' : 'border-border shadow-subtle'
              }`}>
              {plan.popular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-chinarRed text-white text-[11px] font-bold uppercase tracking-wider px-4 py-1 rounded-full shadow-md whitespace-nowrap">
                  Most Popular
                </div>
              )}

              <div>
                <h3 className="text-xl font-bold text-dalBlue">{plan.name}</h3>
                <p className="text-sm text-charcoal/60 mt-2 font-medium h-12">{plan.desc}</p>
                <div className="my-6">
                  <span className="text-4xl font-extrabold text-charcoal">{plan.price}</span>
                  <span className="text-sm font-bold text-charcoal/50 ml-1.5">/ {plan.period}</span>
                </div>
                <div className="space-y-3.5 pt-6 border-t border-border">
                  <span className="block text-xs font-bold uppercase text-charcoal/40 tracking-wider">Includes:</span>
                  {plan.perks.map((perk, idx) => (
                    <div key={idx} className="flex items-start gap-3 text-sm text-charcoal font-medium">
                      <Check className="w-4 h-4 text-successGreen shrink-0 mt-0.5" /> <span>{perk}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="pt-8">
                <Button 
                  variant={plan.popular ? 'destructive' : 'outline'} 
                  className="w-full py-6 text-sm"
                >
                  {plan.cta}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}