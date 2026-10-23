"use client";

import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { toast } from "react-toastify";
import RequestManagementView from "@/components/request-mgt/RequestManagementView";
import { getApiErrorMessage } from "@/lib/api-error";
import {
  extractEstateIdFromUser,
  extractEstateNameFromUser,
} from "@/lib/user-id";
import { getSignedInUser } from "@/redux/slice/auth-mgt/auth-mgt";
import type { AppDispatch } from "@/redux/store";

export default function EstateAdminRequestPage() {
  const dispatch = useDispatch<AppDispatch>();
  const [estateId, setEstateId] = useState<string | null>(null);
  const [estateName, setEstateName] = useState("Estate");
  const [bootstrapping, setBootstrapping] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const userRes = await dispatch(getSignedInUser()).unwrap();
        const data = (userRes?.data ?? userRes) as Record<string, unknown>;
        const eId = extractEstateIdFromUser(data);
        const name = extractEstateNameFromUser(data) ?? "Estate";
        setEstateId(eId);
        setEstateName(name);
        if (!eId) {
          toast.error("Unable to resolve your estate. Please sign in again.");
        }
      } catch (err: unknown) {
        const message = getApiErrorMessage(err);
        if (message) toast.error(message);
      } finally {
        setBootstrapping(false);
      }
    })();
  }, [dispatch]);

  return (
    <RequestManagementView
      scope="estateAdmin"
      description={
        <span>
          Review, approve, or reject requests for{" "}
          <span className="font-bold uppercase underline text-foreground">
            {estateName}
          </span>
          .
        </span>
      }
      estateId={estateId}
      bootstrapping={bootstrapping}
      emptyHint="No requests found."
    />
  );
}
