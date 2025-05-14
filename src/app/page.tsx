import Link from 'next/link';
import Image from 'next/image';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Career Ireland Immigration - Streamlining Irish Immigration Process',
  description: 'Career Ireland Immigration provides AI-powered document validation, expert consultations, and automated government form submissions for Irish immigration applications.',
  openGraph: {
    title: 'Career Ireland Immigration - Streamlining Irish Immigration Process',
    description: 'Career Ireland Immigration provides AI-powered document validation, expert consultations, and automated government form submissions for Irish immigration applications.',
    url: 'https://careerireland.com',
    siteName: 'Career Ireland Immigration',
    images: [
      {
        url: '/images/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Career Ireland Immigration',
      },
    ],
    locale: 'en_IE',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Career Ireland Immigration - Streamlining Irish Immigration Process',
    description: 'Career Ireland Immigration provides AI-powered document validation, expert consultations, and automated government form submissions for Irish immigration applications.',
    images: ['/images/twitter-image.jpg'],
  },
};

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
                Streamlining the Irish Immigration Process
              </h1>
              <p className="text-xl md:text-2xl text-blue-100">
                AI-powered document validation, expert consultations, and automated government form submissions.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/auth/register"
                  className="px-6 py-3 bg-white text-blue-700 rounded-md hover:bg-blue-50 transition-colors text-center font-medium"
                >
                  Get Started
                </Link>
                <Link
                  href="#services"
                  className="px-6 py-3 bg-transparent border border-white text-white rounded-md hover:bg-white/10 transition-colors text-center font-medium"
                >
                  Learn More
                </Link>
              </div>
            </div>
            <div className="hidden md:block relative h-96">
              <div className="absolute inset-0 bg-white/10 rounded-lg overflow-hidden shadow-2xl">
                <div className="relative h-full w-full">
                  <Image
                    src="/images/hero-illustration.svg"
                    alt="Irish immigration process illustration"
                    fill
                    style={{ objectFit: 'contain' }}
                    priority
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Overview */}
      <section id="services" className="py-16 md:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Our Services</h2>
            <p className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto">
              We provide comprehensive immigration services to make your journey to Ireland smooth and hassle-free.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Service 1 */}
            <div className="bg-white rounded-lg shadow-md p-8 transition-all hover:shadow-lg">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Document Validation</h3>
              <p className="text-gray-600 mb-4">
                Our AI-powered system validates your documents to ensure they meet all requirements before submission.
              </p>
              <Link href="/services/document-validation" className="text-blue-600 hover:text-blue-800 font-medium">
                Learn more →
              </Link>
            </div>

            {/* Service 2 */}
            <div className="bg-white rounded-lg shadow-md p-8 transition-all hover:shadow-lg">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Expert Consultation</h3>
              <p className="text-gray-600 mb-4">
                Get personalized advice from immigration experts to navigate complex visa requirements.
              </p>
              <Link href="/services/expert-consultation" className="text-green-600 hover:text-green-800 font-medium">
                Learn more →
              </Link>
            </div>

            {/* Service 3 */}
            <div className="bg-white rounded-lg shadow-md p-8 transition-all hover:shadow-lg">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Form Automation</h3>
              <p className="text-gray-600 mb-4">
                Our system automatically generates and submits government forms, saving you time and reducing errors.
              </p>
              <Link href="/services/form-automation" className="text-purple-600 hover:text-purple-800 font-medium">
                Learn more →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Process Timeline */}
      <section className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Immigration Process</h2>
            <p className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto">
              Our streamlined process makes immigration to Ireland simple and efficient.
            </p>
          </div>

          <div className="relative">
            {/* Timeline line */}
            <div className="hidden md:block absolute left-1/2 transform -translate-x-1/2 h-full w-1 bg-blue-200"></div>

            {/* Timeline steps */}
            <div className="space-y-12 md:space-y-0">
              {/* Step 1 */}
              <div className="relative md:grid md:grid-cols-2 md:gap-8 md:items-center">
                <div className="md:text-right md:pr-12">
                  <div className="bg-blue-100 inline-block p-3 rounded-lg mb-4">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Create Account</h3>
                  <p className="text-gray-600">
                    Register and create your profile with basic information to get started.
                  </p>
                </div>
                <div className="hidden md:block">
                  <div className="absolute left-1/2 transform -translate-x-1/2 -translate-y-4 w-8 h-8 rounded-full border-4 border-blue-200 bg-blue-600"></div>
                </div>
              </div>

              {/* Step 2 */}
              <div className="relative md:grid md:grid-cols-2 md:gap-8 md:items-center">
                <div className="md:col-start-2 md:pl-12">
                  <div className="bg-blue-100 inline-block p-3 rounded-lg mb-4">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Upload Documents</h3>
                  <p className="text-gray-600">
                    Upload your documents for AI-powered validation and verification.
                  </p>
                </div>
                <div className="hidden md:block">
                  <div className="absolute left-1/2 transform -translate-x-1/2 -translate-y-4 w-8 h-8 rounded-full border-4 border-blue-200 bg-blue-600"></div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="relative md:grid md:grid-cols-2 md:gap-8 md:items-center">
                <div className="md:text-right md:pr-12">
                  <div className="bg-blue-100 inline-block p-3 rounded-lg mb-4">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Form Submission</h3>
                  <p className="text-gray-600">
                    Our system automatically generates and submits your application forms.
                  </p>
                </div>
                <div className="hidden md:block">
                  <div className="absolute left-1/2 transform -translate-x-1/2 -translate-y-4 w-8 h-8 rounded-full border-4 border-blue-200 bg-blue-600"></div>
                </div>
              </div>

              {/* Step 4 */}
              <div className="relative md:grid md:grid-cols-2 md:gap-8 md:items-center">
                <div className="md:col-start-2 md:pl-12">
                  <div className="bg-blue-100 inline-block p-3 rounded-lg mb-4">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Application Approval</h3>
                  <p className="text-gray-600">
                    Track your application status and receive notifications on progress.
                  </p>
                </div>
                <div className="hidden md:block">
                  <div className="absolute left-1/2 transform -translate-x-1/2 -translate-y-4 w-8 h-8 rounded-full border-4 border-blue-200 bg-blue-600"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="bg-blue-700 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Start Your Irish Immigration Journey?</h2>
          <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto">
            Join thousands of successful applicants who have used our platform to streamline their immigration process.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auth/register"
              className="px-8 py-4 bg-white text-blue-700 rounded-md hover:bg-blue-50 transition-colors text-center font-medium"
            >
              Create an Account
            </Link>
            <Link
              href="/auth/login"
              className="px-8 py-4 bg-transparent border border-white text-white rounded-md hover:bg-white/10 transition-colors text-center font-medium"
            >
              Login
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
