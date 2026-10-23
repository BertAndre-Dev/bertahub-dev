import { BookDemoProvider } from "@/components/landing-page/book-demo-provider";

export default function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <BookDemoProvider>{children}</BookDemoProvider>;
}
