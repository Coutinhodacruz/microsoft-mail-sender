"use client"
import { EmailCampaign } from "@/components/email-campaign"

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50 p-4">
      <main className="max-w-3xl mx-auto">
        <EmailCampaign />
      </main>
    </div>
  )
}
