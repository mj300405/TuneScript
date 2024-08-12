// src/pages/index.tsx
import React from 'react';
import Link from 'next/link';
import Layout from '../components/Layout';
import { motion } from 'framer-motion';

const Home = () => {
  return (
    <Layout title="TuneScript - Piano Transcription Made Easy">
      <div className="bg-gradient-to-b from-blue-500 to-purple-600 text-white min-h-screen">
        {/* Hero Section */}
        <section className="container mx-auto px-6 py-20 text-center">
          <motion.h1 
            className="text-5xl md:text-6xl font-bold mb-6"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            Welcome to TuneScript
          </motion.h1>
          <motion.p 
            className="text-xl md:text-2xl mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Your ultimate platform for uploading, managing, and discovering piano transcriptions.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Link
              href="/register"
              className="bg-white text-blue-600 font-bold py-3 px-8 rounded-full text-lg hover:bg-blue-100 transition duration-300 mr-4">
              
                Get Started
              
            </Link>
            <Link
              href="/search"
              className="bg-transparent border-2 border-white text-white font-bold py-3 px-8 rounded-full text-lg hover:bg-white hover:text-blue-600 transition duration-300">
              
                Explore Transcriptions
              
            </Link>
          </motion.div>
        </section>

        {/* Features Section */}
        <section className="bg-white text-gray-800 py-20">
          <div className="container mx-auto px-6">
            <h2 className="text-3xl font-bold text-center mb-12">Why Choose TuneScript?</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              <FeatureCard 
                title="Easy Upload"
                description="Quickly upload your audio files and get accurate transcriptions in minutes."
                icon="🎵"
              />
              <FeatureCard 
                title="Smart Search"
                description="Find the perfect transcription with our advanced search features."
                icon="🔍"
              />
              <FeatureCard 
                title="Community Sharing"
                description="Share your transcriptions and discover new music from other users."
                icon="🌐"
              />
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="container mx-auto px-6 py-20 text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to Start Your Musical Journey?</h2>
          <p className="text-xl mb-12">Join TuneScript today and transform the way you interact with sheet music.</p>
          <Link
            href="/register"
            className="bg-white text-blue-600 font-bold py-3 px-8 rounded-full text-lg hover:bg-blue-100 transition duration-300">
            
              Sign Up Now
            
          </Link>
        </section>
      </div>
    </Layout>
  );
};

interface FeatureCardProps {
  title: string;
  description: string;
  icon: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ title, description, icon }) => (
  <div className="bg-gray-100 p-6 rounded-lg shadow-md">
    <div className="text-4xl mb-4">{icon}</div>
    <h3 className="text-xl font-bold mb-2">{title}</h3>
    <p>{description}</p>
  </div>
);

export default Home;