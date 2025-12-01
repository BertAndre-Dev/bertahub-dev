'use client'

import Tab from "@/components/tabs/page"
import { Card } from "@/components/ui/card"
import AddressField from "@/components/admin/address/field/page"
import FieldEntry from "@/components/admin/address/entry/page"

const AddressPage = () => {
  return (
    <div className="space-y-6">
      <h1 className="font-heading text-3xl font-bold">Address Management</h1>
      <Card className="p-4">
        <Tab
          titles={["Entries Fields", "Address Fields"]}
          renderContent={(activeTab) => {
            switch (activeTab) {
              case "Entries Fields":
                return <FieldEntry />
                case "Address Fields":
                  return <AddressField />
                  default:
                return null
            }
          }}
        />
      </Card>
    </div>
  )
}

export default AddressPage
