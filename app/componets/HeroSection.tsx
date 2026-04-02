"use client";

import Image from "next/image";
import { useState } from "react";

const HeroSection = () => {
  const [copied, setCopied] = useState(false);
  const [showNumber, setShowNumber] = useState(false);
  const phoneNumber = "+250788223733";

  const handleCall = () => {
    window.location.href = `tel:${phoneNumber}`;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(phoneNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-[#e7f5e7] min-h-[500px] flex items-center justify-center p-8">
      <div className="container mx-auto flex flex-col md:flex-row items-center justify-between">
        {/* Left Side: Text and Button */}
        <div className="text-center md:text-left md:w-1/2 p-4">
          <p className="text-black bg-amber-400 rounded-full font-semibold mb-2 px-4 w-fit mx-auto md:mx-0">
            RedBlue Jd Rwanda
          </p>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-[#333] leading-tight mb-4">
            Murakaza neza Mu isi
            <br className="hidden sm:inline" /> yo Gucukumbura
          </h1>
          <p className="text-gray-600 mb-6 max-w-md mx-auto md:mx-0">
            Irembo ry'Afurika ku Mashusho y'Ubumenyi n'Ubushakashatsi!
          </p>

          {/* Phone Button with integrated functionality */}
          <div className="relative inline-block w-full sm:w-auto">
            <button
              onMouseEnter={() => setShowNumber(true)}
              onMouseLeave={() => setShowNumber(false)}
              onClick={handleCall}
              className="group bg-black text-white font-semibold py-3 px-8 rounded-lg shadow-lg hover:bg-opacity-90 transition-colors flex items-center justify-center space-x-2 w-full sm:w-auto"
            >
              <span>Duhamagare</span>
              <span className="transform group-hover:translate-x-1 transition-transform duration-300">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                  ></path>
                </svg>
              </span>
            </button>

            {/* Tooltip with number and copy option */}
            {showNumber && (
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-3 w-64 bg-white rounded-lg shadow-xl border border-gray-200 p-3 z-50 animate-in fade-in slide-in-from-bottom-2">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-mono text-sm text-gray-800">
                    {phoneNumber}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopy();
                    }}
                    className="text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded transition-colors"
                  >
                    {copied ? "✓ Copied" : "Copy"}
                  </button>
                </div>
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2 bg-white border-r border-b border-gray-200"></div>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Image and Floating Elements */}
        <div className="relative mt-8 md:mt-0 md:w-1/2 flex justify-center">
          {/* Main Image */}
          <Image
            src="/Book-3.png"
            alt="Education and research illustration"
            width={400}
            height={400}
            className="rounded-lg object-contain"
          />

          {/* Floating Element 1 - Research Card (updated to match Knowledge Card style) */}
          <div className="absolute top-4 sm:top-15 right-4 sm:right-15 bg-white rounded-lg p-2 shadow-lg flex flex-col items-start space-y-1">
            <div className="flex items-center space-x-2">
              {/* Book icon */}
              <svg
                className="w-5 h-5 text-blue-800"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.5"
                  d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"
                ></path>
              </svg>
              <p className="text-sm font-semibold text-blue-800">
                Ubushakashatsi
              </p>
            </div>
            <div className="flex items-center">
              {/* Star icons for rating */}
              {[...Array(4)].map((_, i) => (
                <svg
                  key={i}
                  className="w-3 h-3 text-blue-800  fill-current"
                  viewBox="0 0 20 20"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                </svg>
              ))}
              <svg
                className="w-3 h-3 text-gray-300 fill-current"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
              </svg>
              <span className="text-xs text-gray-400 ml-1">(4.9)</span>
            </div>
          </div>

          {/* Floating Element 2 - Knowledge Card */}
          <div className="absolute bottom-10 sm:bottom-20 left-4 sm:left-29 bg-white rounded-lg p-2 shadow-lg flex flex-col items-start space-y-1">
            <div className="flex items-center space-x-2">
              {/* Checkmark icon replacing ✅ */}
              <svg
                className="w-5 h-5 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                ></path>
              </svg>
              <p className="text-sm font-semibold text-green-600">Ubumenyi</p>
            </div>
            <div className="flex items-center">
              {/* Star icons for rating */}
              {[...Array(4)].map((_, i) => (
                <svg
                  key={i}
                  className="w-3 h-3 text-green-700 fill-current"
                  viewBox="0 0 20 20"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                </svg>
              ))}
              <svg
                className="w-3 h-3 text-gray-300 fill-current"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
              </svg>
              <span className="text-xs text-gray-400 ml-1">(4.9)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
