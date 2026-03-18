"use client";

import React from "react";
import Slider from "react-slick";
import Image from "next/image";

interface Partner {
  id: number;
  name: string;
  logo: string;
}

const partners: Partner[] = [
  { id: 1, name: "Kabana", logo: "/assets/kabana.svg" },
  { id: 2, name: "Ezra Court Two", logo: "/assets/ezra-court.svg" },
];

// Duplicate enough times so infinite scroll always has content to slide through
const duplicatedPartners = [...partners, ...partners, ...partners, ...partners];

const TrustedBy = () => {
  const settings = {
    dots: false,
    arrows: false,
    infinite: true,
    speed: 4000,
    autoplay: true,
    autoplaySpeed: 0,
    cssEase: "linear",
    slidesToShow: 4,
    slidesToScroll: 1,
    pauseOnHover: true,
    responsive: [
      {
        breakpoint: 1024,
        settings: { slidesToShow: 3 },
      },
      {
        breakpoint: 768,
        settings: { slidesToShow: 2 },
      },
      {
        breakpoint: 480,
        settings: { slidesToShow: 1 },
      },
    ],
  };

  return (
    <section className="w-full py-12 bg-[#A1A1A11A]">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="flex flex-col items-center justify-center mb-8">
          <p className="text-center text-[32px] md:text-[48px] font-bold uppercase tracking-widest">
            Trusted by
          </p>
          <div className="mt-2 h-[3px] w-24 rounded-full bg-[#FA8128]" />
        </div>

        {/* Slider */}
        <div className="relative overflow-hidden">
          {/* Fade edges */}
          <div className="absolute left-0 top-0 h-full w-24 bg-gradient-to-r from-[#f5f5f5] to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 h-full w-24 bg-gradient-to-l from-[#f5f5f5] to-transparent z-10 pointer-events-none" />

          <Slider {...settings}>
            {duplicatedPartners.map((partner, index) => (
              <div key={`${partner.id}-${index}`} className="px-6 outline-none">
                <div className="flex items-center justify-center h-32 transition-all duration-300">
                  <Image
                    src={partner.logo}
                    alt={partner.name}
                    width={500}
                    height={300}
                    className="object-contain max-h-24 w-auto"
                  />
                </div>
              </div>
            ))}
          </Slider>
        </div>
      </div>
    </section>
  );
};

export default TrustedBy;
