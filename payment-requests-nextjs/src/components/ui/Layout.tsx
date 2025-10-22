import React, { PropsWithChildren } from 'react';
import Link from 'next/link';

const Layout: React.FC<PropsWithChildren> = ({ children }) => {
  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="logo">💸</span>
          <span className="brand-name">PayFlow Admin</span>
        </div>
        <nav className="nav">
          <Link href="/dashboard" className="nav-link">Dashboard</Link>
          <Link href="/payment-requests" className="nav-link">Payment Requests</Link>
          <Link href="/contacts" className="nav-link">Contacts</Link>
          <Link href="/containers" className="nav-link">Containers</Link>
        </nav>
        <div className="sidebar-footer">
          <a className="help-link" href="#" target="_blank" rel="noreferrer">Help & Docs</a>
        </div>
      </aside>
      <div className="main">
        <header className="topbar">
          <div className="topbar-left">
            <h1 className="page-title">Admin</h1>
          </div>
          <div className="topbar-right">
            <button className="ghost-btn">Profile</button>
          </div>
        </header>
        <main className="content container">
          {children}
        </main>
        <footer className="footer container">
          <span>© {new Date().getFullYear()} PayFlow</span>
        </footer>
      </div>
    </div>
  );
};

export default Layout;
