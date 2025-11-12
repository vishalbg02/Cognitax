/**
 * Cognitax Landing Page
 * 
 * Author: Vishal
 * Description: Professional landing page for Cognitax tax management platform
 */

import React from 'react';
import { Button } from './ui/button';
import { ArrowRight, FileText, Brain, TrendingUp, Shield, Sparkles, BarChart3 } from 'lucide-react';

const LandingPage = () => {
  const handleLogin = () => {
    window.location.href = '/auth';
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-blue-700 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-2xl font-bold text-blue-900" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                Cognitax
              </span>
              <p className="text-xs text-slate-500">Smart Tax Management</p>
            </div>
          </div>
          <Button 
            onClick={handleLogin}
            data-testid="header-login-btn"
            className="bg-blue-700 hover:bg-blue-800 text-white px-6 py-2 rounded-lg font-medium transition-all"
          >
            Sign In
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 bg-slate-50">
        <div className="max-w-6xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 border border-blue-200 rounded-lg mb-6 slide-up">
            <Sparkles className="w-4 h-4 text-blue-700" />
            <span className="text-sm font-medium text-blue-900">Powered by Gemini 2.0 Flash AI</span>
          </div>
          
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-slate-900 mb-6 leading-tight slide-up" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Smart Tax Management
            <br />
            <span className="text-blue-700">Powered by AI</span>
          </h1>
          
          <p className="text-lg sm:text-xl text-slate-600 mb-10 max-w-3xl mx-auto slide-up">
            Upload your bank statements and get instant tax calculations, comprehensive analytics, and AI-powered financial insights. Built for Indian businesses.
          </p>
          
          <div className="flex flex-wrap items-center justify-center gap-4 slide-up">
            <Button 
              onClick={handleLogin}
              data-testid="hero-get-started-btn"
              className="bg-blue-700 hover:bg-blue-800 text-white px-8 py-6 text-lg rounded-lg font-semibold shadow-sm hover:shadow-md transition-all flex items-center gap-2"
            >
              Get Started Free
              <ArrowRight className="w-5 h-5" />
            </Button>
            <Button 
              variant="outline"
              data-testid="learn-more-btn"
              className="px-8 py-6 text-lg rounded-lg font-semibold border-2 border-slate-300 hover:border-blue-700 hover:bg-blue-50 transition-all"
            >
              Learn More
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Everything You Need for Tax Compliance
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Professional AI-powered tools to simplify your tax analysis and compliance
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard
              icon={<FileText className="w-8 h-8 text-sky-600" />}
              title="Smart PDF Parsing"
              description="Upload bank statements from any Indian bank. AI extracts every transaction with 99%+ accuracy."
            />
            <FeatureCard
              icon={<Brain className="w-8 h-8 text-emerald-600" />}
              title="AI Classification"
              description="Gemini 2.0 Flash automatically categorizes transactions and identifies payment modes."
            />
            <FeatureCard
              icon={<TrendingUp className="w-8 h-8 text-purple-600" />}
              title="Tax Prediction"
              description="Instant GST, ITR, and TDS calculations based on your turnover and transaction patterns."
            />
            <FeatureCard
              icon={<BarChart3 className="w-8 h-8 text-orange-600" />}
              title="Advanced Analytics"
              description="Visual insights with category breakdowns, trends, and cash flow analysis."
            />
            <FeatureCard
              icon={<Shield className="w-8 h-8 text-rose-600" />}
              title="Compliance Tracking"
              description="AI-powered alerts for filing deadlines, anomaly detection, and optimization tips."
            />
            <FeatureCard
              icon={<Sparkles className="w-8 h-8 text-indigo-600" />}
              title="AI Tax Assistant"
              description="Chat with our AI expert for personalized tax advice and instant answers."
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 bg-gradient-to-br from-sky-600 to-emerald-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Ready to Simplify Your Tax Compliance?
          </h2>
          <p className="text-xl text-sky-100 mb-10">
            Join hundreds of businesses using AI to stay compliant and optimize their taxes.
          </p>
          <Button 
            onClick={handleLogin}
            data-testid="cta-start-btn"
            className="bg-white text-sky-600 hover:bg-sky-50 px-10 py-6 text-lg rounded-full font-semibold shadow-xl hover:shadow-2xl transition-all"
          >
            Start Analyzing Now
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 bg-slate-900">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-8 h-8 bg-gradient-to-br from-sky-500 to-emerald-500 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              TaxAI Pro
            </span>
          </div>
          <p className="text-slate-400 text-sm">
            © 2025 TaxAI Pro. Powered by Gemini 2.0 Flash.
          </p>
        </div>
      </footer>
    </div>
  );
};

const FeatureCard = ({ icon, title, description }) => {
  return (
    <div className="p-8 rounded-2xl bg-gradient-to-br from-white to-slate-50 border border-slate-200 card-hover">
      <div className="w-16 h-16 bg-gradient-to-br from-sky-50 to-emerald-50 rounded-xl flex items-center justify-center mb-6">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-slate-900 mb-3" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
        {title}
      </h3>
      <p className="text-slate-600 leading-relaxed">
        {description}
      </p>
    </div>
  );
};

export default LandingPage;