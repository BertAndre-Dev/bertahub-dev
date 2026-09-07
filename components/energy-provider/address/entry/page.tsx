"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Edit2, Trash2, MapPin, MapPinHouse } from "lucide-react";
import Table from "@/components/tables/list/page";
import { getEnergyProviderFieldByEstate } from "@/redux/slice/energy-provider/address-mgt/fields/energy-provider-fields";
import {
  deleteEnergyProviderEntry,
  getEnergyProviderEntriesByField,
  getEnergyProviderEntryStats,
} from "@/redux/slice/energy-provider/address-mgt/entry/energy-provider-entry";
import { getSignedInUser } from "@/redux/slice/auth-mgt/auth-mgt";
import { extractEstateIdFromUser } from "@/lib/user-id";
import { toast } from "react-toastify";
import DeleteModal from "@/components/resident/delete-modal/page";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/redux/store";
import { useEffect, useState } from "react";
import Modal from "@/components/modal/page";
import EnergyProviderEntryForm from "../forms/entry-form/page";
import { formatAddressRecordCreatedAt } from "@/lib/address";

interface EntryData {
  estateId: string;
  fieldId: string;
  data: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
  id?: string;
}

type EntryTableRow = EntryData & Record<string, unknown>;

interface FieldDefinition {
  id?: string;
  _id?: string;
  key: string;
  label: string;
}

export default function EnergyProviderFieldEntry() {
  const dispatch = useDispatch<AppDispatch>();
  const [estateId, setEstateId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<EntryData | null>(null);
  const [itemToDelete, setItemToDelete] = useState<{ id: string; name?: string } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [entries, setEntries] = useState<EntryData[]>([]);
  const [fields, setFields] = useState<FieldDefinition[]>([]);
  const [stats, setStats] = useState<Record<string, Record<string, unknown>>>({});
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState<Record<string, number>>({});
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const fetchAllData = async () => {
    try {
      setLoading(true);

      const userRes = await dispatch(getSignedInUser()).unwrap();
      const data = (userRes?.data ?? userRes) as Record<string, unknown>;
      const resolvedEstateId = extractEstateIdFromUser(data);

      if (!resolvedEstateId) {
        toast.warning("No estate found for this user.");
        setLoading(false);
        return;
      }

      setEstateId(resolvedEstateId);
      const fieldsRes = await dispatch(
        getEnergyProviderFieldByEstate(resolvedEstateId),
      ).unwrap();
      const estateFields = fieldsRes?.data || [];
      setFields(estateFields);

      if (!estateFields.length) {
        toast.info("No fields found for this estate.");
        setEntries([]);
        setStats({});
        setLoading(false);
        return;
      }

      const fieldId = estateFields[0]?.id || estateFields[0]?._id;
      if (!fieldId) {
        toast.error("No valid fieldId found.");
        setLoading(false);
        return;
      }

      const shouldApplyDate = Boolean(startDate && endDate);
      const entryRes = await dispatch(
        getEnergyProviderEntriesByField({
          fieldId,
          page: 1,
          limit: 10,
          startDate: shouldApplyDate ? startDate : undefined,
          endDate: shouldApplyDate ? endDate : undefined,
        }),
      ).unwrap();

      setEntries(entryRes?.data || []);
      setPagination(entryRes?.pagination || {});

      const statsRes = await dispatch(getEnergyProviderEntryStats(fieldId)).unwrap();
      setStats({ [fieldId]: statsRes?.data || {} });
    } catch {
      toast.error("Failed to fetch entries or stats.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, [dispatch]);

  useEffect(() => {
    const fieldId = fields[0]?.id || fields[0]?._id;
    if (!fieldId) return;
    const shouldApplyDate = Boolean(startDate && endDate);

    setLoading(true);
    dispatch(
      getEnergyProviderEntriesByField({
        fieldId,
        page: 1,
        limit: Number(pagination.pageSize) || 10,
        startDate: shouldApplyDate ? startDate : undefined,
        endDate: shouldApplyDate ? endDate : undefined,
      }),
    )
      .unwrap()
      .then((res) => {
        setEntries(res?.data || []);
        setPagination(res?.pagination || {});
      })
      .catch(() => toast.error("Failed to fetch entries."))
      .finally(() => setLoading(false));
  }, [dispatch, startDate, endDate, fields]);

  const handleOpenModal = (entry?: EntryData) => {
    setSelectedEntry(entry || null);
    setOpen(true);
  };

  const handleCloseModal = () => {
    setOpen(false);
    setSelectedEntry(null);
  };

  const handleDeleteEntry = async (entryId?: string, label?: string) => {
    if (!entryId) {
      toast.error("Missing entry ID");
      return;
    }
    setItemToDelete({ id: entryId, name: label });
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete?.id) return;
    setDeleting(true);
    try {
      await dispatch(deleteEnergyProviderEntry(itemToDelete.id)).unwrap();
      toast.success(`${itemToDelete.name || "Entry"} deleted successfully!`);
      setItemToDelete(null);
      await fetchAllData();
    } catch (err: unknown) {
      const message = (err as { message?: string })?.message;
      toast.error(message ?? "Failed to delete entry.");
      throw err;
    } finally {
      setDeleting(false);
    }
  };

  const mappedEntries: EntryTableRow[] = entries.map((entry) => {
    const row: EntryTableRow = {
      id: entry.id,
      estateId: entry.estateId,
      fieldId: entry.fieldId,
      data: entry.data,
    };

    fields.forEach((field) => {
      row[field.key] = entry.data?.[field.key] || "—";
    });

    row.createdAt = entry.createdAt;
    row.updatedAt = entry.updatedAt;
    return row;
  });

  const dynamicColumns =
    fields.map((field) => ({
      key: field.key,
      header: field.label,
    })) || [];

  const columns = [
    {
      key: "createdAt",
      header: "Created At",
      render: (item: EntryTableRow) =>
        formatAddressRecordCreatedAt(item.createdAt),
    },
    ...dynamicColumns,
    {
      key: "actions",
      header: "Actions",
      render: (item: EntryTableRow) => (
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
            onClick={() =>
              handleDeleteEntry(
                item.id,
                String(item.data?.name ?? "entry"),
              )
            }
          >
            <Trash2 className="w-4 h-4 text-red-600" />
          </Button>
        </div>
      ),
    },
  ];

  const renderStats = () => {
    if (!fields.length || !stats) return null;

    const fieldId = fields[0]?.id || fields[0]?._id;
    const fieldStats =
      (stats[fieldId ?? ""]?.counts as Record<string, number>) || {};
    const totalEntries = Number(stats[fieldId ?? ""]?.totalEntries ?? 0);

    if (!Object.keys(fieldStats).length && !totalEntries) return null;

    const statItems = [
      {
        label: "Total Entries",
        value: totalEntries,
        icon: MapPin,
        color: "#D0DFF280",
      },
      ...Object.entries(fieldStats).map(([key, value]) => ({
        label: key,
        value,
        icon: MapPinHouse,
        color: "#FEE6D480",
      })),
    ];

    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {statItems.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <Card key={i} className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground capitalize">
                    {stat.label}
                  </p>
                  <p className="font-heading text-2xl font-bold mt-2">
                    {String(stat.value)}
                  </p>
                </div>
                <div className="p-3 rounded-lg" style={{ background: stat.color }}>
                  <Icon className="w-6 h-6" />
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-bold">
            Estate Field Entries
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage and view entries for all estate fields
          </p>
        </div>

        <Button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Create Entry
        </Button>
      </div>

      {renderStats()}

      <Card className="p-4">
        <Table<EntryTableRow>
          columns={columns}
          data={mappedEntries}
          emptyMessage={loading ? "Loading entries..." : "No entries found."}
          enableDateRangeFilter
          defaultDateRangeDays={0}
          startDate={startDate}
          endDate={endDate}
          onDateRangeChange={({ startDate: nextStart, endDate: nextEnd }) => {
            setStartDate(nextStart);
            setEndDate(nextEnd);
          }}
          showPagination
          paginationInfo={{
            total: pagination.total ?? 0,
            current: pagination.currentPage ?? 1,
            pageSize: pagination.pageSize ?? 10,
          }}
          onPageChange={(page) => {
            const fieldId = fields[0]?.id || fields[0]?._id;
            if (!fieldId) return;
            const shouldApplyDate = Boolean(startDate && endDate);

            dispatch(
              getEnergyProviderEntriesByField({
                fieldId,
                page,
                limit: pagination.pageSize ?? 10,
                startDate: shouldApplyDate ? startDate : undefined,
                endDate: shouldApplyDate ? endDate : undefined,
              }),
            )
              .unwrap()
              .then((res) => {
                setEntries(res?.data || []);
                setPagination(res?.pagination || {});
              })
              .catch(() => toast.error("Failed to change page"));
          }}
          enableExport
          exportFileName="energy-provider-address-entries"
          onExportRequest={
            fields[0]
              ? async () => {
                  const fieldId = fields[0]?.id || fields[0]?._id;
                  if (!fieldId) return [];
                  const shouldApplyDate = Boolean(startDate && endDate);
                  const res = await dispatch(
                    getEnergyProviderEntriesByField({
                      fieldId,
                      page: 1,
                      limit: 50000,
                      startDate: shouldApplyDate ? startDate : undefined,
                      endDate: shouldApplyDate ? endDate : undefined,
                    }),
                  ).unwrap();
                  return res?.data ?? [];
                }
              : undefined
          }
        />
      </Card>

      {open && estateId && (
        <Modal visible={open} onClose={handleCloseModal}>
          <EnergyProviderEntryForm
            estateId={estateId}
            fieldId={selectedEntry?.fieldId || fields[0]?.id || fields[0]?._id || ""}
            fields={fields.map((field) => ({
              id: field.id || field._id || "",
              key: field.key,
              label: field.label,
            }))}
            initialData={selectedEntry}
            onClose={handleCloseModal}
            refresh={fetchAllData}
          />
        </Modal>
      )}
    
      <DeleteModal
        visible={Boolean(itemToDelete)}
        onClose={() => setItemToDelete(null)}
        itemName={itemToDelete?.name || "this entry"}
        title="Delete entry"
        loading={deleting}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
