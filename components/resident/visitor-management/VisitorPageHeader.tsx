"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export function VisitorPageHeader({
  onAddVisitor,
}: Readonly<{
  onAddVisitor: () => void;
}>) {
  return (
    <div className="flex flex-col md:flex-row gap-5 md:gap-0 items-start md:items-center justify-between">
      <h1 className="font-heading text-3xl font-bold">Visitor Management</h1>
      <Button onClick={onAddVisitor} className="flex items-center gap-2">
        <Plus className="w-4 h-4" />
        Add Visitor
      </Button>
    </div>
  );
}

