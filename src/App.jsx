import { useState } from 'react'
import './App.css'

// ── Data ─────────────────────────────────────────────────────────────

const NAV_LINKS = [
  { label: 'Home',         href: '/',                     active: true  },
  { label: 'Color Grader', href: '/lut-previewer.html',   active: false },
  { label: 'Subtitles',    href: '/subtitles.html',        active: false },
  { label: 'FCPXML',       href: '/fcpxml.html',           active: false },
  { label: 'Projects',     href: '/project-manager.html',  active: false },
  { label: 'Blog',         href: '/blog.html',             active: false },
  { label: 'About',        href: '/about.html',            active: false },
]

const TOOLS = [
  {
    href: '/lut-previewer.html',
    title: 'Color Grader',
    description: 'Apply .cube LUT files with custom brightness and saturation controls before exporting to your editor.',
    icon: (
      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
      </svg>
    ),
  },
  {
    href: '/subtitles.html',
    title: 'Subtitle Tools',
    description: 'Create, convert, and edit SRT files with precise timecodes for seamless subtitle integration.',
    icon: (
      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
      </svg>
    ),
  },
  {
    href: '/project-manager.html',
    title: 'Project Manager',
    description: 'Calculate timelines, manage deliverables, and track project progress efficiently.',
    icon: (
      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
  },
]

// ── Components ────────────────────────────────────────────────────────

function Nav() {
  const [open, setOpen] = useState(false)

  return (
    <nav className="bg-fcp-gray border-b border-fcp-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <a href="/" className="flex items-center space-x-3 group transition-transform hover:scale-105">
            <img src="/logo.png" alt="EditKit" className="h-10 w-10 transition-transform group-hover:rotate-3" />
            <span className="text-xl font-semibold tracking-tight">
              <span className="text-fcp-text">Edit</span>
              <span className="text-blue-400">Kit</span>
            </span>
          </a>

          {/* Desktop links */}
          <div className="hidden md:flex items-baseline space-x-4">
            {NAV_LINKS.map(({ label, href, active }) => (
              <a
                key={href}
                href={href}
                className={
                  active
                    ? 'px-3 py-2 rounded-md text-sm font-medium text-white bg-gray-700'
                    : 'px-3 py-2 rounded-md text-sm font-medium text-fcp-text-secondary hover:text-fcp-text hover:bg-fcp-border transition-all hover:scale-105 whitespace-nowrap'
                }
              >
                {label}
              </a>
            ))}
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 rounded-md text-fcp-text-secondary hover:text-fcp-text hover:bg-fcp-border focus:outline-none"
            onClick={() => setOpen(o => !o)}
            aria-label="Toggle menu"
          >
            <svg className="h-6 w-6" stroke="currentColor" fill="none" viewBox="0 0 24 24">
              {open
                ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              }
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden px-4 pt-2 pb-4 space-y-1 sm:px-6 bg-fcp-gray border-t border-fcp-border">
          {NAV_LINKS.map(({ label, href, active }) => (
            <a
              key={href}
              href={href}
              className={
                active
                  ? 'block px-3 py-2 rounded-md text-base font-medium text-fcp-text bg-fcp-border'
                  : 'block px-3 py-2 rounded-md text-base font-medium text-fcp-text-secondary hover:text-fcp-text hover:bg-fcp-border whitespace-nowrap'
              }
            >
              {label}
            </a>
          ))}
        </div>
      )}
    </nav>
  )
}

function ToolCard({ href, title, description, icon, style }) {
  return (
    <a
      href={href}
      style={style}
      className="bg-fcp-gray p-6 rounded-lg border border-fcp-border hover:border-fcp-accent transition-all cursor-pointer group hover:scale-105 animate-fade-in-up"
    >
      <div className="w-12 h-12 bg-fcp-accent rounded-lg flex items-center justify-center mb-4 mx-auto group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <h3 className="text-xl font-semibold text-fcp-text mb-2">{title}</h3>
      <p className="text-fcp-text-secondary">{description}</p>
    </a>
  )
}

function Hero() {
  return (
    <section className="text-center py-12">
      <h2 className="text-4xl font-bold text-fcp-text mb-4 animate-fade-in">Professional Video Editing Tools</h2>
      <p className="text-lg text-fcp-text-secondary max-w-4xl mx-auto animate-fade-in" style={{ animationDelay: '0.1s' }}>
        Streamline your workflow with powerful tools for color grading, subtitle management,
        XML project organization, and more to come.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
        {TOOLS.map((tool, i) => (
          <ToolCard key={tool.href} {...tool} style={{ animationDelay: `${0.2 + i * 0.08}s` }} />
        ))}
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer className="bg-fcp-gray border-t border-fcp-border mt-8">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 text-center">
        <p className="text-fcp-text-secondary text-sm mb-2">
          © 2025–2026 EditKit. Streamlined workflow utilities for video editors.
        </p>
        <a
          href="https://github.com/ronlu-o/EditKit"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-fcp-text-secondary hover:text-fcp-accent transition-colors"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
          </svg>
          <span className="text-sm">View on GitHub</span>
        </a>
      </div>
    </footer>
  )
}

// ── Root ──────────────────────────────────────────────────────────────

export default function App() {
  return (
    <div className="bg-fcp-dark text-fcp-text font-sans min-h-screen flex flex-col">
      <Nav />
      <main className="flex-1 max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 w-full">
        <Hero />
      </main>
      <Footer />
    </div>
  )
}
