// "use client";

// import { useState, useEffect } from "react";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Button } from "@/components/ui/button";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { toast } from "react-toastify";
// import { getSignedInUser } from "@/redux/slice/auth-mgt/auth-mgt";
// import { getOwnerAddressesByEstate } from "@/redux/slice/resident/address-options/resident-address-options";
// import { inviteTenant } from "@/redux/slice/resident/invite-tenant/invite-tenant";
// import type { AppDispatch, RootState } from "@/redux/store";
// import { useDispatch, useSelector } from "react-redux";

// type InviteTenantFormProps = {
//   readonly close: () => void;
// };

// interface FormData {
//   estateId: string;
//   firstName: string;
//   lastName: string;
//   email: string;
//   addressIds: string[];
// }

// export default function InviteTenantForm({ close }: InviteTenantFormProps) {
//   const dispatch = useDispatch<AppDispatch>();
//   const [formData, setFormData] = useState<FormData>({
//     estateId: "",
//     firstName: "",
//     lastName: "",
//     email: "",
//     addressIds: [],
//   });
//   const [submitLoading, setSubmitLoading] = useState(false);

//   const { ownerAddresses, ownerAddressesStatus } = useSelector((state: RootState) => {
//     const s = (state as {
//       residentAddressOptions?: {
//         ownerAddresses: Array<{ id: string; data?: Record<string, string> }>;
//         ownerAddressesStatus: string;
//         error: string | null;
//       };
//     }).residentAddressOptions;
//     return {
//       ownerAddresses: s?.ownerAddresses ?? [],
//       ownerAddressesStatus: s?.ownerAddressesStatus ?? "idle",
//     };
//   });

//   const entryOptions = (() => {
//     if (!ownerAddresses.length) return [];
//     return ownerAddresses.map((item) => {
//       const d = item.data ?? {};
//       const label = Object.entries(d)
//         .map(([k, v]) => `${k}: ${v}`)
//         .join(", ");
//       return { label: label || item.id || "", value: item.id };
//     });
//   })();

//   const loading = ownerAddressesStatus === "isLoading";

//   useEffect(() => {
//     const load = async () => {
//       try {
//         const userRes = await dispatch(getSignedInUser()).unwrap();
//         const rawEstate = userRes?.data?.estateId ?? userRes?.data?.estate;

//         let estateId = "";
//         if (typeof rawEstate === "string") {
//           estateId = rawEstate;
//         } else if (rawEstate && typeof rawEstate === "object") {
//           estateId = (rawEstate as { id?: string }).id ?? "";
//         }

//         if (!estateId) {
//           toast.error("No estate linked to your account.");
//           return;
//         }
//         setFormData((prev) => ({ ...prev, estateId }));

//         await dispatch(
//           getOwnerAddressesByEstate({ estateId, page: 1, limit: 200 }),
//         ).unwrap();
//       } catch {
//         toast.error("Failed to load address options.");
//       }
//     };
//     load();
//   }, [dispatch]);

//   const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
//     setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
//   };

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!formData.estateId) return toast.error("Estate not loaded.");
//     if (!formData.firstName?.trim()) return toast.error("Please enter first name.");
//     if (!formData.lastName?.trim()) return toast.error("Please enter last name.");
//     if (!formData.email?.trim()) return toast.error("Please enter email.");
//     if (!formData.addressIds?.length) return toast.error("Please select at least one address.");

//     setSubmitLoading(true);
//     try {
//       const res = await dispatch(
//         inviteTenant({
//           estateId: formData.estateId,
//           firstName: formData.firstName.trim(),
//           lastName: formData.lastName.trim(),
//           email: formData.email.trim(),
//           addressIds: formData.addressIds,
//         })
//       ).unwrap();
//       toast.success((res as { message?: string })?.message ?? "Tenant invited successfully.");
//       close();
//     } catch (err: unknown) {
//       const message = (err as { message?: string })?.message ?? "Failed to invite tenant.";
//       toast.error(message);
//     } finally {
//       setSubmitLoading(false);
//     }
//   };

//   return (
//     <Card className="max-w-lg mx-auto">
//       <CardHeader>
//         <CardTitle className="text-lg font-semibold">Invite Tenant</CardTitle>
//       </CardHeader>
//       <CardContent>
//         <form onSubmit={handleSubmit} className="space-y-4">
//           <div>
//             <Label htmlFor="firstName">First Name</Label>
//             <Input
//               id="firstName"
//               name="firstName"
//               type="text"
//               value={formData.firstName}
//               onChange={handleInput}
//               placeholder="Enter first name"
//               required
//               className="mt-1"
//             />
//           </div>
//           <div>
//             <Label htmlFor="lastName">Last Name</Label>
//             <Input
//               id="lastName"
//               name="lastName"
//               type="text"
//               value={formData.lastName}
//               onChange={handleInput}
//               placeholder="Enter last name"
//               required
//               className="mt-1"
//             />
//           </div>
//           <div>
//             <Label htmlFor="email">Email</Label>
//             <Input
//               id="email"
//               name="email"
//               type="email"
//               value={formData.email}
//               onChange={handleInput}
//               placeholder="Enter email"
//               required
//               className="mt-1"
//             />
//           </div>

//           <div className="space-y-2">
//             <div className="flex items-center justify-between">
//               <Label>Address(es) – select unit(s) for this tenant</Label>
//               {entryOptions.length > 0 && (
//                 <div className="flex gap-2">
//                   <button
//                     type="button"
//                     className="text-xs text-primary hover:underline cursor-pointer"
//                     onClick={() =>
//                       setFormData((prev) => ({
//                         ...prev,
//                         addressIds: entryOptions.map((o) => o.value),
//                       }))
//                     }
//                   >
//                     Select all
//                   </button>
//                   <button
//                     type="button"
//                     className="text-xs text-muted-foreground hover:underline cursor-pointer"
//                     onClick={() => setFormData((prev) => ({ ...prev, addressIds: [] }))}
//                   >
//                     Clear
//                   </button>
//                 </div>
//               )}
//             </div>
//             <div className="max-h-48 overflow-y-auto rounded-md border border-border p-3 space-y-2 bg-muted/20">
//               {(() => {
//                 if (loading && entryOptions.length === 0)
//                   return (
//                     <p className="text-sm text-muted-foreground">Loading addresses...</p>
//                   );
//                 if (entryOptions.length === 0)
//                   return (
//                     <p className="text-sm text-muted-foreground">No addresses configured.</p>
//                   );
//                 return entryOptions.map((entry) => (
//                   <label
//                     key={entry.value}
//                     className="flex items-center gap-2 cursor-pointer hover:bg-muted/30 rounded px-2 py-1.5"
//                   >
//                     <input
//                       type="checkbox"
//                       checked={formData.addressIds.includes(entry.value)}
//                       onChange={(e) => {
//                         const id = entry.value;
//                         setFormData((prev) => ({
//                           ...prev,
//                           addressIds: e.target.checked
//                             ? [...prev.addressIds, id]
//                             : prev.addressIds.filter((x) => x !== id),
//                         }));
//                       }}
//                       className="rounded border-border"
//                     />
//                     <span className="text-sm">{entry.label}</span>
//                   </label>
//                 ));
//               })()}
//             </div>
//             {formData.addressIds.length > 0 && (
//               <p className="text-xs text-muted-foreground">
//                 {formData.addressIds.length} address(es) selected
//               </p>
//             )}
//           </div>

//           <Button type="submit" disabled={loading || submitLoading} className="w-full cursor-pointer">
//             {submitLoading ? "Inviting..." : loading ? "Loading..." : "Invite Tenant"}
//           </Button>
//         </form>
//       </CardContent>
//     </Card>
//   );
// }



"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "react-toastify";
import { getSignedInUser } from "@/redux/slice/auth-mgt/auth-mgt";
import { getOwnerAddressesByEstate } from "@/redux/slice/resident/address-options/resident-address-options";
import { inviteTenant } from "@/redux/slice/resident/invite-tenant/invite-tenant";
import type { AppDispatch, RootState } from "@/redux/store";
import { useDispatch, useSelector } from "react-redux";

type InviteTenantFormProps = {
  readonly close: () => void;
};

interface FormData {
  estateId: string;
  firstName: string;
  lastName: string;
  email: string;
  addressId: string;
}

export default function InviteTenantForm({ close }: InviteTenantFormProps) {
  const dispatch = useDispatch<AppDispatch>();
  const [formData, setFormData] = useState<FormData>({
    estateId: "",
    firstName: "",
    lastName: "",
    email: "",
    addressId: "",
  });
  const [submitLoading, setSubmitLoading] = useState(false);

  const { ownerAddresses, ownerAddressesStatus } = useSelector((state: RootState) => {
    const s = (state as {
      residentAddressOptions?: {
        ownerAddresses: Array<{ id: string; data?: Record<string, string> }>;
        ownerAddressesStatus: string;
        error: string | null;
      };
    }).residentAddressOptions;
    return {
      ownerAddresses: s?.ownerAddresses ?? [],
      ownerAddressesStatus: s?.ownerAddressesStatus ?? "idle",
    };
  });

  const entryOptions = (() => {
    if (!ownerAddresses.length) return [];
    return ownerAddresses.map((item) => {
      const d = item.data ?? {};
      const label = Object.entries(d)
        .map(([k, v]) => `${k}: ${v}`)
        .join(", ");
      return { label: label || item.id || "", value: item.id };
    });
  })();

  const loading = ownerAddressesStatus === "isLoading";

  useEffect(() => {
    const load = async () => {
      try {
        const userRes = await dispatch(getSignedInUser()).unwrap();
        const rawEstate = userRes?.data?.estateId ?? userRes?.data?.estate;

        let estateId = "";
        if (typeof rawEstate === "string") {
          estateId = rawEstate;
        } else if (rawEstate && typeof rawEstate === "object") {
          estateId = (rawEstate as { id?: string }).id ?? "";
        }

        if (!estateId) {
          toast.error("No estate linked to your account.");
          return;
        }
        setFormData((prev) => ({ ...prev, estateId }));

        await dispatch(
          getOwnerAddressesByEstate({ estateId, page: 1, limit: 200 }),
        ).unwrap();
      } catch {
        toast.error("Failed to load address options.");
      }
    };
    load();
  }, [dispatch]);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.estateId) return toast.error("Estate not loaded.");
    if (!formData.firstName?.trim()) return toast.error("Please enter first name.");
    if (!formData.lastName?.trim()) return toast.error("Please enter last name.");
    if (!formData.email?.trim()) return toast.error("Please enter email.");
    if (!formData.addressId) return toast.error("Please select an address.");

    setSubmitLoading(true);
    try {
      const res = await dispatch(
        inviteTenant({
          estateId: formData.estateId,
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          email: formData.email.trim(),
          addressIds: [formData.addressId],
        })
      ).unwrap();
      toast.success((res as { message?: string })?.message ?? "Tenant invited successfully.");
      close();
    } catch (err: unknown) {
      const message = (err as { message?: string })?.message ?? "Failed to invite tenant.";
      toast.error(message);
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <Card className="max-w-lg mx-auto">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Invite Tenant</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="firstName">First Name</Label>
            <Input
              id="firstName"
              name="firstName"
              type="text"
              value={formData.firstName}
              onChange={handleInput}
              placeholder="Enter first name"
              required
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="lastName">Last Name</Label>
            <Input
              id="lastName"
              name="lastName"
              type="text"
              value={formData.lastName}
              onChange={handleInput}
              placeholder="Enter last name"
              required
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInput}
              placeholder="Enter email"
              required
              className="mt-1"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="addressId">Address</Label>
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading addresses...</p>
            ) : (
              <select
                title="Select an address"
                aria-label="Select an address"
                id="addressId"
                value={formData.addressId}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, addressId: e.target.value }))
                }
                className="w-full mt-1 rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer"
              >
                <option value="">Select an address</option>
                {entryOptions.length === 0 ? (
                  <option disabled>No addresses configured</option>
                ) : (
                  entryOptions.map((entry) => (
                    <option key={entry.value} value={entry.value}>
                      {entry.label}
                    </option>
                  ))
                )}
              </select>
            )}
          </div>

          <Button
            type="submit"
            disabled={loading || submitLoading}
            className="w-full cursor-pointer"
          >
            {submitLoading ? "Inviting..." : loading ? "Loading..." : "Invite Tenant"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}