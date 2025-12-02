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
import Select from "react-select"
import {
  getAllUsersByEstate,
  activateUser,
  suspendUser,
  deleteUser,
} from "@/redux/slice/super-admin/super-admin-user/super-admin-user"
import { getAllEstates } from "@/redux/slice/super-admin/super-admin-est-mgt/super-admin-est-mgt"
import { toast } from "react-toastify"
import { useDispatch, useSelector } from "react-redux"
import { RootState, AppDispatch } from "@/redux/store"
import { useEffect, useState } from "react"
import Modal from "@/components/modal/page"
import InviteUserForm from "@/components/super-admin/user-form/page"

interface SuperAdminUserData {
  id?: string
  firstName: string
  lastName: string
  email: string
  countryCode: string
  dateOfBirth: string
  gender: string
  phoneNumber: string
  address: string
  role: string
  image?: string
  isActive?: boolean
  createdAt?: string
  updatedAt?: string
}

interface EstateOption {
  label: string
  value: string
}

export default function SuperAdminUserPage() {
  const dispatch = useDispatch<AppDispatch>()

  const { allSuperAdminUsers, pagination, loading } = useSelector((state: RootState) => {
    const userState = state.superAdminUser as any
    const data = userState.allSuperAdminUsers?.data || []
    const pagination = userState.allSuperAdminUsers?.pagination || {}
    return {
      allSuperAdminUsers: Array.isArray(data) ? data : [],
      pagination,
      loading: userState.getAllUsersByEstateState === "isLoading",
    }
  })


  const { allEstates} = useSelector((state: RootState) => {
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
  const [selectedEstate, setSelectedEstate] = useState<EstateOption | null>(null)
  const [selectedUser, setSelectedUser] = useState<SuperAdminUserData | null>(null)

  // ✅ Fetch all estates on mount
  useEffect(() => {
   dispatch(getAllEstates({ page: 1, limit: Number(pagination?.pageSize) || 10 }))
      .unwrap()
      .catch(() => toast.error("Failed to fetch estates"))
  }, [dispatch])

  // ✅ Fetch users for the selected estate
  useEffect(() => {
    if (selectedEstate?.value) {
      dispatch(
        getAllUsersByEstate({
          estateId: selectedEstate.value,
          page: 1,
          limit: Number(pagination?.pageSize) || 10,
        })
      )
        .unwrap()
        .catch(() => toast.error("Failed to fetch users for selected estate"));
    }
  }, [selectedEstate, dispatch]);


  const handleEstateModal = (user?: SuperAdminUserData) => {
    setSelectedUser(user || null)
    setOpen(true)
  }

  const handleCloseModal = () => {
    setOpen(false)
    setSelectedUser(null)
  }

  const handleToggleStatus = async (user: SuperAdminUserData) => {
    try {
      if (!user.id) return
      if (user.isActive) {
        await dispatch(suspendUser(user.id)).unwrap()
        toast.info(`${user.firstName} has been suspended.`)
      } else {
        await dispatch(activateUser(user.id)).unwrap()
        toast.success(`${user.firstName} has been activated.`)
      }

      if (selectedEstate?.value) await dispatch(
        getAllUsersByEstate({
          estateId: selectedEstate.value,
          page: 1,
          limit: Number(pagination?.pageSize) || 10,
        })
      ).unwrap()
    } catch (err: any) {
      toast.error(err?.message || "Failed to update user status.")
    }
  }

  const handleDeleteUser = async (id?: string, name?: string) => {
    if (!id) return

    const confirmId = toast.info(
      <div className="flex flex-col gap-2">
        <p className="text-sm">Are you sure you want to delete <strong>{name}</strong>?</p>
        <div className="flex justify-end gap-2 mt-2">
          <Button size="sm" variant="outline" onClick={() => toast.dismiss(confirmId)}>Cancel</Button>
          <Button
            size="sm"
            className="bg-red-600 hover:bg-red-700 text-white"
            onClick={async () => {
              toast.dismiss(confirmId)
              try {
                await dispatch(deleteUser(id)).unwrap()
                toast.success(`${name} deleted successfully!`)
                if (selectedEstate?.value) await dispatch(
        getAllUsersByEstate({
          estateId: selectedEstate.value,
          page: 1,
          limit: Number(pagination?.pageSize) || 10,
        })
      ).unwrap()
              } catch (err: any) {
                toast.error(err?.message || "Failed to delete user.")
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
    )
  }

  // ✅ Map estates for dropdown
  const estateOptions: EstateOption[] =
    allEstates?.map((e: any) => ({
      label: e.name,
      value: e.id,
    })) || []

  const columns = [
    { key: "firstName", header: "First Name" },
    { key: "lastName", header: "Last Name" },
    { key: "email", header: "Email" },
    { key: "role", header: "Role" },
    {
      key: "isActive",
      header: "Status",
      render: (item: SuperAdminUserData) => (
        <span
          className={`px-3 py-1 rounded-full text-xs font-semibold ${
            item.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
          }`}
        >
          {item.isActive ? "Active" : "Inactive"}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (item: SuperAdminUserData) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={() => handleEstateModal(item)}>
            <Edit className="w-4 h-4 text-blue-600" />
          </Button>
          {item.isActive ? (
            <Button variant="ghost" size="sm" onClick={() => handleToggleStatus(item)}>
              <PowerOff className="w-4 h-4 text-red-600" />
            </Button>
          ) : (
            <Button variant="ghost" size="sm" onClick={() => handleToggleStatus(item)}>
              <Power className="w-4 h-4 text-green-600" />
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={() => handleDeleteUser(item.id, item.firstName)}>
            <Trash2 className="w-4 h-4 text-red-600" />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-heading text-3xl font-bold">User Management</h1>
          <p className="text-muted-foreground mt-1">View users by estate</p>
        </div>

        <div className="flex items-center gap-4">
            {/* ✅ Estate Dropdown */}
            <div className="w-64">
            <Select
                options={estateOptions}
                placeholder="Select an estate..."
                value={selectedEstate}
                onChange={(option) => setSelectedEstate(option)}
                isSearchable
            />
            </div>

            <Button onClick={() => handleEstateModal()} className="flex items-center gap-2 cursor-pointer">
                <Plus className="w-4 h-4" />
                Invite User
            </Button>
        </div>
      </div>

      {/* Users Table */}
      <Card className="p-4">
        <Table
          columns={columns}
          data={allSuperAdminUsers}
          emptyMessage={loading ? "Loading users..." : "No users found for this estate"}
          showPagination={true}
          paginationInfo={{
            total: pagination?.total || 0,
            current: Number(pagination?.currentPage) || 1,
            pageSize: Number(pagination?.pageSize) || 10,
          }}
          onPageChange={(page) => {
            if (!selectedEstate?.value) return; // ✅ Prevent null access

            dispatch(
              getAllUsersByEstate({
                estateId: selectedEstate.value,
                page,
                limit: Number(pagination?.pageSize) || 10,
              })
            )
              .unwrap()
              .catch(() => toast.error("Failed to change page"));
          }}
        />
      </Card>

      {/* User Edit Modal */}
      {open && (
        <Modal visible={open} onClose={handleCloseModal}>
          <InviteUserForm  close={handleCloseModal}/>
        </Modal>
      )}
    </div>
  )
}
