"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Edit2, Trash2 } from "lucide-react";
import Table from "@/components/tables/list/page";
import {
  createField,
  deleteField,
  getFieldByEstate,
  updateField,
} from "@/redux/slice/admin/address-mgt/fields/fields";
import { getSignedInUser } from "@/redux/slice/auth-mgt/auth-mgt";
import { toast } from "react-toastify";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "@/redux/store";
import { useEffect, useState } from "react";
import Modal from "@/components/modal/page";
import FieldForm from "../forms/field-form/page";
import { confirmDeleteToast } from "@/lib/confirm-delete-toast";

interface FieldData {
  estateId: string;
  label: string;
  key: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  id?: string;
}

export default function AddressField() {
  const dispatch = useDispatch<AppDispatch>();
  const [user, setUser] = useState<any>(null);
  const [estateId, setEstateId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [selectedField, setSelectedField] = useState<FieldData | null>(null);

  // ✅ Get Redux state
  const { allField, pagination, loading } = useSelector((state: RootState) => {
    const fieldState = state.adminField as any;
    return {
      allField: fieldState.allField,
      pagination: fieldState.allField?.pagination || {},
      loading:
        fieldState.getFieldByEstateState === "isLoading" ||
        fieldState.createFieldState === "isLoading" ||
        fieldState.updateFieldState === "isLoading" ||
        fieldState.deleteFieldState === "isLoading",
    };
  });

  // ✅ Fetch user & fields
  useEffect(() => {
    (async () => {
      try {
        const userRes = await dispatch(getSignedInUser()).unwrap();
        const data = userRes?.data ?? (userRes as Record<string, unknown>);
        setUser(data);

        const rawEstateId = data?.estateId as
          | string
          | { id?: string; _id?: string }
          | undefined;
        const foundEstateId =
          typeof rawEstateId === "string"
            ? rawEstateId
            : rawEstateId?._id || rawEstateId?.id || "";

        setEstateId(foundEstateId || null);

        if (foundEstateId) {
          await dispatch(getFieldByEstate(foundEstateId)).unwrap();
        } else {
          toast.warning("No estate found for this user.");
        }
      } catch {
        toast.error("Failed to fetch user or estate fields.");
      }
    })();
  }, [dispatch]);

  const handleOpenModal = (field?: FieldData) => {
    setSelectedField(field || null);
    setOpen(true);
  };

  const handleCloseModal = () => {
    setOpen(false);
    setSelectedField(null);
  };

  const handleSubmitField = async (data: FieldData) => {
    try {
      if (selectedField?.id) {
        await dispatch(
          updateField({ fieldId: selectedField.id, data }),
        ).unwrap();
        toast.success("Field updated successfully!");
      } else {
        await dispatch(createField(data)).unwrap();
        toast.success("Field created successfully!");
      }

      handleCloseModal();
      if (estateId) {
        await dispatch(getFieldByEstate(estateId)).unwrap();
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to save field.");
    }
  };

  const handleDeleteField = async (id?: string, name?: string) => {
    if (!id) return;

    confirmDeleteToast({
      name: name || "this field",
      onConfirm: async () => {
        await dispatch(deleteField(id)).unwrap();
        toast.success(`${name || "Field"} deleted successfully!`);
        if (user?.estateId) {
          await dispatch(getFieldByEstate(user.estateId)).unwrap();
        }
      },
    });
  };

  // ✅ Use data directly from state
  const mappedFields =
    allField?.data?.map((f: any) => ({
      id: f.id,
      estateId: f.estateId,
      key: f.key,
      label: f.label,
      isActive: f.isActive,
      createdAt: f.createdAt,
      updatedAt: f.updatedAt,
    })) || [];

  const columns = [
    { key: "label", header: "Field Label" },
    {
      key: "isActive",
      header: "Status",
      render: (item: any) => (
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
      render: (item: any) =>
        item.createdAt
          ? new Date(item.createdAt).toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })
          : "—",
    },
    {
      key: "actions",
      header: "Actions",
      render: (item: any) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleOpenModal(item)}
          >
            <Edit2 className="w-4 h-4 text-blue-600" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDeleteField(item.id, item.label)}
          >
            <Trash2 className="w-4 h-4 text-red-600" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
        <h1 className="font-heading text-3xl font-bold">
          Address Field Entries
        </h1>
        <p>Manage and view entries for all estate fields</p>

        </div>
        <Button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Create Field
        </Button>
      </div>

      <Card className="p-4">
        <Table
          columns={columns}
          data={mappedFields}
          emptyMessage={loading ? "Loading fields..." : "No fields found."}
          showPagination
          paginationInfo={{
            total: pagination?.total || 0,
            current: Number(pagination?.currentPage) || 1,
            pageSize: Number(pagination?.pageSize) || 10,
          }}
          onPageChange={(page) => {
            if (!estateId) return;
            dispatch(getFieldByEstate(estateId))
              .unwrap()
              .catch(() => toast.error("Failed to change page"));
          }}
          enableExport
          exportFileName="address-fields"
        />
      </Card>

      {open && estateId && (
        <Modal visible={open} onClose={handleCloseModal}>
          <FieldForm
            estateId={estateId}
            initialData={selectedField}
            onSubmit={handleSubmitField}
          />
        </Modal>
      )}
    </div>
  );
}
