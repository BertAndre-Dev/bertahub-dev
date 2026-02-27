"use client";

import { useMemo, useState } from "react";
import { Building2, MapPin, Store, Plus, Eye, Edit2, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Table from "@/components/tables/list/page";

interface MarketplaceBusiness {
  id: string;
  name: string;
  category: string;
  city: string;
  state: string;
  createdAt: string;
  isActive: boolean;
}

const DUMMY_BUSINESSES: MarketplaceBusiness[] = [
  {
    id: "1",
    name: "Janedoe Shoes",
    category: "Fashion",
    city: "Lagos",
    state: "Lagos",
    createdAt: "2026-02-16 11:57 AM",
    isActive: true,
  },
  {
    id: "2",
    name: "Janedoe Autos",
    category: "Automobile",
    city: "Abuja",
    state: "FCT",
    createdAt: "2026-02-16 11:57 AM",
    isActive: true,
  },
  {
    id: "3",
    name: "Janedoe Insurance",
    category: "Insurance",
    city: "Port Harcourt",
    state: "Rivers",
    createdAt: "2026-02-16 11:57 AM",
    isActive: true,
  },
  {
    id: "4",
    name: "Janedoe Consulting",
    category: "Consulting",
    city: "Ibadan",
    state: "Oyo",
    createdAt: "2026-02-16 11:57 AM",
    isActive: true,
  },
  {
    id: "5",
    name: "Janedoe Salon",
    category: "Hairstyling",
    city: "Lagos",
    state: "Lagos",
    createdAt: "2026-02-16 11:57 AM",
    isActive: false,
  },
];

export default function SuperAdminMarketplacePage() {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim()) return DUMMY_BUSINESSES;
    const term = search.toLowerCase();
    return DUMMY_BUSINESSES.filter(
      (b) =>
        b.name.toLowerCase().includes(term) ||
        b.category.toLowerCase().includes(term) ||
        b.city.toLowerCase().includes(term) ||
        b.state.toLowerCase().includes(term),
    );
  }, [search]);

  const stats = [
    {
      label: "Total Businesses",
      value: "125",
      icon: Store,
      bg: "bg-[#F1F5F9]",
    },
    {
      label: "Active Estates",
      value: "25",
      icon: Building2,
      bg: "bg-[#E0F2FE]",
    },
    {
      label: "Cities Covered",
      value: "25",
      icon: MapPin,
      bg: "bg-[#ECFEFF]",
    },
    {
      label: "States",
      value: "25",
      icon: MapPin,
      bg: "bg-[#F5F3FF]",
    },
  ];

  const columns = [
    {
      key: "name",
      header: "Business Name",
    },
    {
      key: "category",
      header: "Category",
    },
    {
      key: "createdAt",
      header: "Created At",
    },
    {
      key: "isActive",
      header: "Status",
      render: (item: MarketplaceBusiness) => (
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            item.isActive
              ? "bg-emerald-50 text-emerald-700"
              : "bg-red-50 text-red-700"
          }`}
        >
          {item.isActive ? "Active" : "Inactive"}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (item: MarketplaceBusiness) => (
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="text-blue-600 hover:text-blue-700"
            aria-label={`View ${item.name}`}
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="text-emerald-600 hover:text-emerald-700"
            aria-label={`Edit ${item.name}`}
          >
            <Edit2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="text-red-600 hover:text-red-700"
            aria-label={`Delete ${item.name}`}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 sm:space-y-8 pb-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold">Marketplace</h1>
          <p className="text-muted-foreground mt-1">
            Manage businesses in the marketplace across all estates.
          </p>
        </div>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Business
        </Button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4 lg:gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card
              key={stat.label}
              className="flex items-center justify-between gap-4 p-4 sm:p-5 md:p-6"
            >
              <div>
                <p className="text-muted-foreground text-sm">{stat.label}</p>
                <p className="font-heading text-2xl font-bold md:text-3xl">
                  {stat.value}
                </p>
              </div>
              <div
                className={`flex h-11 w-11 items-center justify-center rounded-full ${stat.bg}`}
              >
                <Icon className="h-5 w-5 text-[#1E293B]" />
              </div>
            </Card>
          );
        })}
      </div>

      {/* Table */}
      <Card className="p-4 sm:p-5 md:p-6">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-medium text-sm text-muted-foreground">
            Showing {filtered.length} of {DUMMY_BUSINESSES.length} businesses
          </p>
          <input
            type="text"
            placeholder="Search businesses..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 w-full rounded-md border border-border px-3 text-sm outline-none focus:ring-2 focus:ring-primary sm:w-64"
          />
        </div>
        <Table<MarketplaceBusiness>
          columns={columns}
          data={filtered}
          emptyMessage="No businesses found"
          showPagination={false}
        />
      </Card>
    </div>
  );
}

