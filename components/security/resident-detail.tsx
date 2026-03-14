"use client";

import { useState, useMemo } from "react";

export interface VisitorDetailsForResident {
  residentId?: { id: string; firstName: string; lastName: string } | null;
  addressId?: { id: string; data: Record<string, string> };
  phone?: string;
}

interface ResidentDetailsProps {
  name?: string;
  block?: string;
  apartment?: string;
  phone?: string;
  avatarUrl?: string;
  onCall?: (phone: string) => void;
  /** When provided, overrides name/block/apartment/phone from view-details API */
  visitorDetails?: VisitorDetailsForResident | null;
}

function PhoneIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1-9.4 0-17-7.6-17-17 0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1L6.6 10.8z" />
    </svg>
  );
}

export default function ResidentDetails({
  name: nameProp = "-",
  block: blockProp = "-",
  apartment: apartmentProp = "-",
  phone: phoneProp = "-",
  avatarUrl,
  onCall,
  visitorDetails,
}: ResidentDetailsProps) {
  const [calling, setCalling] = useState(false);

  const { name, block, apartment, phone } = useMemo(() => {
    if (visitorDetails) {
      const residentName = visitorDetails.residentId
        ? `${visitorDetails.residentId.firstName} ${visitorDetails.residentId.lastName}`.trim()
        : nameProp;
      const data = visitorDetails.addressId?.data ?? {};
      const block = (data.block ?? data.Block ?? Object.values(data)[0]) ?? blockProp;
      const apartment = (data.unit ?? data.Unit ?? data.apartment ?? data.Apartment ?? Object.values(data)[1]) ?? apartmentProp;
      return {
        name: residentName,
        block,
        apartment,
        phone: visitorDetails.phone ?? phoneProp,
      };
    }
    return {
      name: nameProp,
      block: blockProp,
      apartment: apartmentProp,
      phone: phoneProp,
    };
  }, [visitorDetails, nameProp, blockProp, apartmentProp, phoneProp]);

  const fallbackAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=1D4ED8&color=fff&size=128`;

  const handleCall = () => {
    setCalling(true);
    onCall?.(phone);
    setTimeout(() => setCalling(false), 2000);
  };

  return (
    <div className="bg-white rounded-2xl shadow-md w-full max-w-2xl h-[370px] overflow-y-scroll overflow-x-hidden pb-4 overflow-hidden">
      {/* Header */}
      <div className="px-8 pt-7 pb-5 border-b border-gray-100">
        <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
          Resident Details
        </h2>
      </div>

      {/* Body */}
      <div className="px-8 py-7 flex flex-col gap-8">
        {/* Profile Row */}
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-full border-2 border-blue-700 overflow-hidden flex-shrink-0 bg-blue-100">
            <img
              src={avatarUrl || fallbackAvatar}
              alt={name}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = fallbackAvatar;
              }}
            />
          </div>
          <div className="flex flex-col gap-1">
            <p className="text-xl font-bold text-gray-900 tracking-tight">
              {name}
            </p>
            <p className="text-sm text-gray-500">
              {block}, {apartment}
            </p>
          </div>
        </div>

        {/* Action Row */}
        <div className="flex gap-4 items-center">
          {/* Phone display */}
          <div className="flex-1 flex items-center gap-3 px-5 py-4 border border-gray-200 rounded-xl bg-gray-50">
            <PhoneIcon className="w-5 h-5 text-gray-400 flex-shrink-0" />
            <span className="text-base font-medium text-gray-700 tracking-wide">
              {phone}
            </span>
          </div>

          {/* Call button */}
          <button
            onClick={handleCall}
            aria-label={`Call ${name}`}
            className={`flex items-center gap-2.5 px-8 py-4 rounded-xl text-white text-base font-semibold transition-all duration-200 shadow-md
              ${
                calling
                  ? "bg-green-600 shadow-green-200 animate-pulse"
                  : "bg-blue-700 hover:bg-blue-800 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 active:shadow-md shadow-blue-200"
              }`}
          >
            <PhoneIcon className="w-5 h-5 text-white" />
            <span>{calling ? "Calling..." : "Call"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}