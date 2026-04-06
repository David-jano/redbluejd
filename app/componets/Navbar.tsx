"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  FaHome,
  FaInfoCircle,
  FaVideo,
  FaBook,
  FaSchool,
  FaEnvelope,
  FaBookOpen,
  FaHeartbeat,
  FaUserFriends,
  FaPaintBrush,
  FaShoppingBag,
  FaFolder,
  FaFlask,
} from "react-icons/fa";

export default function Navbar() {
  const [isTextVisible, setIsTextVisible] = useState(false);
  const [isLinksMoved, setIsLinksMoved] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDesktopDropdownOpen, setIsDesktopDropdownOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const mobileMenuRef = useRef<HTMLDivElement | null>(null);
  const desktopDropdownRef = useRef<HTMLDivElement | null>(null);
  const desktopHamburgerRef = useRef<HTMLButtonElement | null>(null);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Close mobile menu
      if (
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(event.target as Node) &&
        !menuRef.current?.contains(event.target as Node)
      ) {
        setIsMobileMenuOpen(false);
      }

      // Close desktop dropdown
      if (
        desktopDropdownRef.current &&
        !desktopDropdownRef.current.contains(event.target as Node) &&
        !desktopHamburgerRef.current?.contains(event.target as Node)
      ) {
        setIsDesktopDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle scroll to animate links and fade-in text
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsTextVisible(true);
        setIsLinksMoved(true);
      } else {
        setIsTextVisible(false);
        setIsLinksMoved(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu when a link is clicked
  const handleMobileLinkClick = () => {
    setIsMobileMenuOpen(false);
  };

  // Close desktop dropdown when a link is clicked
  const handleDesktopDropdownLinkClick = () => {
    setIsDesktopDropdownOpen(false);
  };

  // Common link class with gradient hover for both text and icons
  const linkClass =
    "flex items-center gap-2 transition duration-300 hover:text-transparent hover:bg-clip-text hover:bg-gradient-to-r hover:from-yellow-400 hover:via-red-500 hover:to-blue-500";

  const mobileLinkClass =
    "flex items-center gap-2 px-4 py-2 text-white transition duration-300 hover:text-transparent hover:bg-clip-text hover:bg-gradient-to-r hover:from-yellow-400 hover:via-red-500 hover:to-blue-500";

  const desktopDropdownLinkClass =
    "flex items-center gap-2 px-4 py-2 text-black transition duration-300 hover:text-transparent hover:bg-clip-text hover:bg-gradient-to-r hover:from-yellow-400 hover:via-red-500 hover:to-blue-500";

  return (
    <nav className="bg-black text-white shadow-md px-6 py-5 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between relative">
        {/* Left section */}
        <div className="flex items-center space-x-4">
          {/* Desktop Hamburger Button (Visible on medium and large screens) */}
          <div className="hidden md:block">
            <button
              ref={desktopHamburgerRef}
              onClick={() => setIsDesktopDropdownOpen(!isDesktopDropdownOpen)}
              aria-label="Toggle desktop dropdown menu"
              className="text-white focus:outline-none hover:opacity-80 transition-opacity"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {isDesktopDropdownOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>

          {/* Mobile Logo */}
          <div className="md:hidden">
            <Link
              href="/"
              className="flex items-center"
              onClick={handleMobileLinkClick}
            >
              <Image
                src="/logo.png"
                alt="Logo"
                width={60}
                height={60}
                priority
              />
            </Link>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-6" ref={menuRef}>
            <Link href="/" className={linkClass}>
              <FaHome /> AHABANZA
            </Link>
            <Link href="/aboturibo" className={linkClass}>
              <FaInfoCircle /> ABO TURIBO
            </Link>
            <Link href="/video" className={linkClass}>
              <FaVideo /> VIDEO
            </Link>
          </div>
        </div>

        {/* Center Logo for Desktop */}
        <div className="hidden md:block absolute left-1/2 transform -translate-x-1/2">
          <Link href="/" className="flex items-center">
            <Image src="/logo.png" alt="Logo" width={60} height={60} priority />
          </Link>
        </div>

        {/* Fade-in Text for Scroll */}
        <span
          className={`absolute top-3 left-140 transform -translate-x-1/2 text-white font-bold text-sm transition-opacity duration-1000 ease-in-out ${
            isTextVisible ? "opacity-80" : "opacity-0"
          }`}
        >
          RedBlue JD
        </span>

        {/* Right Section for Desktop with smooth transition */}
        <div
          className={`hidden md:flex items-center space-x-6 transition-all duration-700 ease-in-out ${
            isLinksMoved
              ? "translate-x-10 opacity-100"
              : "translate-x-0 opacity-100"
          }`}
        >
          <Link href="/iguriro" className={linkClass}>
            <FaShoppingBag /> eGURIRO
          </Link>
          <Link href="/ishuri" className={linkClass}>
            <FaSchool /> ISHURI
          </Link>
          <Link href="/ubumenyi" className={linkClass}>
            <FaBookOpen /> UBUMENYI
          </Link>
          <Link
            href="/twandikire"
            className="flex items-center gap-2 bg-amber-600 px-5 py-2 rounded-sm bg-amber-700hover: transition-colors duration-300"
          >
            <FaEnvelope /> TWANDIKIRE
          </Link>
        </div>

        {/* Mobile Hamburger (Visible on mobile only) */}
        <div className="md:hidden" ref={menuRef}>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle mobile menu"
            className="focus:outline-none hover:opacity-80 transition-opacity"
          >
            {isMobileMenuOpen ? (
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            ) : (
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Desktop Dropdown Menu (For medium and large screens) */}
      {isDesktopDropdownOpen && (
        <div
          ref={desktopDropdownRef}
          className="hidden md:block absolute top-14 left-77 bg-white mt-2 py-2 w-56 rounded shadow-lg z-20"
        >
          <Link
            href="/amateka"
            className={desktopDropdownLinkClass}
            onClick={handleDesktopDropdownLinkClick}
          >
            <FaFolder /> AMATEKA
          </Link>
          <Link
            href="/siyanse"
            className={desktopDropdownLinkClass}
            onClick={handleDesktopDropdownLinkClick}
          >
            <FaFlask /> SIYANSI
          </Link>
          <Link
            href="/ibitabo"
            className={desktopDropdownLinkClass}
            onClick={handleDesktopDropdownLinkClick}
          >
            <FaBookOpen /> IBITABO
          </Link>
          <Link
            href="/ubuzima"
            className={desktopDropdownLinkClass}
            onClick={handleDesktopDropdownLinkClick}
          >
            <FaHeartbeat /> UBUZIMA
          </Link>
          <Link
            href="/ubumenyamuntu"
            className={desktopDropdownLinkClass}
            onClick={handleDesktopDropdownLinkClick}
          >
            <FaUserFriends /> UBUMENYA-MUNTU
          </Link>
          <Link
            href="/ubugeni"
            className={desktopDropdownLinkClass}
            onClick={handleDesktopDropdownLinkClick}
          >
            <FaPaintBrush /> UBUGENI
          </Link>
          <Link
            href="/ibyegeranyo"
            className={desktopDropdownLinkClass}
            onClick={handleDesktopDropdownLinkClick}
          >
            <FaBook /> IBYEGERANYO
          </Link>
          <Link
            href="/philosoph"
            className={desktopDropdownLinkClass}
            onClick={handleDesktopDropdownLinkClick}
          >
            <FaBook /> FILOZOFIYA
          </Link>
        </div>
      )}

      {/* Mobile Dropdown Menu */}
      {isMobileMenuOpen && (
        <div
          ref={mobileMenuRef}
          className="md:hidden absolute top-full left-0 right-0 bg-black py-2 shadow-lg z-20 max-h-[80vh] overflow-y-auto"
        >
          <Link
            href="/"
            className={mobileLinkClass}
            onClick={handleMobileLinkClick}
          >
            <FaHome /> AHABANZA
          </Link>
          <Link
            href="/aboturibo"
            className={mobileLinkClass}
            onClick={handleMobileLinkClick}
          >
            <FaInfoCircle /> ABO TURIBO
          </Link>
          <Link
            href="/video"
            className={mobileLinkClass}
            onClick={handleMobileLinkClick}
          >
            <FaVideo /> VIDEO
          </Link>
          <Link
            href="/ishuri"
            className={mobileLinkClass}
            onClick={handleMobileLinkClick}
          >
            <FaSchool /> ISHURI
          </Link>
          <Link
            href="/amateka"
            className={mobileLinkClass}
            onClick={handleMobileLinkClick}
          >
            <FaFolder /> AMATEKA
          </Link>
          <Link
            href="/siyanse"
            className={mobileLinkClass}
            onClick={handleMobileLinkClick}
          >
            <FaFlask /> SIYANSE
          </Link>
          <Link
            href="/ibitabo"
            className={mobileLinkClass}
            onClick={handleMobileLinkClick}
          >
            <FaBookOpen /> IBITABO
          </Link>
          <Link
            href="/ubuzima"
            className={mobileLinkClass}
            onClick={handleMobileLinkClick}
          >
            <FaHeartbeat /> UBUZIMA
          </Link>
          <Link
            href="/ubumenyamuntu"
            className={mobileLinkClass}
            onClick={handleMobileLinkClick}
          >
            <FaUserFriends /> UBUMENYA-MUNTU
          </Link>
          <Link
            href="/ubugeni"
            className={mobileLinkClass}
            onClick={handleMobileLinkClick}
          >
            <FaPaintBrush /> UBUGENI
          </Link>
          <Link
            href="/ibyegeranyo"
            className={mobileLinkClass}
            onClick={handleMobileLinkClick}
          >
            <FaBook /> IBYEGERANYO
          </Link>
          <Link
            href="/philosoph"
            className={mobileLinkClass}
            onClick={handleMobileLinkClick}
          >
            <FaBook /> PHILOSOPH
          </Link>
          <Link
            href="/twandikire"
            className={mobileLinkClass}
            onClick={handleMobileLinkClick}
          >
            <FaEnvelope /> TWANDIKIRE
          </Link>
        </div>
      )}
    </nav>
  );
}
