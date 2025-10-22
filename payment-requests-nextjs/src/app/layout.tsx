import '../styles/globals.css';
import React, { PropsWithChildren } from 'react';
import Layout from '../components/ui/Layout';

export default function RootLayout({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <body>
        <Layout>{children}</Layout>
      </body>
    </html>
  );
}
