import React from 'react';

const About = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
      <div className="text-center">
        <h1 className="text-3xl font-extrabold text-slate-900 sm:text-4xl">About SmartQueue</h1>
        <p className="mt-4 text-xl text-slate-500 max-w-3xl mx-auto">
          We are dedicated to eliminating waiting times through intelligent, AI-powered queue and appointment management solutions.
        </p>
      </div>
      <div className="mt-16 bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
        <p className="text-slate-600 leading-relaxed mb-4">
          SmartQueue was founded with a simple mission: to respect people's time. We understand that waiting in long queues is frustrating and inefficient. Our platform provides a seamless experience for both service providers and customers.
        </p>
        <p className="text-slate-600 leading-relaxed">
          Whether you are a hospital managing patient flow, a bank handling customer services, or a government office processing applications, SmartQueue scales to meet your needs.
        </p>
      </div>
    </div>
  );
};

export default About;
