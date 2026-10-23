import Image from "next/image";
import Link from "next/link";
import Navbar from "@/components/landing-page/navbar";
import Footer from "@/components/landing-page/footer";
import { BlogListingJsonLd } from "@/components/blog/blog-json-ld";
import { blogPosts } from "@/lib/blog/posts";
import { createBlogIndexMetadata } from "@/lib/blog/seo";

export const metadata = createBlogIndexMetadata();

function formatDate(isoDate: string) {
  return new Date(isoDate).toLocaleDateString("en-NG", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-white">
      <BlogListingJsonLd posts={blogPosts} />
      <Navbar />

      <header className="relative bg-[#050816] text-white pt-28 pb-16 lg:pt-36 lg:pb-20 overflow-hidden">
        <div
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: "url(/assets/bg.svg)",
            backgroundRepeat: "no-repeat",
            backgroundSize: "cover",
            backgroundPosition: "center",
            opacity: 0.35,
          }}
        />

          <div className="flex justify-center items-center mx-auto my-12">
                <p className="text-[#FA8128] text-base lg:text-lg font-bold uppercase tracking-wide mb-4">
                Bertahub Blog
              </p>
              </div>
      
      </header>

      <main className="container mx-auto px-6 md:px-8 lg:px-10 xl:px-20 max-w-[1320px] xl:max-w-[1440px] py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {blogPosts.map((post) => (
            <article
              key={post.slug}
              className="group rounded-2xl border border-[#E5E7EB] bg-white overflow-hidden hover:border-[#1560BD]/30 hover:shadow-lg transition-all"
            >
              {post.featuredImage && (
                <Link
                  href={`/blog/${post.slug}`}
                  className="block relative aspect-[16/9] w-full overflow-hidden"
                >
                  <Image
                    src={post.featuredImage}
                    alt={post.featuredImageAlt ?? post.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 768px"
                    className="object-cover object-center transition-transform duration-300 group-hover:scale-[1.02]"
                  />
                </Link>
              )}

              <div className="p-6">
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <span className="rounded-full bg-[#EEF4FC] text-[#1560BD] text-xs font-medium px-3 py-1">
                  {post.category}
                </span>
                <span className="text-sm text-[#6B7280]">
                  {formatDate(post.publishedAt)} · {post.readTimeMinutes} min read
                </span>
              </div>

              <Link href={`/blog/${post.slug}`} className="block">
                <h2 className="text-xl sm:text-2xl font-semibold text-[#111827] group-hover:text-[#1560BD] transition-colors mb-3">
                  {post.title}
                </h2>
              </Link>

              <p className="text-[#FA8128] font-medium italic mb-4 text-base sm:text-lg">
                {post.hook}
              </p>

              <p className="text-[#4B5563] leading-relaxed mb-6">
                {post.excerpt}
              </p>

              <Link
                href={`/blog/${post.slug}`}
                className="inline-flex items-center gap-2 text-[#1560BD] font-medium hover:gap-3 transition-all"
              >
                Read article
                <span aria-hidden>→</span>
              </Link>
              </div>
            </article>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
}
