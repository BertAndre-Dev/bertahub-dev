"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Edit2, Trash2, MapPin, MapPinHouse } from "lucide-react";
import Table from "@/components/tables/list/page";
import { getFieldByEstate } from "@/redux/slice/admin/address-mgt/fields/fields";
import {
  deleteEntry,
  getEntriesByField,
  getEntryStats,
} from "@/redux/slice/admin/address-mgt/entry/entry";
import { getSignedInUser } from "@/redux/slice/auth-mgt/auth-mgt";
import { toast } from "react-toastify";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/redux/store";
import { useEffect, useState } from "react";
import Modal from "@/components/modal/page";
import EntryForm from "../forms/entry-form/page";
import { confirmDeleteToast } from "@/lib/confirm-delete-toast";

interface EntryData {
  estateId: string;
  fieldId: string;
  data: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
  id?: string;
}

export default function EntryPage() {
  const dispatch = useDispatch<AppDispatch>();
  const [user, setUser] = useState<any>(null);
  const [estateId, setEstateId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<EntryData | null>(null);
  const [entries, setEntries] = useState<EntryData[]>([]);
  const [fields, setFields] = useState<any[]>([]);
  const [stats, setStats] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState<any>({});

  // ✅ Fetch all data
  const fetchAllData = async () => {
    try {
      setLoading(true);

      const userRes = await dispatch(getSignedInUser()).unwrap();
      const data = userRes?.data ?? (userRes as Record<string, unknown>);
      setUser(data);

      const rawEstateId = data?.estateId as
        | string
        | { id?: string; _id?: string }
        | undefined;
      const estateId =
        typeof rawEstateId === "string"
          ? rawEstateId
          : rawEstateId?._id || rawEstateId?.id || "";

      if (!estateId) {
        toast.warning("No estate found for this user.");
        setLoading(false);
        return;
      }

      setEstateId(estateId);
      const fieldsRes = await dispatch(getFieldByEstate(estateId)).unwrap();
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

      const entryRes = await dispatch(
        getEntriesByField({ fieldId, page: 1, limit: 10 }),
      ).unwrap();

      setEntries(entryRes?.data || []);
      setPagination(entryRes?.pagination || {});

      const allEntries = (entryRes?.data || []).map((e: any) => ({
        id: e.id,
        estateId: e.estateId,
        fieldId: e.fieldId,
        data: e.data,
        createdAt: e.createdAt,
        updatedAt: e.updatedAt,
      }));

      setEntries(allEntries);

      const statsRes = await dispatch(getEntryStats(fieldId)).unwrap();
      setStats({ [fieldId]: statsRes?.data || {} });
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch entries or stats.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, [dispatch]);

  const handleOpenModal = (entry?: EntryData) => {
    setSelectedEntry(entry || null);
    setOpen(true);
  };

  const handleCloseModal = () => {
    setOpen(false);
    setSelectedEntry(null);
  };

  // ✅ Delete function
  const handleDeleteEntry = async (entryId?: string, label?: string) => {
    if (!entryId) {
      toast.error("Missing entry ID");
      return;
    }

    confirmDeleteToast({
      name: label || "this entry",
      onConfirm: async () => {
        await dispatch(deleteEntry(entryId)).unwrap();
        toast.success(`${label || "Entry"} deleted successfully!`);
        await fetchAllData();
      },
    });
  };

  // ✅ Build dynamic table
  const mappedEntries =
    entries.map((entry) => {
      const row: Record<string, any> = {
        id: entry.id,
        estateId: entry.estateId,
        fieldId: entry.fieldId,
      };

      fields.forEach((field) => {
        row[field.key] = entry.data?.[field.key] || "—";
      });

      row["createdAt"] = entry.createdAt;
      row["updatedAt"] = entry.updatedAt;
      return row;
    }) || [];

  const dynamicColumns =
    fields.map((field) => ({
      key: field.key,
      header: field.label,
    })) || [];

  const columns = [
    ...dynamicColumns,
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
            onClick={() =>
              handleDeleteEntry(item.id, item.data?.name || "entry")
            }
          >
            <Trash2 className="w-4 h-4 text-red-600" />
          </Button>
        </div>
      ),
    },
  ];

  //     {(() => {
  //       // const address = allAddress as AddressData[];

  //       const stats = [
  //         {
  //           label: "Total Estates",
  //           // value: address?.length || 0,
  //           value: "200",
  //           icon: Building2,
  //           color: "bg-[#D0DFF280]",
  //         },
  //         {
  //           label: "Active Estates",
  //           // value: address?.filter((e) => e.isActive)?.length || 0,
  //           value: "200",
  //           icon: Home,
  //           color: "bg-[#CCE4DB80]",
  //         },
  //         {
  //           label: "Cities Covered",
  //           // value: new Set(address.map((e) => e.city)).size || 0,
  //           value: "200",
  //           icon: Users,
  //           color: "bg-[#FEE6D480]",
  //         },
  //         {
  //           label: "States",
  //           // value: new Set(address.map((e) => e.state)).size || 0,
  //           value: "200",
  //           icon: TrendingUp,
  //           color: "bg-[#CABDFF80]",
  //         },
  //       ];

  //       return stats.map((stat, i) => {
  //         const Icon = stat.icon;
  //         return (
  //           <Card key={i} className="p-6">
  //             <div className="flex items-start justify-between">
  //               <div>
  //                 <p className="text-sm text-muted-foreground">
  //                   {stat.label}
  //                 </p>
  //                 <p className="font-heading text-2xl font-bold mt-2">
  //                   {stat.value}
  //                 </p>
  //               </div>
  //               <div className={`p-3 rounded-lg ${stat.color}`}>
  //                 <Icon className="w-6 h-6" />
  //               </div>
  //             </div>
  //           </Card>
  //         );
  //       });
  //     })()}
  //   </div>

  // ✅ Stats Card Section
  const renderStats = () => {
    if (!fields.length || !stats) return null;

    const fieldId = fields[0]?.id || fields[0]?._id;
    const fieldStats = stats[fieldId]?.counts || {};
    const totalEntries = stats[fieldId]?.totalEntries || 0;

    if (!Object.keys(fieldStats).length && !totalEntries) return null;

    const statItems = [
      {
        label: "Total Entries",
        value: totalEntries,
        icon: MapPin,
        color: "#D0DFF280",
      },

      ...Object.entries(fieldStats).map(([key, value]) => {
        let color = "#FEE6D480";
        let Icon = MapPinHouse;

        switch (key.toLowerCase()) {
          case "Block":
            color = "#cce4db80";
            break;
          case "Unit":
            color = "#CABDFF80";
            break;
          case "Flat":
            color = "bg-orange-500/10";
            break;
        }

        return { label: key, value, icon: Icon, color };
      }),
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
                <div className={`p-3 rounded-lg ${stat.color}`}>
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
      {/* Header */}
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

      {/* Stats Section */}
      {renderStats()}

      {/* Entries Table */}
      <Card className="p-4">
        <Table
          columns={columns}
          data={mappedEntries}
          emptyMessage={loading ? "Loading entries..." : "No entries found."}
          showPagination
          paginationInfo={{
            total: pagination.total ?? 0,
            current: pagination.currentPage ?? 1,
            pageSize: pagination.pageSize ?? 10,
          }}
          onPageChange={(page) => {
            const fieldId = fields[0]?.id || fields[0]?._id;
            if (!fieldId) return;

            dispatch(
              getEntriesByField({
                fieldId,
                page,
                limit: pagination.pageSize ?? 10,
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
          exportFileName="address-entries"
          onExportRequest={
            fields[0]
              ? async () => {
                  const fieldId = fields[0]?.id || fields[0]?._id;
                  if (!fieldId) return [];
                  const res = await dispatch(
                    getEntriesByField({ fieldId, page: 1, limit: 50000 }),
                  ).unwrap();
                  return res?.data ?? [];
                }
              : undefined
          }
        />
      </Card>

      {/* Modal */}
      {open && estateId && (
        <Modal visible={open} onClose={handleCloseModal}>
          <EntryForm
            estateId={estateId}
            fieldId={selectedEntry?.fieldId || fields[0]?.id}
            fields={fields}
            initialData={selectedEntry}
            onClose={handleCloseModal}
            refresh={fetchAllData}
          />
        </Modal>
      )}
    </div>
  );
}
