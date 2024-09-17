import React from 'react';
import Head from 'next/head';
import Header from './Header';
import { motion } from 'framer-motion';
import ChatbotWidget from './ChatbotWidget';

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
}

const Layout: React.FC<LayoutProps> = ({ children, title = 'TuneScript' }) => {
  return (
    <>
      <Head>
        <title>{title}</title>
        <meta charSet="utf-8" />
        <meta name="viewport" content="initial-scale=1.0, width=device-width" />
      </Head>
      <div className="min-h-screen bg-gray-100">
        <Header />
        <motion.main 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="pt-10"
        >
          {children}
        </motion.main>
        <ChatbotWidget />
      </div>
    </>
  );
};

export default Layout;