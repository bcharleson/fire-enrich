'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Settings, Menu, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { LLMSwitcher } from '@/components/llm-switcher';
import { SettingsModal } from '@/components/settings-modal';
import Image from 'next/image';
import Link from 'next/link';

interface ResponsiveLayoutProps {
  children: React.ReactNode;
  sidebar?: React.ReactNode;
  showSidebar?: boolean;
  sidebarTitle?: string;
  currentStep?: 'upload' | 'setup' | 'enrichment';
  onStepChange?: (step: 'upload' | 'setup' | 'enrichment') => void;
}

export function ResponsiveLayout({ 
  children, 
  sidebar, 
  showSidebar = false, 
  sidebarTitle = "Controls",
  currentStep = 'upload',
  onStepChange 
}: ResponsiveLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const handleLLMModelChange = (provider: string, modelId: string) => {
    // Handle LLM model changes
    console.log(`LLM changed to ${provider}:${modelId}`);
  };

  const handleNeedApiKey = () => {
    setSettingsOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Compact Header */}
      <header className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4 sticky top-0 z-40">
        <div className="flex items-center gap-4">
          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-4 w-4" />
          </Button>

          {/* Logo */}
          <Link href="https://www.firecrawl.dev/?utm_source=tool-csv-enrichment" target="_blank" rel="noopener noreferrer">
            <Image
              src="/firecrawl-logo-with-fire.png"
              alt="Firecrawl Logo"
              width={113}
              height={24}
              className="h-6 w-auto"
            />
          </Link>

          {/* Step Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            <Button
              variant={currentStep === 'upload' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onStepChange?.('upload')}
              className="text-xs"
            >
              1. Upload
            </Button>
            <ChevronRight className="h-3 w-3 text-gray-400" />
            <Button
              variant={currentStep === 'setup' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onStepChange?.('setup')}
              className="text-xs"
              disabled={currentStep === 'upload'}
            >
              2. Configure
            </Button>
            <ChevronRight className="h-3 w-3 text-gray-400" />
            <Button
              variant={currentStep === 'enrichment' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onStepChange?.('enrichment')}
              className="text-xs"
              disabled={currentStep === 'upload' || currentStep === 'setup'}
            >
              3. Enrich
            </Button>
          </nav>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-2">
          {/* LLM Switcher */}
          <LLMSwitcher 
            onModelChange={handleLLMModelChange}
            onNeedApiKey={handleNeedApiKey}
            className="hidden sm:flex"
          />

          {/* Settings Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSettingsOpen(true)}
            className="flex items-center gap-2"
          >
            <Settings className="h-4 w-4" />
            <span className="hidden md:inline">Settings</span>
          </Button>

          {/* Desktop sidebar toggle */}
          {showSidebar && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="hidden md:flex"
            >
              {sidebarCollapsed ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </Button>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Sidebar */}
        {showSidebar && !sidebarCollapsed && (
          <aside className="hidden md:flex w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex-col">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="font-semibold text-gray-900 dark:text-gray-100">{sidebarTitle}</h2>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {sidebar}
            </div>
          </aside>
        )}

        {/* Collapsed Sidebar */}
        {showSidebar && sidebarCollapsed && (
          <aside className="hidden md:flex w-16 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex-col items-center py-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarCollapsed(false)}
              className="mb-4"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </aside>
        )}

        {/* Main Content */}
        <main className="flex-1 overflow-hidden">
          <div className="h-full overflow-y-auto">
            <div className="p-4 lg:p-6 max-w-none">
              {children}
            </div>
          </div>
        </main>
      </div>

      {/* Mobile Sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-80">
          <SheetHeader>
            <SheetTitle>{sidebarTitle}</SheetTitle>
          </SheetHeader>
          <div className="mt-6">
            {sidebar}
          </div>
        </SheetContent>
      </Sheet>

      {/* Settings Modal */}
      <SettingsModal 
        open={settingsOpen} 
        onOpenChange={setSettingsOpen}
        onSave={() => {
          setSettingsOpen(false);
          // Refresh any necessary data
        }}
      />
    </div>
  );
}

// Utility component for sidebar content sections
export function SidebarSection({ 
  title, 
  children, 
  collapsible = false,
  defaultExpanded = true 
}: {
  title: string;
  children: React.ReactNode;
  collapsible?: boolean;
  defaultExpanded?: boolean;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <div className="mb-6">
      <div 
        className={`flex items-center justify-between mb-3 ${collapsible ? 'cursor-pointer' : ''}`}
        onClick={collapsible ? () => setExpanded(!expanded) : undefined}
      >
        <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">{title}</h3>
        {collapsible && (
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
            {expanded ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
          </Button>
        )}
      </div>
      {expanded && (
        <div className="space-y-3">
          {children}
        </div>
      )}
    </div>
  );
}

// Performance monitoring component
export function PerformanceIndicator() {
  const [metrics, setMetrics] = useState({
    memoryUsage: 0,
    renderTime: 0,
    rowsProcessed: 0
  });

  React.useEffect(() => {
    const updateMetrics = () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        setMetrics(prev => ({
          ...prev,
          memoryUsage: Math.round(memory.usedJSHeapSize / 1024 / 1024)
        }));
      }
    };

    const interval = setInterval(updateMetrics, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
      <div>Memory: {metrics.memoryUsage}MB</div>
      <div>Processed: {metrics.rowsProcessed} rows</div>
    </div>
  );
}
