import Image from "next/image";
import Link from "next/link";
import ArticleGrid from './componets/ArticleGrid';
import SmallCardsSection from './componets/SmallCardsSection';
import WhatsAppFloatingButton from "./componets/WhatsAppFloatingButton";
import HeroSection from "./componets/HeroSection";
import VideoGrid from "./componets/VideoGrid";
import ShortLinksSection from "./componets/ShortLinksSection"
import SubfooterCardsSection from "./componets/SubfooterCards";

export default function Home() {
  return (
    <>
      <HeroSection />

      {/*=================================cards layout section=======================================================*/}
      <SmallCardsSection/>
      
      <ShortLinksSection/>
      
      {/*=================================titles Section=======================================================*/}
      <ArticleGrid />
      <SubfooterCardsSection/>
      <WhatsAppFloatingButton/>
    </>
  );
}