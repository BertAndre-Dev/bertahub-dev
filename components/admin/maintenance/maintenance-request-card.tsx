"use client"

import React, { useState } from "react"
import { Badge } from "@/components/badge/page"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export interface MaintenanceRequest {
  id: string
  ticketNumber: string
  userAvatar: string
  userName: string
  userRole?: string
  location: string
  address: string
  priority: "critical" | "high" | "medium" | "low"
  status: "in-progress" | "in-review" | "open" | "resolved" | "closed" | "rejected" | "assigned"
  description: string
  timestamp: string
  comments?: MaintenanceComment[]
}

export interface MaintenanceComment {
  id: string
  author: string
  role?: string
  avatar: string
  message: string
  timestamp: string
}

interface MaintenanceRequestCardProps {
  request: MaintenanceRequest
  onStatusChange?: (requestId: string, newStatus: MaintenanceRequest["status"]) => void
  onAddComment?: (requestId: string, comment: string) => void
}

const getPriorityColor = (priority: MaintenanceRequest["priority"]) => {
  const priorityMap = {
    critical: "destructive",
    high: "destructive",
    medium: "outline",
    low: "outline",
  }
  return priorityMap[priority]
}

const getPriorityDisplay = (priority: MaintenanceRequest["priority"]) => {
  return priority.charAt(0).toUpperCase() + priority.slice(1)
}

const getStatusColor = (status: MaintenanceRequest["status"]) => {
  const statusMap: Record<MaintenanceRequest["status"], string> = {
    "in-progress": "bg-blue-100 text-blue-800",
    "in-review": "bg-yellow-100 text-yellow-800",
    open: "bg-gray-100 text-gray-800",
    resolved: "bg-green-100 text-green-800",
    closed: "bg-gray-100 text-gray-800",
    rejected: "bg-red-100 text-red-800",
    assigned: "bg-blue-100 text-blue-800",
  }
  return statusMap[status] || "bg-gray-100 text-gray-800"
}

const getStatusDisplay = (status: MaintenanceRequest["status"]) => {
  const statusMap: Record<MaintenanceRequest["status"], string> = {
    "in-progress": "In Progress",
    "in-review": "In Review",
    open: "Open",
    resolved: "Resolved",
    closed: "Closed",
    rejected: "Rejected",
    assigned: "Assigned",
  }
  return statusMap[status]
}

export function MaintenanceRequestCard({
  request,
  onStatusChange,
  onAddComment,
}: MaintenanceRequestCardProps) {
  const [commentText, setCommentText] = useState("")
  const [isExpanded, setIsExpanded] = useState(false)

  const handleAddComment = () => {
    if (commentText.trim()) {
      onAddComment?.(request.id, commentText)
      setCommentText("")
    }
  }

  return (
    <Card className="mb-4">
      <CardHeader>
        <div className="space-y-4">
          {/* Header Section */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 flex-1">
              {/* User Avatar */}
              <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
                <img
                  src={request.userAvatar}
                  alt={request.userName}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* User Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-base">{request.userName}</CardTitle>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="inline-flex items-center gap-1">
                      📍 <span className="text-muted-foreground">{request.address}</span>
                    </span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-1">{request.timestamp}</p>
              </div>
            </div>

            {/* Badges */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <Badge
                variant={getPriorityColor(request.priority)}
                className="text-xs font-semibold"
              >
                {getPriorityDisplay(request.priority)}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "text-xs font-semibold px-3 py-1 rounded h-auto",
                  getStatusColor(request.status)
                )}
                onClick={() => {
                  const newStatus = request.status === "in-progress" ? "assigned" : "in-progress"
                  onStatusChange?.(request.id, newStatus)
                }}
              >
                {getStatusDisplay(request.status)}
              </Button>
            </div>
          </div>

          {/* Ticket ID */}
          <div className="text-sm font-semibold text-right text-muted-foreground">
            {request.ticketNumber}
          </div>
        </div>
      </CardHeader>

      {/* Description */}
      <div className="px-6 pb-4">
        <p className="text-sm text-foreground">{request.description}</p>
      </div>

      {/* Comments Section */}
      <div className="border-t px-6 py-4">
        {/* Display existing comments */}
        {request.comments && request.comments.length > 0 && (
          <div className="mb-4 space-y-3 pb-4 border-b">
            {request.comments.map((comment) => (
              <div key={comment.id} className="flex gap-3">
                <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                  <img
                    src={comment.avatar}
                    alt={comment.author}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold">{comment.author}</p>
                    {comment.role && (
                      <span className="text-xs text-muted-foreground">{comment.role}</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{comment.timestamp}</p>
                  <p className="text-sm mt-1">{comment.message}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Comment Input */}
        <div className="flex items-end gap-2">
          <Input
            type="text"
            placeholder="Write a comment..."
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                handleAddComment()
              }
            }}
            className="flex-1"
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={handleAddComment}
            disabled={!commentText.trim()}
          >
            Comment
          </Button>
        </div>
      </div>
    </Card>
  )
}
