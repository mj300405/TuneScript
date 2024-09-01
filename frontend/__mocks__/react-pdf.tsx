import React from 'react';

const Document = ({ children }: { children: React.ReactNode }) => (
  <div data-testid="mock-pdf-document">{children}</div>
);

const Page = ({ pageNumber }: { pageNumber: number }) => (
  <div data-testid="mock-pdf-page">Mocked PDF Page: {pageNumber}</div>
);

const pdfjs = {
  GlobalWorkerOptions: {
    workerSrc: 'mocked-worker-src',
  },
};

export { Document, Page, pdfjs };