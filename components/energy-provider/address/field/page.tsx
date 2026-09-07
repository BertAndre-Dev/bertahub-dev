"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Edit2, Trash2 } from "lucide-react";
import Table from "@/components/tables/list/page";
import {
  createEnergyProviderField,
  deleteEnergyProviderField,
  getEnergyProviderFieldByEstate,
  updateEnergyProviderField,
} from "@/redux/slice/energy-provider/address-mgt/fields/energy-provider-fields";
import { getSignedInUser } from "@/redux/slice/auth-mgt/auth-mgt";
import { extractEstateIdFromUser } from "@/lib/user-id";
import { toast } from "react-toastify";
import DeleteModal from "@/components/resident/delete-modal/page";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "@/redux/store";
import { useEffect, useState } from "react";
import Modal from "@/components/modal/page";
import EnergyProviderFieldForm from "../forms/field-form/page";
import { formatAddressRecordCreatedAt } from "@/lib/address";
import { isBusy, isPending } from "@/lib/async-status";
import type { Pagination } from "@/redux/slice/energy-provider/address-mgt/fields/energy-provider-fields-slice";

interface FieldData {
  estateId: string;
  label: string;
  key: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  id?: string;
}

const DEFAULT_PAGINATION: Pagination = {
  total: 0,
  currentPage: 1,
  totalPages: 1,
  pageSize: 10,
};

export default function EnergyProviderAddressField() {
  const dispatch = useDispatch<AppDispatch>();
  const [estateId, setEstateId] = useState<string | null>(null);
  const [bootstrapping, setBootstrapping] = useState(true);
  const [open, setOpen] = useState(false);
  const [selectedField, setSelectedField] = useState<FieldData | null>(null);
  const [itemToDelete, setItemToDelete] = useState<{ id: string; name?: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const { allField, pagination, listStatus, mutationBusy } = useSelector(
    (state: RootState) => {
      const fieldState = state.energyProviderField;
      return {
        allField: fieldState.allField,
        pagination: fieldState.allField?.pagination ?? DEFAULT_PAGINATION,
        listStatus: fieldState.getFieldByEstateState as string | undefined,
        mutationBusy:
          isBusy(fieldState.createFieldState) ||
          isBusy(fieldState.updateFieldState) ||
          isBusy(fieldState.deleteFieldState),
      };
    },
  );
  const loading =
    bootstrapping ||
    (Boolean(estateId) && isPending(listStatus)) ||
    mutationBusy;

  useEffect(() => {
    (async () => {
      try {
        const userRes = await dispatch(getSignedInUser()).unwrap();
        const data = (userRes?.data ?? userRes) as Record<string, unknown>;
        const foundEstateId = extractEstateIdFromUser(data);

        setEstateId(foundEstateId);

        if (foundEstateId) {
          await dispatch(getEnergyProviderFieldByEstate(foundEstateId)).unwrap();
        } else {
          toast.warning("No estate found for this user.");
        }
      } catch {
        toast.error("Failed to fetch user or estate fields.");
      } finally {
        setBootstrapping(false);
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
      const payload = {
        estateId: data.estateId,
        label: data.label,
        key: data.key,
      };
      if (selectedField?.id) {
        await dispatch(
          updateEnergyProviderField({ fieldId: selectedField.id, data: payload }),
        ).unwrap();
        toast.success("Field updated successfully!");
      } else {
        await dispatch(createEnergyProviderField(payload)).unwrap();
        toast.success("Field created successfully!");
      }

      handleCloseModal();
      if (estateId) {
        await dispatch(getEnergyProviderFieldByEstate(estateId)).unwrap();
      }
    } catch (err: unknown) {
      const error = err as { message?: string };
      toast.error(error?.message || "Failed to save field.");
    }
  };

  const handleDeleteField = async (id?: string, name?: string) => {
    if (!id) return;
    setItemToDelete({ id, name });
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete?.id) return;
    setDeleting(true);
    try {
      await dispatch(deleteEnergyProviderField(itemToDelete.id)).unwrap();
      toast.success(`${itemToDelete.name || "Field"} deleted successfully!`);
      setItemToDelete(null);
      if (estateId) {
        await dispatch(getEnergyProviderFieldByEstate(estateId)).unwrap();
      }
    } catch (err: unknown) {
      const message = (err as { message?: string })?.message;
      toast.error(message ?? "Failed to delete field.");
      throw err;
    } finally {
      setDeleting(false);
    }
  };

  const mappedFields =
    allField?.data?.map((f) => ({
      id: f.id,
      estateId: f.estateId,
      key: f.key,
      label: f.label,
      isActive: f.isActive,
      createdAt: f.createdAt,
      updatedAt: f.updatedAt,
    })) || [];

  const columns = [
    {
      key: "createdAt",
      header: "Created At",
      render: (item: FieldData) => formatAddressRecordCreatedAt(item.createdAt),
    },
    { key: "label", header: "Field Label" },
    {
      key: "isActive",
      header: "Status",
      render: (item: FieldData) => (
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
      key: "actions",
      header: "Actions",
      render: (item: FieldData) => (
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
          onPageChange={() => {
            if (!estateId) return;
            dispatch(getEnergyProviderFieldByEstate(estateId))
              .unwrap()
              .catch(() => toast.error("Failed to change page"));
          }}
          enableExport
          exportFileName="energy-provider-address-fields"
        />
      </Card>

      {open && estateId && (
        <Modal visible={open} onClose={handleCloseModal}>
          <EnergyProviderFieldForm
            estateId={estateId}
            initialData={selectedField}
            onSubmit={handleSubmitField}
          />
        </Modal>
      )}
    
      <DeleteModal
        visible={Boolean(itemToDelete)}
        onClose={() => setItemToDelete(null)}
        itemName={itemToDelete?.name || "this field"}
        title="Delete field"
        loading={deleting}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
