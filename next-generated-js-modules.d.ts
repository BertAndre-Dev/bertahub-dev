declare module "*.js" {
  const entry: any;
  export default entry;

  // Next.js may generate typecheck stubs that import `page.js` for App Router
  // segments even when the source is `page.tsx`. We only need these symbols to
  // exist for typechecking; the runtime uses the TS/TSX modules.
  export const config: any;
  export const dynamic: any;
  export const dynamicParams: any;
  export const revalidate: any;
  export const fetchCache: any;
  export const runtime: any;
  export const preferredRegion: any;
  export const maxDuration: any;
  export const unstable_prefetch: any;

  export const metadata: any;
  export const viewport: any;
  export const generateMetadata: any;
  export const generateViewport: any;
  export const generateStaticParams: any;
}

