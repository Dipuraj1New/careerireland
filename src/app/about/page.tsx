import Image from 'next/image';
import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About Us | Career Ireland Immigration',
  description: 'Learn about Career Ireland Immigration, our mission, team, and expertise in Irish immigration services.',
  openGraph: {
    title: 'About Us | Career Ireland Immigration',
    description: 'Learn about Career Ireland Immigration, our mission, team, and expertise in Irish immigration services.',
    url: 'https://careerireland.com/about',
    siteName: 'Career Ireland Immigration',
    images: [
      {
        url: '/images/about-og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Career Ireland Immigration Team',
      },
    ],
    locale: 'en_IE',
    type: 'website',
  },
};

export default function AboutPage() {
  // Team members data
  const teamMembers = [
    {
      name: 'Sarah O\'Connor',
      role: 'Founder & CEO',
      bio: 'Former immigration officer with 15+ years of experience in Irish immigration law.',
      image: '/images/team/sarah.jpg',
    },
    {
      name: 'Michael Doyle',
      role: 'Chief Technology Officer',
      bio: 'Tech innovator with expertise in AI and document processing systems.',
      image: '/images/team/michael.jpg',
    },
    {
      name: 'Aoife Kelly',
      role: 'Head of Immigration Services',
      bio: 'Certified immigration consultant with a focus on work and business visas.',
      image: '/images/team/aoife.jpg',
    },
    {
      name: 'James Murphy',
      role: 'Legal Advisor',
      bio: 'Specialized in immigration law with experience in complex case resolution.',
      image: '/images/team/james.jpg',
    },
  ];

  // Partner logos
  const partners = [
    { name: 'Irish Business Association', logo: '/images/partners/iba-logo.svg' },
    { name: 'Tech Ireland', logo: '/images/partners/tech-ireland-logo.svg' },
    { name: 'Dublin Chamber of Commerce', logo: '/images/partners/dublin-chamber-logo.svg' },
    { name: 'Enterprise Ireland', logo: '/images/partners/enterprise-ireland-logo.svg' },
  ];

  // Office locations
  const offices = [
    {
      city: 'Dublin',
      address: '42 O\'Connell Street, Dublin 1, D01 X7P8',
      phone: '+353 1 234 5678',
      email: 'dublin@careerireland.com',
      coordinates: { lat: 53.349805, lng: -6.260310 },
    },
    {
      city: 'Cork',
      address: '15 Patrick Street, Cork, T12 RD78',
      phone: '+353 21 234 5678',
      email: 'cork@careerireland.com',
      coordinates: { lat: 51.898111, lng: -8.470881 },
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-6">About Career Ireland</h1>
          <p className="text-xl md:text-2xl text-blue-100 max-w-3xl mx-auto">
            Transforming the Irish immigration experience through technology and expertise.
          </p>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Mission</h2>
              <p className="text-lg text-gray-600 mb-6">
                At Career Ireland Immigration, our mission is to simplify the complex Irish immigration process through innovative technology and personalized support, making it accessible and stress-free for applicants worldwide.
              </p>
              <p className="text-lg text-gray-600">
                We believe that everyone deserves a smooth immigration journey, regardless of their background or circumstances. Our AI-powered platform combined with expert human guidance ensures that each applicant receives the highest quality service and support.
              </p>
            </div>
            <div className="relative h-96 rounded-lg overflow-hidden shadow-xl">
              <Image
                src="/images/about/mission-image.jpg"
                alt="Career Ireland Immigration Mission"
                fill
                style={{ objectFit: 'cover' }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-16 md:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Meet Our Team</h2>
            <p className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto">
              Our diverse team of immigration experts, legal advisors, and technology specialists work together to provide you with the best possible service.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {teamMembers.map((member, index) => (
              <div key={index} className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="relative h-64">
                  <Image
                    src={member.image}
                    alt={member.name}
                    fill
                    style={{ objectFit: 'cover' }}
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-gray-900">{member.name}</h3>
                  <p className="text-blue-600 mb-2">{member.role}</p>
                  <p className="text-gray-600">{member.bio}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Expertise & Certifications */}
      <section className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Our Expertise</h2>
            <p className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto">
              With decades of combined experience in Irish immigration, our team brings unparalleled expertise to every case.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-lg shadow-md p-8">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Certified Expertise</h3>
              <p className="text-gray-600">
                Our team includes certified immigration consultants recognized by the Immigration Advisers Authority and the Law Society of Ireland.
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-md p-8">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Innovative Approach</h3>
              <p className="text-gray-600">
                We combine traditional immigration expertise with cutting-edge technology to provide a seamless and efficient service.
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-md p-8">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Personalized Service</h3>
              <p className="text-gray-600">
                We understand that every immigration case is unique, which is why we provide personalized guidance tailored to your specific needs.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Partners */}
      <section className="py-16 md:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Our Partners</h2>
            <p className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto">
              We collaborate with leading organizations to provide the best possible service to our clients.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 items-center">
            {partners.map((partner, index) => (
              <div key={index} className="flex justify-center">
                <div className="relative h-16 w-40">
                  <Image
                    src={partner.logo}
                    alt={partner.name}
                    fill
                    style={{ objectFit: 'contain' }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Office Locations */}
      <section className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Our Offices</h2>
            <p className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto">
              Visit us at one of our convenient locations across Ireland.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {offices.map((office, index) => (
              <div key={index} className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="relative h-64">
                  <Image
                    src={`/images/offices/${office.city.toLowerCase()}.jpg`}
                    alt={`${office.city} Office`}
                    fill
                    style={{ objectFit: 'cover' }}
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-gray-900">{office.city} Office</h3>
                  <p className="text-gray-600 mt-2">{office.address}</p>
                  <p className="text-gray-600 mt-1">Phone: {office.phone}</p>
                  <p className="text-gray-600 mt-1">Email: {office.email}</p>
                  <Link
                    href={`https://maps.google.com/?q=${office.coordinates.lat},${office.coordinates.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block mt-4 text-blue-600 hover:text-blue-800"
                  >
                    View on Map →
                  </Link>
                </div>
              </div>
            ))}
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
              href="/contact"
              className="px-8 py-4 bg-transparent border border-white text-white rounded-md hover:bg-white/10 transition-colors text-center font-medium"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
