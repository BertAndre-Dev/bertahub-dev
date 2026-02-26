"use client";

interface ClockInOutTimeProps {
  clockedIn?: string | null;
  clockedOut?: string | null;
  title?: string;
}

function formatTime(value?: string | null): string {
  if (!value) return "-- : -- --";

  if (/\d{1,2}\s*:\s*\d{2}\s*(AM|PM)/i.test(value)) return value;

  const date = new Date(value);
  if (!isNaN(date.getTime())) {
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12;
    return `${String(hours).padStart(2, "0")} : ${String(minutes).padStart(2, "0")} ${ampm}`;
  }

  return value;
}

export default function ClockInOutTime({
  clockedIn,
  clockedOut,
  title = "Clock in/out Time",
}: ClockInOutTimeProps) {
  return (
    <div className="bg-white shadow-md w-full max-w-3xl overflow-hidden">
      {/* Header */}
      <div className="px-8 pt-7 pb-5">
        <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
          {title}
        </h2>
      </div>

      {/* Body */}
      <div className="grid grid-cols-2 gap-5 px-8 pb-8 sm:grid-cols-1 md:grid-cols-2">
        {/* Clocked In */}
        <div className="flex flex-col gap-2">
          <label className="text-sm text-gray-500">Clocked In</label>
          <div
            className={`px-5 py-3.5 border border-gray-200 rounded-xl text-base font-medium tracking-wide ${
              !clockedIn ? "text-gray-300" : "text-gray-900"
            }`}
          >
            {formatTime(clockedIn)}
          </div>
        </div>

        {/* Clocked Out */}
        <div className="flex flex-col gap-2">
          <label className="text-sm text-gray-500">Clocked Out</label>
          <div
            className={`px-5 py-3.5 border border-gray-200 rounded-xl text-base font-medium tracking-wide ${
              !clockedOut ? "text-gray-300" : "text-gray-900"
            }`}
          >
            {formatTime(clockedOut)}
          </div>
        </div>
      </div>
    </div>
  );
}