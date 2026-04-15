"use client";

import React from "react";
import Image from "next/image";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFacebook, faYoutube, faTwitter, faPinterest, faInstagram } from '@fortawesome/free-brands-svg-icons';

<FontAwesomeIcon icon={faFacebook} />


const Footer = () => {
  return (
    <>
      <div className="bg-amber-600">
        <div className="container mx-auto flex flex-col md:flex-row items-center md:justify-between px-4 py-10">
          <div className="font-bold text-3xl md:w-1/2 w-full" id="cta">
            <h4 className="text-white text-center md:text-left whitespace-normal md:whitespace-nowrap">
                Irembo ry’Afurika ku Mashusho y’Ubumenyi n’Ubushakashatsi!
            </h4>
            </div>


          <div className="w-full md:w-1/2 flex justify-center md:justify-end mt-6 md:mt-0">
            <a
              href="#"
              className="bg-white hover:bg-amber-50 text-amber-600 rounded-full py-2 px-6"
            >
              Dusure
            </a>
          </div>
        </div>
      </div>

      <footer className="bg-black md:h-90 h-auto md:p-15">
        <div className="container flex flex-col md:flex-row-reverse mx-auto items-center justify-center">
          <div className="w-full md:w-1/3 mt-10 flex flex-col items-center">
            <Image src="/logo.png" width={150} height={150} alt="logo" />
            <span className="flex space-x-4 mt-10 text-white">
              <Image src="/facebook.svg" width={20} height={20} alt="fb" className="invert"/>
              <Image src="/youtube.svg" width={20} height={20} alt="yt" className="invert"/>
              <Image src="/x.svg" width={20} height={20} alt="tw" className="invert"/>
              <Image src="/tiktok.svg" width={20} height={20} alt="pt" className="invert"/>
              <Image src="/instagram.svg" width={20} height={20} alt="ig" className="invert" />
            </span>
          </div>

          <div className="w-full md:w-1/3 flex flex-row justify-center gap-10 mt-6 md:mt-0">
            <div>
              <ul className="text-white space-y-2 text-center md:text-left">
                <li>
                  <a href="./" className="hover:text-amber-300">
                    Amakuru
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-amber-300">
                    Imyidagaduro
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-amber-300">
                    Imikino
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-amber-300">
                    Ubumenya-muntu
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <ul className="text-white space-y-2 text-center md:text-left">
                <li>
                  <a href="./video" className="hover:text-amber-300">
                    Videos
                  </a>
                </li>
                <li>
                  <a href="./ishuri" className="hover:text-amber-300">
                    Ishuri
                  </a>
                </li>
                <li>
                  <a href="./twandikire" className="hover:text-amber-300">
                    Twandikire
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="w-xlg md:w-1/3 mt-7 flex flex-col items-center">
            <form className="flex w-full max-w-md">
              <input
                type="text"
                placeholder="Tanga igitekerezo..."
                className="bg-white py-1 px-5 rounded-l-full focus:outline-none flex-grow"
              />
              <input
                type="submit"
                value="Ohereza"
                className="bg-amber-600 text-amber-50 rounded-r-full py-1 px-5 cursor-pointer"
              />
            </form>
            <p className="text-gray-400 text-sm pt-12">
              RedBlue JD  &copy; 2025, All Rights Reserved
            </p>
          </div>
        </div>
      </footer>
    </>
  );
};

export default Footer;
