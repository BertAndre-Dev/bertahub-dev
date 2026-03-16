import Image from "next/image";

export default function BertaShowcaseSection() {
  return (
    <section className="bg-black my-16 lg:my-24">
      <div className="container mx-auto px-0 max-w-[1320px] xl:max-w-[1440px]">
        <div className="relative overflow-hidden rounded-3xl">
          {/* Mobile vertical composition */}
          <div className="block md:hidden">
            <div className="group flex flex-col">
              <Image
                src="/assets/showcase/behance.svg"
                alt="Behance showcase"
                width={200}
                height={200}
                className="
                    h-full w-full object-cover
                    transition-transform transition-shadow transition-filter
                    duration-700 ease-out
                    group-hover:scale-110
                    group-hover:-translate-y-3
                    group-hover:brightness-125
                    group-hover:shadow-[0_20px_60px_rgba(0,0,0,0.7)]
                  "
                loading="lazy"
              />
              <Image
                src="/assets/showcase/behance1.svg"
                alt="Berta Hub multi-device preview"
                width={200}
                height={200}
                className="
                    h-full w-full object-cover
                    transition-transform transition-shadow transition-filter
                    duration-700 ease-out
                    group-hover:scale-110
                    group-hover:-translate-y-3
                    group-hover:brightness-125
                    group-hover:shadow-[0_20px_60px_rgba(0,0,0,0.7)]
                  "
                loading="lazy"
              />
              <Image
                src="/assets/showcase/behance2.svg"
                alt="Berta Hub multi-device preview"
                width={200}
                height={200}
                className="
                    h-full w-full object-cover
                    transition-transform transition-shadow transition-filter
                    duration-700 ease-out
                    group-hover:scale-110
                    group-hover:-translate-y-3
                    group-hover:brightness-125
                    group-hover:shadow-[0_20px_60px_rgba(0,0,0,0.7)]
                  "
                loading="lazy"
              />
            </div>
          </div>

          {/* Tablet / Desktop composition */}
          <div className="hidden md:block">
            <div className="flex flex-row">
              {/* Image 1 */}
              <div className="group relative overflow-hidden">
                <Image
                  src="/assets/showcase/showcase.svg"
                  alt="Berta Hub multi-device preview"
                  width={300}
                  height={400}
                  className="
                    h-full w-full object-cover
                    transition-transform transition-shadow transition-filter
                    duration-700 ease-out
                    group-hover:scale-110
                    group-hover:-translate-y-3
                    group-hover:brightness-125
                    group-hover:shadow-[0_20px_60px_rgba(0,0,0,0.7)]
                  "
                />
              </div>

              {/* Image 2 */}
              <div className="group relative overflow-hidden">
                <Image
                  src="/assets/showcase/showcas2.svg"
                  alt="Berta Hub multi-device preview"
                  width={300}
                  height={400}
                  className="
                    h-full w-full object-cover
                    transition-transform transition-shadow transition-filter
                    duration-700 ease-out
                    group-hover:scale-110
                    group-hover:-translate-y-3
                    group-hover:brightness-125
                    group-hover:shadow-[0_20px_60px_rgba(0,0,0,0.7)]
                  "
                />
              </div>

              {/* Image 3 */}
              <div className="group relative overflow-hidden">
                <Image
                  src="/assets/showcase/showcase3.svg"
                  alt="Berta Hub multi-device preview"
                  width={300}
                  height={400}
                  className="
                    h-full w-full object-cover
                    transition-transform transition-shadow transition-filter
                    duration-700 ease-out
                    group-hover:scale-110
                    group-hover:-translate-y-3
                    group-hover:brightness-125
                    group-hover:shadow-[0_20px_60px_rgba(0,0,0,0.7)]
                  "
                />
              </div>
            </div>
          </div>

          {/* Gradient overlay */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/65 via-black/20 to-black/5" />

          {/* Title */}
          <div className="absolute bottom-4 left-4 sm:bottom-8 sm:left-8 lg:bottom-10 lg:left-10">
            <h2 className="text-white text-xl sm:text-3xl lg:text-[32px] font-semibold">
              Berta Hub
            </h2>

            <div className="mt-2 h-[3px] w-16 sm:w-20 rounded-full bg-[#FA8128]" />
          </div>
        </div>
      </div>
    </section>
  );
}
