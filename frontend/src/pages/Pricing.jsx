/**
 * @file src/pages/Pricing.jsx
 * @description Modern, conversion-focused pricing plans with explicit WhatsApp number confirmation and live Razorpay checkout.
 */
import { useState, useEffect } from 'react';
import { 
  Check, 
  Shield, 
  ArrowRight, 
  MessageSquare, 
  Sparkles, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  X,
  PhoneCall
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuthStore } from '@/store/useAuthStore';
import { useNavigate } from 'react-router-dom';
import { billingApi } from '@/services/billingApi';
import { notificationApi } from '@/services/notificationApi';

export default function Pricing() {
  const { isAuthenticated, user } = useAuthStore();
  const navigate = useNavigate();

  const [subscription, setSubscription] = useState(null);
  const [loadingPlanId, setLoadingPlanId] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // WhatsApp confirmation modal state
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [whatsappPhone, setWhatsappPhone] = useState('');
  const [phoneError, setPhoneError] = useState('');

  // Fetch current user subscription status and saved WhatsApp preferences
  useEffect(() => {
    if (isAuthenticated) {
      billingApi.getStatus()
        .then((sub) => setSubscription(sub))
        .catch(() => {});

      notificationApi.getPreferences()
        .then((pref) => {
          if (pref?.whatsappPhone) {
            setWhatsappPhone(pref.whatsappPhone);
          }
        })
        .catch(() => {});
    }
  }, [isAuthenticated]);

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  // Step 1: When user clicks Upgrade on a plan card
  const handleInitiateUpgrade = (plan) => {
    if (!isAuthenticated) {
      navigate('/login?redirect=/pricing');
      return;
    }

    setErrorMessage('');
    setSuccessMessage('');
    setSelectedPlan(plan);
    setShowPhoneModal(true);
  };

  // Step 2: User confirms WhatsApp number and proceeds to Razorpay
  const handleProceedToPayment = async (e) => {
    e?.preventDefault();
    const cleanPhone = whatsappPhone.trim().replace(/\D/g, '');

    if (!cleanPhone || cleanPhone.length < 10) {
      setPhoneError('Please enter a valid 10-digit mobile number for WhatsApp alerts.');
      return;
    }

    setPhoneError('');
    setShowPhoneModal(false);
    setLoadingPlanId(selectedPlan.id);

    try {
      // 1. Create order on backend
      const orderData = await billingApi.createOrder(selectedPlan.id);

      // 2. Load Razorpay SDK
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) {
        throw new Error('Failed to load Razorpay payment gateway. Please check your internet connection.');
      }

      // 3. Configure Razorpay modal options
      const options = {
        key: orderData.keyId,
        amount: orderData.amount, // in paise
        currency: orderData.currency || 'INR',
        name: 'TenderHub J&K',
        description: `${selectedPlan.name} Subscription`,
        order_id: orderData.orderId,
        prefill: {
          name: orderData.prefill?.name || user?.name || '',
          email: orderData.prefill?.email || user?.email || '',
          contact: cleanPhone,
        },
        theme: {
          color: '#1E3A8A', // Dal Blue
        },
        modal: {
          ondismiss: () => {
            setLoadingPlanId(null);
          }
        },
        handler: async (response) => {
          try {
            setLoadingPlanId(selectedPlan.id);
            // 4. Verify payment cryptographically and activate Pro only upon verified payment
            const verifyRes = await billingApi.verifyPayment({
              orderId: response.razorpay_order_id,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature,
              planId: selectedPlan.id,
              phone: cleanPhone,
            });

            if (verifyRes.success) {
              setSuccessMessage(`🎉 Payment verified! ${selectedPlan.name} activated successfully. Receipt and alert onboarding sent to WhatsApp ${cleanPhone}.`);
              const updatedSub = await billingApi.getStatus();
              setSubscription(updatedSub);
            }
          } catch (err) {
            setErrorMessage(err.response?.data?.message || 'Payment verification failed.');
          } finally {
            setLoadingPlanId(null);
          }
        },
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.on('payment.failed', function (failResponse) {
        setErrorMessage(`Payment Failed: ${failResponse.error?.description || 'Transaction declined.'}`);
        setLoadingPlanId(null);
      });
      paymentObject.open();
    } catch (err) {
      setErrorMessage(err.response?.data?.message || err.message || 'Payment initiation failed.');
      setLoadingPlanId(null);
    }
  };

  const PLANS = [
    {
      id: 'free',
      name: 'Free Starter',
      price: '₹0',
      period: 'forever',
      ratePerDay: 'Free forever',
      badge: 'Basic Access',
      desc: 'Discover active tenders and evaluate public works across J&K.',
      features: [
        'First 15 tender cards unlocked per day',
        'Search across all 20 J&K districts',
        'Save up to 10 bookmarked tenders',
        'Standard portal search helpers',
      ],
      isPopular: false,
      cta: 'Current Plan',
      disabled: true,
    },
    {
      id: 'pro_monthly',
      name: 'Pro Monthly',
      price: '₹10',
      period: '/ month (Test Rate: ₹10)',
      ratePerDay: 'Only ₹10 for testing',
      badge: 'Most Popular',
      desc: 'Everything an active contractor needs to win tenders in their district.',
      features: [
        'Full access to ALL tenders & pagination (no view limits)',
        'Personalized WhatsApp alerts for your Depts & Districts',
        'Instant BOQ Excel & Price Schedule 1-click downloads',
        'Save UNLIMITED tenders & document bookmarks',
        'Corrigendum & bid extension notifications',
        'Priority technical support desk',
      ],
      isPopular: true,
      cta: 'Pay ₹10 & Upgrade',
    },
    {
      id: 'pro_quarterly',
      name: 'Pro Quarterly',
      price: '₹999',
      period: '/ 3 months',
      ratePerDay: '~₹11 / day (Save 17%)',
      badge: 'Working Season',
      desc: 'Tailored for peak bidding seasons from spring through autumn.',
      features: [
        'All Pro Monthly features included',
        'Save 17% compared to monthly renewal',
        'High-priority WhatsApp notification queue',
        'Dedicated contractor relationship liaison',
      ],
      isPopular: false,
      cta: 'Upgrade to Pro Quarterly',
    },
    {
      id: 'pro_annual',
      name: 'Pro Annual',
      price: '₹2,999',
      period: '/ year',
      ratePerDay: 'Only ~₹8 / day (Save 37%)',
      badge: 'Best Value',
      desc: 'Complete peace of mind for established Class A/B engineering firms.',
      features: [
        'All Pro features for a full 365 days',
        'Effective rate of only ₹249/month',
        'Direct phone & WhatsApp priority engineering hotline',
        'Early access to newly automated department scrapers',
      ],
      isPopular: false,
      cta: 'Upgrade to Pro Annual',
    },
  ];

  const hasActiveSub = subscription?.hasActiveSubscription;

  return (
    <div className="min-h-screen bg-paper dark:bg-slate-900 py-10 sm:py-16 px-4 sm:px-6 lg:px-8 transition-colors duration-200">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 text-dalBlue dark:text-blue-300 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" /> Transparent Contractor Pricing
          </div>
          <h1 className="text-3xl sm:text-5xl font-display font-black text-dalBlue dark:text-white tracking-tight">
            Win More J&K Tenders with <span className="text-chinarRed">Pro Intelligence</span>
          </h1>
          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
            Never miss an important contract in your district. Instant WhatsApp alerts, unblurred access across all departments, and 1-click BOQ downloads.
          </p>
        </div>

        {/* Alerts / Feedback */}
        {successMessage && (
          <div className="mt-8 max-w-2xl mx-auto p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
            <div className="text-sm font-medium">{successMessage}</div>
          </div>
        )}

        {errorMessage && (
          <div className="mt-8 max-w-2xl mx-auto p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-rose-600 shrink-0" />
            <div className="text-sm font-medium">{errorMessage}</div>
          </div>
        )}

        {/* Pricing Cards Grid */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
          {PLANS.map((plan) => {
            const isCurrentActivePlan = hasActiveSub && subscription?.planId === plan.id;
            const isLoading = loadingPlanId === plan.id;

            return (
              <div 
                key={plan.id}
                className={`relative flex flex-col justify-between rounded-2xl p-6 transition-all duration-300 ${
                  plan.isPopular 
                    ? 'bg-white dark:bg-slate-800 ring-2 ring-dalBlue dark:ring-blue-500 shadow-xl shadow-blue-500/10 scale-102 z-10' 
                    : 'bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md'
                }`}
              >
                {/* Popular / Best Value Badge */}
                {plan.badge && (
                  <div className={`absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-bold tracking-wide shadow-xs ${
                    plan.isPopular 
                      ? 'bg-chinarRed text-white' 
                      : 'bg-slate-700 text-white dark:bg-slate-600'
                  }`}>
                    {plan.badge}
                  </div>
                )}

                <div>
                  <div className="text-lg font-bold text-slate-900 dark:text-white mt-1">
                    {plan.name}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 min-h-[32px]">
                    {plan.desc}
                  </p>

                  {/* Price */}
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-3xl sm:text-4xl font-black text-dalBlue dark:text-white">
                      {plan.price}
                    </span>
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                      {plan.period}
                    </span>
                  </div>
                  <div className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 mt-0.5">
                    {plan.ratePerDay}
                  </div>

                  {/* Feature Checklist */}
                  <div className="mt-6 border-t border-slate-100 dark:border-slate-700 pt-5 space-y-3">
                    {plan.features.map((perk, idx) => (
                      <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300">
                        <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{perk}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Call to Action Button */}
                <div className="mt-8 pt-4 border-t border-slate-100 dark:border-slate-700">
                  {isCurrentActivePlan ? (
                    <div className="w-full py-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-center font-bold text-xs flex items-center justify-center gap-1.5 border border-emerald-200 dark:border-emerald-800">
                      <CheckCircle2 className="w-4 h-4" /> Active Plan
                    </div>
                  ) : plan.disabled ? (
                    <Button 
                      variant="outline" 
                      className="w-full text-xs font-semibold cursor-default opacity-60" 
                      disabled
                    >
                      {plan.cta}
                    </Button>
                  ) : (
                    <Button
                      variant={plan.isPopular ? 'primary' : 'outline'}
                      className="w-full text-xs font-bold py-2.5 shadow-sm"
                      onClick={() => handleInitiateUpgrade(plan)}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                          Opening Payment...
                        </>
                      ) : (
                        <>
                          {plan.cta}
                          <ArrowRight className="w-3.5 h-3.5 ml-1" />
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Trust & Guarantee Banner */}
        <div className="mt-16 bg-white dark:bg-slate-800 rounded-2xl p-6 sm:p-8 border border-slate-200 dark:border-slate-700 shadow-sm max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/40 text-dalBlue dark:text-blue-400 flex items-center justify-center shrink-0">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Zero Risk • Instant Online Activation
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Pay securely via UPI (Google Pay, PhonePe, Paytm), Netbanking, or Debit Cards. Cancel anytime.
              </p>
            </div>
          </div>
          <div className="shrink-0 flex items-center gap-3">
            <Button 
              variant="outline" 
              className="text-xs font-semibold"
              onClick={() => navigate('/contact')}
            >
              Need Enterprise Help?
            </Button>
          </div>
        </div>

      </div>

      {/* Explicit WhatsApp Confirmation Modal */}
      {showPhoneModal && selectedPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-5">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center shrink-0">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Confirm WhatsApp Alerts Number
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Plan: <span className="font-semibold text-dalBlue dark:text-blue-400">{selectedPlan.name} ({selectedPlan.price})</span>
                  </p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setShowPhoneModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleProceedToPayment} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <PhoneCall className="w-3.5 h-3.5 text-emerald-600" /> Enter WhatsApp Mobile Number
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                    +91
                  </span>
                  <Input
                    type="tel"
                    placeholder="9876543210"
                    value={whatsappPhone}
                    onChange={(e) => {
                      setWhatsappPhone(e.target.value);
                      if (phoneError) setPhoneError('');
                    }}
                    className="pl-11 text-xs font-mono font-bold"
                    autoFocus
                  />
                </div>
                {phoneError && (
                  <p className="text-[11px] text-rose-500 mt-1 font-medium">{phoneError}</p>
                )}
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                  We will send your payment receipt and instant tender alerts matching your departments to this WhatsApp number.
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-2.5">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowPhoneModal(false)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  variant="primary"
                  className="text-xs font-bold bg-dalBlue hover:bg-dalBlue-700 text-white shadow-xs"
                >
                  Proceed to Pay {selectedPlan.price}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}