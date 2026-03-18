import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json();

  const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.SENDGRID_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      personalizations: [
        {
          to: [{ email: "your@email.com" }],
          subject: "New Book Demo Request",
        },
      ],
      from: { email: "your@email.com" },
      content: [
        {
          type: "text/plain",
          value: `New request: ${JSON.stringify(body)}`,
        },
      ],
    }),
  });

  return NextResponse.json({ success: res.ok });
}