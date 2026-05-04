/** Dummy data for admin Community Chat until API is wired. */

export const COMMUNITY_ESTATE_NAME = "EZRA COURT";

export type CommunityChatGroup = {
  id: string;
  name: string;
  lastMsg: string;
  time: string;
  unread: number;
  memberCount: number;
  createdAtLabel: string;
  about: string;
};

export type CommunityMessage = {
  id: string;
  sender: string;
  text: string;
  type: "admin" | "resident";
  time: string;
  /** ISO date string for grouping (dummy) */
  date: string;
};

export type CommunityMember = {
  id: string;
  name: string;
  subtitle: string;
  tag: "Admin" | "Member";
  avatarColor: "green" | "gray";
};

export const DUMMY_GROUPS: CommunityChatGroup[] = [
  {
    id: "g1",
    name: "Demo Estate Residents",
    lastMsg: "You: Good morning everyone...",
    time: "10:30 AM",
    unread: 12,
    memberCount: 156,
    createdAtLabel: "May 10, 2024 at 11:45 AM",
    about: "This group is for all residents of Demo Estate",
  },
  {
    id: "g2",
    name: "Block A Residents",
    lastMsg: "Dunsin: Thanks for the update on water supply.",
    time: "09:15 AM",
    unread: 3,
    memberCount: 42,
    createdAtLabel: "April 2, 2024 at 08:20 AM",
    about: "Announcements and chat for Block A only.",
  },
  {
    id: "g3",
    name: "Facility Notices",
    lastMsg: "You: Gate hours change this weekend.",
    time: "Yesterday",
    unread: 0,
    memberCount: 280,
    createdAtLabel: "Jan 15, 2024 at 02:00 PM",
    about: "Official notices from facility management.",
  },
];

export const DUMMY_MESSAGES_BY_GROUP: Record<string, CommunityMessage[]> = {
  g1: [
    {
      id: "m3",
      sender: "Chioma Okafor",
      text: "Good afternoon — any update on the generator maintenance?",
      type: "resident",
      time: "02:10 PM",
      date: "2026-05-02",
    },
    {
      id: "m1",
      sender: "Farouq Bolade",
      text: "Hello, facility manager",
      type: "resident",
      time: "03:53 PM",
      date: "2026-05-02",
    },
    {
      id: "m2",
      sender: "You (Facility Manager)",
      text: "Hello, all, welcome to the resident groupchat",
      type: "admin",
      time: "03:53 PM",
      date: "2026-05-02",
    },
  ],
  g2: [
    {
      id: "m4",
      sender: "Dunsin Ade",
      text: "Thanks for the update on water supply.",
      type: "resident",
      time: "09:12 AM",
      date: "2026-05-02",
    },
  ],
  g3: [
    {
      id: "m5",
      sender: "You (Facility Manager)",
      text: "Gate hours change this weekend — please read the notice pinned above.",
      type: "admin",
      time: "08:00 AM",
      date: "2026-05-01",
    },
  ],
};

export const DUMMY_GROUP_MEMBERS: CommunityMember[] = [
  {
    id: "u1",
    name: "John Adeyemi",
    subtitle: "Facility Manager",
    tag: "Admin",
    avatarColor: "green",
  },
  {
    id: "u2",
    name: "Farouq Bolade",
    subtitle: "Resident",
    tag: "Member",
    avatarColor: "gray",
  },
  {
    id: "u3",
    name: "Chioma Okafor",
    subtitle: "Resident",
    tag: "Member",
    avatarColor: "green",
  },
  {
    id: "u4",
    name: "Emeka Nwosu",
    subtitle: "Resident",
    tag: "Member",
    avatarColor: "gray",
  },
];

export const DUMMY_RESIDENT_OPTIONS = [
  { label: "Select residents", value: "" },
  { label: "Block A — floor 1", value: "block-a-1" },
  { label: "Block A — floor 2", value: "block-a-2" },
  { label: "Block B — all", value: "block-b" },
];
