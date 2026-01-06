// frontend/src/app/page.tsx

import Link from 'next/link';
import { Card, Button } from '@/components/ui';

export default function Home() {
  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="text-center py-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          A Fresh Shot for Your Job Descriptions
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
          Analyze job descriptions for inclusivity, clarity, and effectiveness.
          Generate new ones that attract the right candidates.
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/analyze">
            <Button size="lg">
              Analyze a JD
            </Button>
          </Link>
          <Link href="/generate">
            <Button variant="secondary" size="lg">
              Generate a JD
            </Button>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="grid md:grid-cols-3 gap-6">
        <Card>
          <div className="space-y-3">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Score & Analyze</h3>
            <p className="text-gray-600">
              Get a detailed breakdown of your job description across inclusivity,
              readability, structure, and more.
            </p>
          </div>
        </Card>

        <Card>
          <div className="space-y-3">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Smart Suggestions</h3>
            <p className="text-gray-600">
              Receive actionable suggestions to improve your JD with specific
              issues and recommended fixes.
            </p>
          </div>
        </Card>

        <Card>
          <div className="space-y-3">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Voice Profiles</h3>
            <p className="text-gray-600">
              Create profiles that match your company voice to ensure consistency
              across all job descriptions.
            </p>
          </div>
        </Card>
      </section>

      {/* How it works */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900 text-center">How It Works</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 font-bold">
              1
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Paste or Create</h3>
            <p className="text-gray-600">
              Paste an existing job description to analyze, or fill in the details to generate a new one.
            </p>
          </div>
          <div className="text-center">
            <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 font-bold">
              2
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Select a Voice</h3>
            <p className="text-gray-600">
              Choose a voice profile to match your company tone, or use the default settings.
            </p>
          </div>
          <div className="text-center">
            <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 font-bold">
              3
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Get Results</h3>
            <p className="text-gray-600">
              Receive a detailed assessment or a polished job description ready to publish.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
