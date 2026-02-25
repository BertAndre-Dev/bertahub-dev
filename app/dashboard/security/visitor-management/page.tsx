import React from 'react'
import VerifyVisitor from '@/app/dashboard/security/verify-visitor/page'
import ViewVisitor from '@/app/dashboard/security/view-visitor/page'
import { Card } from '@/components/ui/card'
import { IdCard } from 'lucide-react'
import ResidentDetails from '@/components/security/resident-detail'
const page = () => {
  return (
    <div>

        {/* Stats Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {(() => {
          const stats = [
            {
              label: "Total Verifications",
              value: 0,
              icon: IdCard ,
              color: "bg-[#D0DFF280]",
            },  {
              label: "Denied Access",
              value: 0,
              icon: IdCard ,
              color: "bg-[#D0DFF280]",
            },
          ];

          return stats.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <Card key={i} className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {stat.label}
                    </p>
                    <p className="font-heading text-2xl font-bold mt-2">
                      {stat.value}
                    </p>
                  </div>
                  <div className={`p-3 rounded-lg ${stat.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                </div>
              </Card>
            );
          });
        })()}
      </div>

      <ViewVisitor />
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
<VerifyVisitor />
        <ResidentDetails />
        
      </div>
        
    </div>
  )
}

export default page