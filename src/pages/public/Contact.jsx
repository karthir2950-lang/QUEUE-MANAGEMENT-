import React from 'react';
import { Mail, Phone, MapPin } from 'lucide-react';

const Contact = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
      <div className="text-center mb-16">
        <h1 className="text-3xl font-extrabold text-slate-900 sm:text-4xl">Contact Us</h1>
        <p className="mt-4 text-xl text-slate-500">Get in touch with our team</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        <div>
          <div className="card p-8 space-y-8">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <Mail className="h-6 w-6 text-primary-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-slate-900">Email</h3>
                <p className="mt-1 text-slate-500">support@smartqueue.com</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <Phone className="h-6 w-6 text-primary-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-slate-900">Phone</h3>
                <p className="mt-1 text-slate-500">+91 98765 43210</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <MapPin className="h-6 w-6 text-primary-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-slate-900">Office</h3>
                <p className="mt-1 text-slate-500">123 Tech Park, Chennai, India</p>
              </div>
            </div>
          </div>
        </div>
        
        <div>
          <form className="card p-8 space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-slate-700">Name</label>
              <input type="text" id="name" className="input-field mt-1" placeholder="Your Name" />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700">Email</label>
              <input type="email" id="email" className="input-field mt-1" placeholder="your@email.com" />
            </div>
            <div>
              <label htmlFor="message" className="block text-sm font-medium text-slate-700">Message</label>
              <textarea id="message" rows="4" className="input-field mt-1" placeholder="How can we help you?"></textarea>
            </div>
            <button type="button" className="btn-primary w-full">Send Message</button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Contact;
