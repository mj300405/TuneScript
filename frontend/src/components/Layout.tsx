// src/components/Layout.tsx
import React from 'react';
import Head from 'next/head';
import Link from 'next/link';

type Props = {
  children: React.ReactNode;
  title?: string;
};

const Layout = ({ children, title = 'TuneScript' }: Props) => (
  <div className="flex flex-col min-h-screen">
    <Head>
      <title>{title}</title>
    </Head>
    <header className="bg-blue-600 text-white p-4 shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        <h1 className="text-3xl font-bold">
          <Link href="/">TuneScript</Link>
        </h1>
        <nav>
          <Link href="/login" className="text-white hover:text-gray-200 mx-2">Login</Link>
          <Link href="/register" className="text-white hover:text-gray-200 mx-2">Register</Link>
          <Link href="/upload" className="text-white hover:text-gray-200 mx-2">Upload</Link>
          <Link href="/search" className="text-white hover:text-gray-200 mx-2">Search</Link>
        </nav>
      </div>
    </header>
    <main className="container mx-auto flex-1 p-4">
      {children}
    </main>
    <footer className="bg-gray-800 text-white p-4 mt-8">
      <div className="container mx-auto text-center">
        &copy; {new Date().getFullYear()} TuneScript
      </div>
    </footer>
  </div>
);

export default Layout;
