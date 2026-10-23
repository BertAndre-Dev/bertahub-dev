import ClientProvider from "@/components/client-provider/page";

export default function PlatformLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <ClientProvider>{children}</ClientProvider>;
}
