import React from 'react';

const TermsOfService = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow-lg rounded-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Terms of Service</h1>
          
          <div className="prose max-w-none">
            <p className="text-gray-600 mb-6">
              <strong>Last updated:</strong> {new Date().toLocaleDateString()}
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">Agreement to Terms</h2>
              <p className="text-gray-700 leading-relaxed">
                By accessing and using TaskNest, you accept and agree to be bound by the terms and provisions 
                of this agreement. These Terms of Service govern your use of the TaskNest task management platform 
                and all related services provided by us.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">Description of Service</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                TaskNest is a web-based task management and project collaboration platform that allows users to:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li>Create and manage tasks and projects</li>
                <li>Collaborate with team members</li>
                <li>Track project progress and milestones</li>
                <li>Integrate with Google Drive for file management</li>
                <li>Communicate through discussions and notifications</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">User Accounts</h2>
              <h3 className="text-xl font-medium text-gray-800 mb-3">Account Registration</h3>
              <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
                <li>You must provide accurate and complete information</li>
                <li>You are responsible for maintaining account security</li>
                <li>You must be at least 13 years old to use our service</li>
                <li>One person or legal entity may maintain only one account</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-800 mb-3">Account Responsibilities</h3>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li>Keep your login credentials secure</li>
                <li>Notify us immediately of any unauthorized access</li>
                <li>You are responsible for all activities under your account</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">Acceptable Use</h2>
              <p className="text-gray-700 leading-relaxed mb-4">You agree not to use TaskNest to:</p>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li>Violate any laws or regulations</li>
                <li>Infringe on intellectual property rights</li>
                <li>Upload malicious software or harmful content</li>
                <li>Interfere with the service's operation</li>
                <li>Attempt unauthorized access to our systems</li>
                <li>Use the service for spam or unsolicited communications</li>
                <li>Share inappropriate or offensive content</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">Content and Data</h2>
              <h3 className="text-xl font-medium text-gray-800 mb-3">Your Content</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                You retain ownership of all content you create, upload, or share through TaskNest. 
                By using our service, you grant us a limited license to use, store, and display your 
                content solely for providing our services.
              </p>

              <h3 className="text-xl font-medium text-gray-800 mb-3">Content Responsibility</h3>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li>You are responsible for your content and its legality</li>
                <li>We reserve the right to remove inappropriate content</li>
                <li>Back up important data regularly</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">Google Drive Integration</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                When you connect your Google Drive account:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li>You authorize TaskNest to access specified files and folders</li>
                <li>You remain responsible for your Google Drive content</li>
                <li>You can revoke access at any time through your Google account settings</li>
                <li>We comply with Google's API Terms of Service</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">Service Availability</h2>
              <p className="text-gray-700 leading-relaxed">
                While we strive for high availability, we do not guarantee uninterrupted service. 
                We may temporarily suspend service for maintenance, updates, or due to circumstances 
                beyond our control. We are not liable for any disruptions or data loss.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">Privacy</h2>
              <p className="text-gray-700 leading-relaxed">
                Your privacy is important to us. Please review our Privacy Policy, which explains 
                how we collect, use, and protect your information. By using TaskNest, you consent 
                to our data practices as described in the Privacy Policy.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">Termination</h2>
              <h3 className="text-xl font-medium text-gray-800 mb-3">Account Termination</h3>
              <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
                <li>You may terminate your account at any time</li>
                <li>We may terminate accounts that violate these terms</li>
                <li>Upon termination, your access to the service ends immediately</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-800 mb-3">Data Retention</h3>
              <p className="text-gray-700 leading-relaxed">
                After account termination, we may retain your data for a reasonable period for 
                backup and legal purposes, then delete it according to our data retention policy.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">Limitation of Liability</h2>
              <p className="text-gray-700 leading-relaxed">
                TaskNest is provided "as is" without warranties. We are not liable for any indirect, 
                incidental, special, or consequential damages arising from your use of the service. 
                Our total liability is limited to the amount you paid for the service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">Changes to Terms</h2>
              <p className="text-gray-700 leading-relaxed">
                We reserve the right to modify these terms at any time. We will notify users of 
                material changes via email or through the service. Continued use after changes 
                constitutes acceptance of the new terms.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">Contact Information</h2>
              <p className="text-gray-700 leading-relaxed">
                For questions about these Terms of Service, please contact us:
              </p>
              <div className="bg-gray-50 p-4 rounded-lg mt-4">
                <p className="text-gray-700">
                  <strong>Email:</strong> theycallmekundan@gmail.com<br/>
                  <strong>Support:</strong> kundan.kumar@nexuspointluxe.com<br/>
                  <strong>Website:</strong> https://tasknest.nexuspointshop.com
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">Governing Law</h2>
              <p className="text-gray-700 leading-relaxed">
                These terms are governed by applicable laws. Any disputes will be resolved through 
                appropriate legal channels in the jurisdiction where TaskNest operates.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;
