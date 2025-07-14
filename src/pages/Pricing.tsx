import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Star } from 'lucide-react';
import Button from '../components/ui/Button';
import { Card, CardContent, CardHeader } from '../components/ui/Card';

const Pricing: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="max-w-6xl mx-auto space-y-16">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-slate-100 mb-4">
          Choose Your Plan
        </h1>
        <p className="text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
          Start for free and upgrade as your needs grow. All plans include our core features.
        </p>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {pricingPlans.map((plan, index) => (
          <Card key={index} className={`relative ${plan.featured ? 'ring-2 ring-blue-500 scale-105' : ''}`}>
            {plan.featured && (
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-medium">
                  Most Popular
                </span>
              </div>
            )}
            <CardHeader>
              <div className="text-center">
                <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                  {plan.name}
                </h3>
                <div className="text-4xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                  ${plan.price}
                  <span className="text-lg text-slate-500 dark:text-slate-400">/month</span>
                </div>
                <p className="text-slate-600 dark:text-slate-300">{plan.description}</p>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-green-500" />
                    <span className="text-slate-700 dark:text-slate-300">{feature}</span>
                  </li>
                ))}
              </ul>
              <Button
                onClick={() => navigate(plan.price === 0 ? '/register' : '/register')}
                variant={plan.featured ? 'primary' : 'outline'}
                className="w-full"
              >
                {plan.price === 0 ? 'Get Started Free' : 'Start Free Trial'}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Enterprise */}
      <Card className="bg-gradient-to-r from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
        <CardContent className="p-8">
          <div className="text-center">
            <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4">
              Enterprise Solution
            </h3>
            <p className="text-slate-600 dark:text-slate-300 mb-6 max-w-2xl mx-auto">
              Need more than our standard plans offer? We'll work with you to create a custom solution
              that fits your organization's specific needs.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="text-center">
                <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
                  Custom Integration
                </h4>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  API integrations, webhooks, and custom workflows
                </p>
              </div>
              <div className="text-center">
                <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
                  Dedicated Support
                </h4>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  24/7 support with dedicated account manager
                </p>
              </div>
              <div className="text-center">
                <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
                  White-Label Solution
                </h4>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Complete branding control and custom domains
                </p>
              </div>
            </div>
            <Button size="lg">
              Contact Sales
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* FAQ */}
      <div className="space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-slate-600 dark:text-slate-300">
            Get answers to common questions about our pricing and features
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {faqs.map((faq, index) => (
            <Card key={index}>
              <CardContent className="p-6">
                <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-3">
                  {faq.question}
                </h3>
                <p className="text-slate-600 dark:text-slate-300">
                  {faq.answer}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

const pricingPlans = [
  {
    name: 'Free',
    price: 0,
    description: 'Perfect for personal use',
    featured: false,
    features: [
      '10 links per month',
      'Basic click analytics',
      'QR code generation',
      '30-day link expiry',
      'Community support',
      'Mobile app access'
    ]
  },
  {
    name: 'Professional',
    price: 29,
    description: 'For serious marketers',
    featured: true,
    features: [
      'Unlimited links',
      'Advanced analytics & reporting',
      'Custom domains (1 included)',
      'A/B testing',
      'Password protection',
      'API access (10K calls/month)',
      'Priority support',
      'Team collaboration (5 members)',
      'Custom QR codes'
    ]
  },
  {
    name: 'Enterprise',
    price: 99,
    description: 'For large organizations',
    featured: false,
    features: [
      'Everything in Professional',
      'Unlimited custom domains',
      'White-label solution',
      'SSO & SAML integration',
      'Advanced security features',
      'Unlimited API calls',
      'Custom integrations',
      'Dedicated account manager',
      'Service level agreement'
    ]
  }
];

const faqs = [
  {
    question: 'Can I upgrade or downgrade my plan anytime?',
    answer: 'Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately, and we\'ll prorate the billing accordingly.'
  },
  {
    question: 'What happens to my links if I downgrade?',
    answer: 'Your existing links will continue to work. However, you\'ll be limited to the features available in your new plan for new links.'
  },
  {
    question: 'Is there a free trial for paid plans?',
    answer: 'Yes! We offer a 14-day free trial for all paid plans. No credit card required to start your trial.'
  },
  {
    question: 'Do you offer discounts for annual payments?',
    answer: 'Yes! Pay annually and save 20% on all plans. The discount is applied automatically when you choose annual billing.'
  },
  {
    question: 'What kind of support do you provide?',
    answer: 'Free users get community support, Professional users get priority email support, and Enterprise users get dedicated phone support.'
  },
  {
    question: 'Can I use my own domain?',
    answer: 'Yes! Professional and Enterprise plans include custom domain support. You can use your own domain for branded short links.'
  }
];

export default Pricing;