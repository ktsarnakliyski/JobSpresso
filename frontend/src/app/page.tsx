// frontend/src/app/page.tsx

import Link from 'next/link';
import { Card, Button } from '@/components/ui';

function FeatureIcon({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <div className={`w-12 h-12 ${color} rounded-2xl flex items-center justify-center`}>
      {children}
    </div>
  );
}

export default function Home() {
  return (
    <div className="space-y-20">
      {/* Hero Section */}
      <section className="text-center pt-8 pb-4">
        <div className="animate-fade-up">
          <h1 className="text-4xl sm:text-5xl font-bold text-navy-900 mb-5 tracking-tight text-balance">
            A Fresh Shot for Your{' '}
            <span className="gradient-text">Job Descriptions</span>
          </h1>
          <p className="text-lg text-navy-600 max-w-2xl mx-auto mb-10 text-balance leading-relaxed">
            Analyze job descriptions for inclusivity, clarity, and effectiveness.
            Generate new ones that attract the right candidates.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/analyze">
              <Button size="lg">
                Start Analyzing
              </Button>
            </Link>
            <Link href="/generate">
              <Button variant="secondary" size="lg">
                Create New
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="grid md:grid-cols-3 gap-6">
        <Card hover className="animate-fade-up [animation-delay:100ms] opacity-0">
          <div className="space-y-4">
            <FeatureIcon color="bg-sky-100">
              <svg className="w-6 h-6 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </FeatureIcon>
            <h3 className="text-lg font-semibold text-navy-900">Score & Analyze</h3>
            <p className="text-navy-600 leading-relaxed">
              Get a detailed breakdown of your job description across inclusivity,
              readability, structure, and more.
            </p>
          </div>
        </Card>

        <Card hover className="animate-fade-up [animation-delay:200ms] opacity-0">
          <div className="space-y-4">
            <FeatureIcon color="bg-emerald-100">
              <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </FeatureIcon>
            <h3 className="text-lg font-semibold text-navy-900">Smart Suggestions</h3>
            <p className="text-navy-600 leading-relaxed">
              Receive actionable suggestions to improve your posting with specific
              issues and recommended fixes.
            </p>
          </div>
        </Card>

        <Card hover className="animate-fade-up [animation-delay:300ms] opacity-0">
          <div className="space-y-4">
            <FeatureIcon color="bg-violet-100">
              <svg className="w-6 h-6 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </FeatureIcon>
            <h3 className="text-lg font-semibold text-navy-900">Voice Profiles</h3>
            <p className="text-navy-600 leading-relaxed">
              Create profiles that match your company voice to ensure consistency
              across all job descriptions.
            </p>
          </div>
        </Card>
      </section>

      {/* How it works */}
      <section className="space-y-10">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-navy-900 mb-3">How It Works</h2>
          <p className="text-navy-600">Three simple steps to better job descriptions</p>
        </div>
        <div className="grid md:grid-cols-3 gap-12">
          <div className="text-center animate-fade-up [animation-delay:100ms] opacity-0">
            <div className="w-12 h-12 bg-navy-800 text-white rounded-2xl flex items-center justify-center mx-auto mb-5 font-bold text-lg shadow-soft-md">
              1
            </div>
            <h3 className="font-semibold text-navy-900 mb-3">Paste or Create</h3>
            <p className="text-navy-600 leading-relaxed">
              Paste an existing job description to analyze, or fill in the details to generate a new one.
            </p>
          </div>
          <div className="text-center animate-fade-up [animation-delay:200ms] opacity-0">
            <div className="w-12 h-12 bg-navy-800 text-white rounded-2xl flex items-center justify-center mx-auto mb-5 font-bold text-lg shadow-soft-md">
              2
            </div>
            <h3 className="font-semibold text-navy-900 mb-3">Select a Voice</h3>
            <p className="text-navy-600 leading-relaxed">
              Choose a voice profile to match your company tone, or use the default settings.
            </p>
          </div>
          <div className="text-center animate-fade-up [animation-delay:300ms] opacity-0">
            <div className="w-12 h-12 bg-navy-800 text-white rounded-2xl flex items-center justify-center mx-auto mb-5 font-bold text-lg shadow-soft-md">
              3
            </div>
            <h3 className="font-semibold text-navy-900 mb-3">Get Results</h3>
            <p className="text-navy-600 leading-relaxed">
              Receive a detailed assessment or a polished job description ready to publish.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="animate-fade-up [animation-delay:400ms] opacity-0">
        <Card padding="lg" className="text-center bg-gradient-to-br from-navy-50 to-white">
          <h2 className="text-2xl font-bold text-navy-900 mb-3">Ready to get started?</h2>
          <p className="text-navy-600 mb-6 max-w-md mx-auto">
            Start creating better job descriptions today. No signup required.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/analyze">
              <Button>
                Try It Now
              </Button>
            </Link>
          </div>
        </Card>
      </section>
    </div>
  );
}
