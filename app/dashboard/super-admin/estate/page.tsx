"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Building2,
  Users,
  Home,
  TrendingUp,
  Plus,
  Edit,
  Power,
  PowerOff,
  Trash2
} from "lucide-react"
import Table from "@/components/tables/list/page"
import {
  getAllEstates,
  createEstate,
  updateEstate,
  activateEstate,
  suspendEstate,
  deleteEstate
} from "@/redux/slice/super-admin/super-admin-est-mgt/super-admin-est-mgt"
import { toast } from "react-toastify"
import { useDispatch, useSelector } from "react-redux"
import { RootState, AppDispatch } from "@/redux/store"
import { useEffect, useState } from "react"
import Modal from "@/components/modal/page"
import EstateForm from "@/components/super-admin/estate-form/page"

interface EstateData {
  id?: string
  name: string
  address: string
  city: string
  state: string
  country: string
  isActive?: boolean
  createdAt?: string | number | Date
}

export default function EstatePage() {
  const dispatch = useDispatch<AppDispatch>()

  const { allEstates, pagination, loading } = useSelector((state: RootState) => {
    const estateState = state.estate as any
    const data = estateState.allEstates?.data || []
    const pagination = estateState.allEstates?.pagination || {}
    return {
      allEstates: Array.isArray(data) ? data : [],
      pagination,
      loading: estateState.loading || false,
    }
  })

  const [open, setOpen] = useState(false)
  const [selectedEstate, setSelectedEstate] = useState<EstateData | null>(null)

  // Fetch estates on mount
  useEffect(() => {
    dispatch(getAllEstates())
      .unwrap()
      .catch(() => {
        toast.error("Failed to fetch estates")
      })
  }, [dispatch])

  const handleEstateModal = (estate?: EstateData) => {
    setSelectedEstate(estate || null)
    setOpen(true)
  }

  const handleCloseModal = () => {
    setOpen(false)
    setSelectedEstate(null)
  }

  const handleSubmitEstate = async (data: EstateData) => {
    try {
      if (selectedEstate?.id) {
        await dispatch(updateEstate({ id: selectedEstate.id, data })).unwrap()
        toast.success("Estate updated successfully!")
      } else {
        await dispatch(createEstate(data)).unwrap()
        toast.success("Estate created successfully!")
      }
      handleCloseModal()
      await dispatch(getAllEstates()).unwrap()
    } catch (err: any) {
      toast.error(err?.message || "Failed to save estate")
    }
  }

  // ✅ Handle Activate / Suspend Estate
  const handleToggleStatus = async (estate: EstateData) => {
    try {
      if (!estate.id) return
      if (estate.isActive) {
        await dispatch(suspendEstate(estate.id)).unwrap()
        toast.info(`${estate.name} has been suspended.`)
      } else {
        await dispatch(activateEstate(estate.id)).unwrap()
        toast.success(`${estate.name} has been activated.`)
      }
      await dispatch(getAllEstates()).unwrap()
    } catch (err: any) {
      toast.error(err?.message || "Failed to update estate status.")
    }
  }

  // ✅ Handle Delete Estate with toast confirmation
  const handleDeleteEstate = async (id?: string, name?: string) => {
    if (!id) return;

    const confirmId = toast.info(
      <div className="flex flex-col gap-2">
        <p className="text-sm">
          Are you sure you want to delete <strong>{name}</strong>?
        </p>
        <div className="flex justify-end gap-2 mt-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => toast.dismiss(confirmId)}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            className="bg-red-600 hover:bg-red-700 text-white"
            onClick={async () => {
              toast.dismiss(confirmId)
              try {
                await dispatch(deleteEstate(id)).unwrap()
                toast.success(`${name} deleted successfully!`)
                await dispatch(getAllEstates()).unwrap()
              } catch (err: any) {
                toast.error(err?.message || "Failed to delete estate.")
              }
            }}
          >
            Delete
          </Button>
        </div>
      </div>,
      {
        position: "top-center",
        autoClose: false,
        closeOnClick: false,
        draggable: false,
        hideProgressBar: true,
        closeButton: false,
      }
    );
  };



  const columns = [
    { key: "name", header: "Estate Name" },
    { key: "address", header: "Address" },
    { key: "city", header: "City" },
    { key: "state", header: "State" },
    { key: "country", header: "Country" },
    {
      key: "isActive",
      header: "Status",
      render: (item: EstateData) => (
        <span
          className={`px-3 py-1 rounded-full text-xs font-semibold ${
            item.isActive
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {item.isActive ? "Active" : "Inactive"}
        </span>
      ),
    },
    {
      key: "createdAt",
      header: "Created At",
      render: (item: EstateData) =>
        new Date(item.createdAt as string | number | Date).toLocaleDateString(
          "en-GB",
          {
            day: "2-digit",
            month: "short",
            year: "numeric",
          }
        ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (item: EstateData) => (
        <div className="flex items-center gap-1">
          {/* Edit Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEstateModal(item)}
            title="Edit Estate"
          >
            <Edit className="w-4 h-4 text-blue-600 " />
          </Button>

          {/* Activate / Suspend Toggle */}
          {item.isActive ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleToggleStatus(item)}
              title="Suspend Estate"
            >
              <PowerOff className="w-4 h-4 text-red-600 " />
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleToggleStatus(item)}
              title="Activate Estate"
            >
              <Power className="w-4 h-4 text-green-600 " />
            </Button>
          )}

          {/* 🗑️ Delete Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDeleteEstate(item.id, item.name)}
            title="Delete Estate"
          >
            <Trash2 className="w-4 h-4 text-red-600 " />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold">Estate Management</h1>
          <p className="text-muted-foreground mt-1">
            Overview of your estate properties, statistics and list
          </p>
        </div>

        <Button onClick={() => handleEstateModal()} className="flex items-center gap-2 cursor-pointer">
          <Plus className="w-4 h-4" />
          Create Estate
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {(() => {
          const estates = allEstates as EstateData[]

          const stats = [
            { label: "Total Estates", value: estates?.length || 0, icon: Building2, color: "bg-blue-500/10" },
            { label: "Active Estates", value: estates?.filter((e) => e.isActive)?.length || 0, icon: Home, color: "bg-green-500/10" },
            { label: "Cities Covered", value: new Set(estates.map((e) => e.city)).size || 0, icon: Users, color: "bg-purple-500/10" },
            { label: "States", value: new Set(estates.map((e) => e.state)).size || 0, icon: TrendingUp, color: "bg-orange-500/10" },
          ]

          return stats.map((stat, i) => {
            const Icon = stat.icon
            return (
              <Card key={i} className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="font-heading text-2xl font-bold mt-2">{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-lg ${stat.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                </div>
              </Card>
            )
          })
        })()}
      </div>

      {/* Estates Table */}
      <Card className="p-4">
        <Table
          columns={columns}
          data={allEstates}
          emptyMessage={loading ? "Loading estates..." : "No estates found"}
          showPagination={true}
          paginationInfo={{
            total: pagination?.total || 0,
            current: pagination?.currentPage || 1,
            pageSize: pagination?.pageSize || 10,
          }}
        />
      </Card>

      {/* Estate Form Modal */}
      {open && (
        <Modal visible={open} onClose={handleCloseModal}>
          <EstateForm initialData={selectedEstate} onSubmit={handleSubmitEstate} />
        </Modal>
      )}
    </div>
  )
}
