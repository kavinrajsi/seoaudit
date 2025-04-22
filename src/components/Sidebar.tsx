"use client";
import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Search, Clock, ChevronLeft, ChevronRight } from "lucide-react";

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside className={`${collapsed ? "w-16" : "w-64"} flex-shrink-0 bg-white dark:bg-gray-900 border-r transition-width duration-200`}>
      <div className="p-4 border-b flex items-center justify-between">
        <Link
          href="/audit"
          className={`flex items-center ${collapsed ? 'justify-center' : ''}`}
        >
          {!collapsed ? (
            <Image
              src="/logo-full.svg"
              alt="SEO Audit Logo"
              width={120}
              height={40}
              style={{ height: 'auto' }}
            />
          ) : (
            <Image
              src="/logo-full.svg"
              alt="SEO Audit Logo"
              width={32}
              height={32}
              style={{ height: 'auto' }}
            />
          )}
        </Link>
        <button onClick={() => setCollapsed(!collapsed)} className="p-1" aria-label="Toggle Sidebar">
          {collapsed ? (
            <ChevronRight className="h-5 w-5 text-gray-600 dark:text-gray-300" />
          ) : (
            <ChevronLeft className="h-5 w-5 text-gray-600 dark:text-gray-300" />
          )}
        </button>
      </div>
      <nav className="p-4 space-y-2">
        <Link
          href="/audit"
          className={`flex items-center py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 ${collapsed ? "justify-center px-2" : "px-4"}`}
        >
          <Search className="h-5 w-5 text-gray-600 dark:text-gray-300" />
          <span className={`${collapsed ? "hidden" : "ml-2 inline"}`}>Website Analysis</span>
        </Link>
        <Link
          href="/history"
          className={`flex items-center py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 ${collapsed ? "justify-center px-2" : "px-4"}`}
        >
          <Clock className="h-5 w-5 text-gray-600 dark:text-gray-300" />
          <span className={`${collapsed ? "hidden" : "ml-2 inline"}`}>SEO History</span>
        </Link>
      </nav>
    </aside>
  );
}
