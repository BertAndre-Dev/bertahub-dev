"use client";

import Tab from "@/components/tabs/page";
import { Card } from "@/components/ui/card";
import AddressField from "@/components/admin/address/field/page";
import FieldEntry from "@/components/admin/address/entry/page";

const AddressPage = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-bold">Address Management</h1>
        <p className="text-muted-foreground mt-1">
          Welcome back! Here's is an overview on{" "}
          <span className="text-[18px] font-bold underline uppercase text-black">
            Doe Estate
          </span>
          .
        </p>
      </div>
      <Card className="p-4">
        <Tab
          titles={["Entries Fields", "Address Fields"]}
          renderContent={(activeTab) => {
            switch (activeTab) {
              case "Entries Fields":
                return <FieldEntry />;
              case "Address Fields":
                return <AddressField />;
              default:
                return null;
            }
          }}
        />
      </Card>
    </div>
  );
};

export default AddressPage;
