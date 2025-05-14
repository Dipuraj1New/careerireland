import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Document Validation Services | Career Ireland Immigration',
  description: 'Our AI-powered document validation service ensures your immigration documents meet all requirements before submission to Irish authorities.',
  openGraph: {
    title: 'Document Validation Services | Career Ireland Immigration',
    description: 'Our AI-powered document validation service ensures your immigration documents meet all requirements before submission to Irish authorities.',
    url: 'https://careerireland.com/services/document-validation',
    siteName: 'Career Ireland Immigration',
    images: [
      {
        url: '/images/services/document-validation-og.jpg',
        width: 1200,
        height: 630,
        alt: 'Document Validation Services',
      },
    ],
    locale: 'en_IE',
    type: 'website',
  },
};

export default function DocumentValidationPage() {
  // Required documents by visa type
  const requiredDocuments = {
    student: [
      'Valid passport',
      'Passport-sized photographs',
      'Letter of acceptance from Irish educational institution',
      'Proof of payment of tuition fees',
      'Evidence of financial resources',
      'Private medical insurance',
      'English language proficiency certificate',
    ],
    work: [
      'Valid passport',
      'Passport-sized photographs',
      'Job offer letter from Irish employer',
      'Employment contract',
      'Critical Skills Employment Permit or General Employment Permit',
      'Proof of qualifications and work experience',
      'Private medical insurance',
    ],
    family: [
      'Valid passport',
      'Passport-sized photographs',
      'Marriage certificate or civil partnership certificate',
      'Birth certificates (for children)',
      'Proof of relationship',
      'Proof of sponsor\'s immigration status in Ireland',
      'Evidence of financial resources',
      'Private medical insurance',
    ],
  };

  // Validation process steps
  const validationSteps = [
    {
      title: 'Document Upload',
      description: 'Upload your documents securely to our platform.',
      icon: (
        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
      ),
    },
    {
      title: 'AI Analysis',
      description: 'Our AI system analyzes your documents for completeness and compliance.',
      icon: (
        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
        </svg>
      ),
    },
    {
      title: 'Expert Review',
      description: 'Our immigration experts review the AI analysis and provide additional insights.',
      icon: (
        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
    },
    {
      title: 'Detailed Report',
      description: 'Receive a comprehensive report with validation results and recommendations.',
      icon: (
        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
    {
      title: 'Document Correction',
      description: 'Make necessary corrections based on the validation report.',
      icon: (
        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      ),
    },
    {
      title: 'Final Verification',
      description: 'Final verification to ensure all documents meet requirements.',
      icon: (
        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ),
    },
  ];

  // Success statistics
  const statistics = [
    { label: 'Documents Validated', value: '50,000+' },
    { label: 'Success Rate', value: '98%' },
    { label: 'Time Saved', value: '70%' },
    { label: 'Client Satisfaction', value: '4.9/5' },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-6">Document Validation Services</h1>
              <p className="text-xl text-blue-100 mb-8">
                Our AI-powered document validation ensures your immigration documents meet all requirements before submission to Irish authorities.
              </p>
              <Link
                href="/auth/register"
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-blue-700 bg-white hover:bg-blue-50"
              >
                Get Started
              </Link>
            </div>
            <div className="hidden md:block relative h-96">
              <div className="absolute inset-0 bg-white/10 rounded-lg overflow-hidden shadow-2xl">
                <div className="relative h-full w-full">
                  <Image
                    src="/images/services/document-validation-hero.jpg"
                    alt="Document validation illustration"
                    fill
                    style={{ objectFit: 'cover' }}
                    priority
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Service Description */}
      <section className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="relative h-96 rounded-lg overflow-hidden shadow-xl">
              <Image
                src="/images/services/document-validation-detail.jpg"
                alt="Document validation process"
                fill
                style={{ objectFit: 'cover' }}
              />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">How Our Document Validation Works</h2>
              <p className="text-lg text-gray-600 mb-6">
                Our document validation service combines advanced AI technology with expert human review to ensure your immigration documents meet all requirements for Irish immigration authorities.
              </p>
              <p className="text-lg text-gray-600 mb-6">
                The system checks for document completeness, authenticity, and compliance with current immigration regulations, significantly increasing your chances of a successful application.
              </p>
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0 mt-1">
                    <svg className="h-5 w-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-gray-700">AI-powered document analysis</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="flex-shrink-0 mt-1">
                    <svg className="h-5 w-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-gray-700">Expert review by immigration specialists</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="flex-shrink-0 mt-1">
                    <svg className="h-5 w-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-gray-700">Detailed validation reports with recommendations</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="flex-shrink-0 mt-1">
                    <svg className="h-5 w-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-gray-700">Up-to-date compliance with Irish immigration regulations</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Validation Process */}
      <section className="py-16 md:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Our Validation Process</h2>
            <p className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto">
              A streamlined process to ensure your documents meet all requirements.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {validationSteps.map((step, index) => (
              <div key={index} className="bg-white rounded-lg shadow-md p-8">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  {step.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-gray-600">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Required Documents */}
      <section className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Required Documents</h2>
            <p className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto">
              Different visa types require different documents. Here's what you'll need for common visa categories.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="bg-blue-600 text-white py-4 px-6">
                <h3 className="text-xl font-semibold">Student Visa</h3>
              </div>
              <div className="p-6">
                <ul className="space-y-3">
                  {requiredDocuments.student.map((doc, index) => (
                    <li key={index} className="flex items-start">
                      <div className="flex-shrink-0 mt-1">
                        <svg className="h-5 w-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-gray-700">{doc}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="bg-green-600 text-white py-4 px-6">
                <h3 className="text-xl font-semibold">Work Visa</h3>
              </div>
              <div className="p-6">
                <ul className="space-y-3">
                  {requiredDocuments.work.map((doc, index) => (
                    <li key={index} className="flex items-start">
                      <div className="flex-shrink-0 mt-1">
                        <svg className="h-5 w-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-gray-700">{doc}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="bg-purple-600 text-white py-4 px-6">
                <h3 className="text-xl font-semibold">Family Visa</h3>
              </div>
              <div className="p-6">
                <ul className="space-y-3">
                  {requiredDocuments.family.map((doc, index) => (
                    <li key={index} className="flex items-start">
                      <div className="flex-shrink-0 mt-1">
                        <svg className="h-5 w-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-gray-700">{doc}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Success Statistics */}
      <section className="py-16 md:py-24 bg-blue-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold">Our Success in Numbers</h2>
            <p className="mt-4 text-xl text-blue-100 max-w-3xl mx-auto">
              We've helped thousands of applicants successfully navigate the Irish immigration process.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {statistics.map((stat, index) => (
              <div key={index}>
                <p className="text-4xl md:text-5xl font-bold text-white">{stat.value}</p>
                <p className="mt-2 text-xl text-blue-100">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">Ready to Validate Your Documents?</h2>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Get started with our document validation service today and increase your chances of a successful Irish immigration application.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auth/register"
              className="px-8 py-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-center font-medium"
            >
              Get Started
            </Link>
            <Link
              href="/contact"
              className="px-8 py-4 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors text-center font-medium"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
