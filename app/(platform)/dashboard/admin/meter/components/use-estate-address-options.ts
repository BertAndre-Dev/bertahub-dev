"use client";

import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { toast } from "react-toastify";
import { getApiErrorMessage } from "@/lib/api-error";
import { formatAddressEntryLabel } from "@/lib/address";
import type { AppDispatch } from "@/redux/store";
import { getFieldByEstate } from "@/redux/slice/admin/address-mgt/fields/fields";
import { getEntriesByField } from "@/redux/slice/admin/address-mgt/entry/entry";

export type AddressOption = { label: string; value: string };

export function useEstateAddressOptions(estateId: string, enabled: boolean) {
  const dispatch = useDispatch<AppDispatch>();
  const [options, setOptions] = useState<AddressOption[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!enabled || !estateId) return;

    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const fieldRes = await dispatch(getFieldByEstate(estateId)).unwrap();
        const fields = fieldRes?.data || [];
        if (!fields.length) {
          if (!cancelled) setOptions([]);
          return;
        }

        const entryRes = await dispatch(
          getEntriesByField({ fieldId: fields[0].id, page: 1, limit: 500 }),
        ).unwrap();
        const entries = (entryRes?.data || []) as {
          id?: string;
          _id?: string;
          data?: Record<string, string>;
        }[];
        if (cancelled) return;
        setOptions(
          entries
            .map((entry) => {
              const value = entry.id || entry._id || "";
              return {
                label: formatAddressEntryLabel(entry.data) || value,
                value,
              };
            })
            .filter((option) => option.value),
        );
      } catch (err: unknown) {
        if (!cancelled) {
          setOptions([]);
          const message = getApiErrorMessage(err);
          if (message) toast.error(message);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [dispatch, enabled, estateId]);

  return { options, loading };
}
