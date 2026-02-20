"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { Menu, X, LogOut, Bell, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  adminNav,
  superAdminNav,
  securityNav,
  residentNav,
  estateAdminNav,
} from "@/data/page";
import { AppDispatch, RootState } from "@/redux/store";
import {
  hydrateAuthFromStorage,
  logoutLocally,
} from "@/redux/slice/auth-mgt/auth-mgt-slice";
import { getSignedInUser } from "@/redux/slice/auth-mgt/auth-mgt";
import NextImage from "next/image"; // ✅ Renamed import to avoid conflict
import Image from "next/image";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useDispatch<AppDispatch>();
  const { token, user: reduxUser } = useSelector(
    (state: RootState) => state.auth,
  );
  const hasFetchedUser = useRef(false);
  const [user, setUser] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(true);

  // 🔹 Handle sidebar state based on screen size (collapsed on mobile, expanded on desktop)
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setSidebarOpen(false); // Mini sidebar on mobile
      } else {
        setSidebarOpen(true); // Full sidebar on desktop
      }
    };

    // Set initial state
    handleResize();

    // Add event listener
    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // 🔹 Load user from localStorage or redirect if missing
  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (!userData) {
      router.push("/auth/login");
      return;
    }
    setUser(JSON.parse(userData));
    setLoading(false);
  }, [router]);

  // 🔹 Hydrate Redux state from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      dispatch(hydrateAuthFromStorage());
    }
  }, [dispatch]);

  // 🔹 Validate token and refresh user session
  useEffect(() => {
    if (typeof window === "undefined") return;
    const localToken = localStorage.getItem("token");

    if (!localToken && !token) {
      router.push("/auth/login");
      return;
    }

    if (!hasFetchedUser.current && (token || localToken)) {
      hasFetchedUser.current = true;
      dispatch(getSignedInUser())
        .unwrap()
        .catch(() => {
          toast.error("Session expired. Please sign in again.");
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          dispatch(logoutLocally());
          router.push("/auth/login");
        });
    }
  }, [dispatch, router, token]);

  // 🔹 Sign out handler
  const handleSignOut = () => {
    dispatch(logoutLocally());
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    toast.success("Signed out successfully");
    router.push("/auth/login");
  };

  // 🔹 Choose navigation items based on role
  const renderNavItems = () => {
    if (!user) return null;

    const role = user?.role?.toLowerCase();
    const navItems =
      role === "super admin"
        ? superAdminNav
        : role === "admin"
          ? adminNav
          : role === "estate admin"
            ? estateAdminNav
            : role === "resident"
              ? residentNav
              : securityNav;
    return navItems.map((item, i) => {
      const Icon = item.icon;
      const active = pathname.startsWith(item.path);

      return (
        <Link
          key={i}
          href={item.path}
          className={`flex items-center w-full gap-3 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
            active
              ? "bg-primary/10 text-primary font-semibold"
              : "text-muted-foreground hover:bg-muted/50"
          }`}
        >
          <Icon className="w-4 h-4" />
          {sidebarOpen && <span>{item.label}</span>}
        </Link>
      );
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300 z-40 ${
          sidebarOpen ? "w-64" : "w-20"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between pl-6 border-b border-sidebar-border">
            <div
              className={`flex items-center ${!sidebarOpen && "justify-center w-full"}`}
            >
              <NextImage
                src="/logo.svg"
                alt="BertaHub"
                width={100}
                height={100}
              />
              {/* {sidebarOpen && (
                <span className="font-heading font-bold text-lg">BertAhub</span>
              )} */}
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-2">
            {renderNavItems()}
          </nav>

          {/* User Info */}
          <div className="bg-[#f2f2f2] border-t border-sidebar-border p-2 md:p-4">
            <button
              className="flex items-center gap-0 md:gap-3 w-full rounded-lg hover:bg-sidebar-accent transition-colors overflow-x-scroll"
              onClick={handleSignOut}
            >
              {/* <div className="w-8 h-8 bg-sidebar-primary rounded-full flex items-center justify-center text-white">
                {user?.firstName?.[0] || "U"}
              </div> */}
<div className='bg-[#4E61E5]'>
   <Image
                src={user?.image || "/public/file.svg"}
                alt="User image"
                width={32}
                height={32}
              />

</div>
              {sidebarOpen && (
                <div className="flex-1 text-left">
                  <p className="text-base font-semibold">
                    {user?.firstName} {user?.lastName}
                  </p>
                  {/* <p className="text-xs text-sidebar-foreground/60">
                    {user?.email}
                  </p> */}
                  <p className="text-base font-normal ">{user?.role}</p>
                </div>
              )}
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main
        className={`flex-1 overflow-auto transition-all duration-300 ${sidebarOpen ? "ml-64" : "ml-20"}`}
      >
        {/* Topbar */}
        <header className="sticky top-0 bg-background border-b border-border z-30">
          <div className="flex items-center justify-between px-6 py-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
            >
              {sidebarOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>

            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-2 bg-muted px-4 py-2 rounded-lg">
                <Search className="w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="bg-transparent outline-none text-sm w-48"
                />
              </div>
              <button
                title="Notifications"
                className="p-2 hover:bg-muted rounded-lg transition-colors relative"
              >
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-accent rounded-full" />
              </button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="text-muted-foreground hover:text-foreground"
              >
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <Suspense fallback={<div>Loading...</div>}>
          <div className="p-4 md:p-6">{children}</div>
        </Suspense>
      </main>
    </div>
  );
}
