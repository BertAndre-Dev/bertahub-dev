"use client";

import { Phone } from "lucide-react";
import { useState } from "react";

interface ResidentDetailsProps {
  name?: string;
  block?: string;
  apartment?: string;
  phone?: string;
  avatarUrl?: string;
  onCall?: (phone: string) => void;
}

export default function ResidentDetails({
  name = "Jane Doe",
  block = "Block A",
  apartment = "Apartment J45",
  phone = "0812345678",
  avatarUrl = "/avatar-placeholder.jpg",
  onCall,
}: ResidentDetailsProps) {
  const [calling, setCalling] = useState(false);

  const handleCall = () => {
    setCalling(true);
    onCall?.(phone);
    setTimeout(() => setCalling(false), 2000);
  };

  return (
    <div className="resident-card">
      <div className="card-header">
        <h2 className="card-title">Resident Details</h2>
      </div>

      <div className="card-body">
        <div className="profile-row">
          <div className="avatar-wrapper">
            <img
              src={avatarUrl}
              alt={name}
              className="avatar-img"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src =
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=1D4ED8&color=fff&size=128`;
              }}
            />
          </div>
          <div className="profile-info">
            <p className="resident-name">{name}</p>
            <p className="resident-address">
              {block}, {apartment}
            </p>
          </div>
        </div>

        <div className="action-row">
          <div className="phone-display">
            <Phone className="icon-sm text-gray" />
            <span className="phone-number">{phone}</span>
          </div>

          <button
            className={`call-button ${calling ? "calling" : ""}`}
            onClick={handleCall}
            aria-label={`Call ${name}`}
          >
            <Phone className="icon-sm text-white" />
            <span>{calling ? "Calling..." : "Call"}</span>
          </button>
        </div>
      </div>

      <style jsx>{`
        .resident-card {
          background: #ffffff;
          border-radius: 20px;
          box-shadow: 0 2px 16px rgba(0, 0, 0, 0.08);
          overflow: hidden;
          max-width: 680px;
          width: 100%;
          font-family: "SF Pro Display", -apple-system, BlinkMacSystemFont,
            "Segoe UI", sans-serif;
        }

        .card-header {
          padding: 28px 32px 24px;
          border-bottom: 1px solid #f0f0f0;
        }

        .card-title {
          font-size: 28px;
          font-weight: 700;
          color: #111111;
          margin: 0;
          letter-spacing: -0.5px;
        }

        .card-body {
          padding: 28px 32px 32px;
          display: flex;
          flex-direction: column;
          gap: 32px;
        }

        .profile-row {
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .avatar-wrapper {
          flex-shrink: 0;
          width: 72px;
          height: 72px;
          border-radius: 50%;
          border: 3px solid #1d4ed8;
          overflow: hidden;
          background: #e8eeff;
        }

        .avatar-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .profile-info {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .resident-name {
          font-size: 22px;
          font-weight: 700;
          color: #111111;
          margin: 0;
          letter-spacing: -0.3px;
        }

        .resident-address {
          font-size: 15px;
          color: #555555;
          margin: 0;
          font-weight: 400;
        }

        .action-row {
          display: flex;
          gap: 16px;
          align-items: center;
        }

        .phone-display {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px 20px;
          border: 1.5px solid #e5e7eb;
          border-radius: 14px;
          background: #fafafa;
        }

        .phone-number {
          font-size: 16px;
          font-weight: 500;
          color: #333333;
          letter-spacing: 0.5px;
        }

        .icon-sm {
          width: 20px;
          height: 20px;
          flex-shrink: 0;
        }

        .text-gray {
          color: #888888;
        }

        .text-white {
          color: #ffffff;
        }

        .call-button {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 16px 36px;
          background: #1d4ed8;
          color: white;
          border: none;
          border-radius: 14px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s ease, transform 0.1s ease,
            box-shadow 0.2s ease;
          white-space: nowrap;
          box-shadow: 0 4px 14px rgba(29, 78, 216, 0.35);
        }

        .call-button:hover {
          background: #1e40af;
          box-shadow: 0 6px 20px rgba(29, 78, 216, 0.45);
          transform: translateY(-1px);
        }

        .call-button:active {
          transform: translateY(0);
          box-shadow: 0 2px 8px rgba(29, 78, 216, 0.3);
        }

        .call-button.calling {
          background: #15803d;
          box-shadow: 0 4px 14px rgba(21, 128, 61, 0.35);
          animation: pulse 1s ease-in-out infinite;
        }

        @keyframes pulse {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.8;
          }
        }
      `}</style>
    </div>
  );
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