"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { X, Plus, Send, Trash2 } from "lucide-react"

interface Account {
  id: string
  email: string
}

export function EmailBatchManager() {
  const [batchSize, setBatchSize] = useState<number>(100)
  const [accounts, setAccounts] = useState<Account[]>([])
  const [emailInput, setEmailInput] = useState("")
  const [sentBatches, setSentBatches] = useState<number>(0)
  const [isLoading, setIsLoading] = useState(false)

  const handleAddAccount = () => {
    if (emailInput.trim() && accounts.length < batchSize) {
      setAccounts([
        ...accounts,
        {
          id: Date.now().toString(),
          email: emailInput.trim(),
        },
      ])
      setEmailInput("")
    }
  }

  const handleRemoveAccount = (id: string) => {
    setAccounts(accounts.filter((acc) => acc.id !== id))
  }

  const handleSendBatch = async () => {
    if (accounts.length === 0) return

    setIsLoading(true)
    // Simulate sending emails
    await new Promise((resolve) => setTimeout(resolve, 1500))
    setSentBatches(sentBatches + 1)
    setAccounts([])
    setIsLoading(false)
  }

  const handleClearAll = () => {
    setAccounts([])
    setEmailInput("")
  }

  const handleReset = () => {
    setAccounts([])
    setEmailInput("")
    setBatchSize(100)
    setSentBatches(0)
  }

  return (
    <div className="space-y-6">
      {/* Batch Configuration Card */}
      <Card className="border-slate-700 bg-slate-800">
        <CardHeader>
          <CardTitle className="text-white">Batch Configuration</CardTitle>
          <CardDescription className="text-slate-400">Set up your email batch parameters</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Batch Size</label>
              <Input
                type="number"
                min="1"
                max="1000"
                value={batchSize}
                onChange={(e) => setBatchSize(Number.parseInt(e.target.value) || 100)}
                className="bg-slate-700 border-slate-600 text-white"
              />
              <p className="text-xs text-slate-500">Max accounts per batch</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Current Batch</label>
              <div className="bg-slate-700 border border-slate-600 rounded-md p-3 text-white font-semibold">
                {accounts.length} / {batchSize}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Batches Sent</label>
              <div className="bg-emerald-900 border border-emerald-700 rounded-md p-3 text-emerald-100 font-semibold">
                {sentBatches}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Account Input Card */}
      <Card className="border-slate-700 bg-slate-800">
        <CardHeader>
          <CardTitle className="text-white">Add Accounts</CardTitle>
          <CardDescription className="text-slate-400">Enter email addresses one by one</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              type="email"
              placeholder="Enter email address..."
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleAddAccount()}
              disabled={accounts.length >= batchSize}
              className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500"
            />
            <Button
              onClick={handleAddAccount}
              disabled={accounts.length >= batchSize || !emailInput.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          {accounts.length >= batchSize && (
            <p className="text-sm text-amber-400">Batch size limit reached ({batchSize} accounts)</p>
          )}
        </CardContent>
      </Card>

      {/* Accounts List Card */}
      {accounts.length > 0 && (
        <Card className="border-slate-700 bg-slate-800">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-white">Accounts in Current Batch</CardTitle>
                <CardDescription className="text-slate-400">{accounts.length} account(s) ready to send</CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={handleClearAll} className="text-slate-400 hover:text-red-400">
                <Trash2 className="w-4 h-4 mr-2" />
                Clear All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {accounts.map((account) => (
                <div
                  key={account.id}
                  className="flex justify-between items-center p-3 bg-slate-700 rounded-md border border-slate-600 hover:border-slate-500 transition-colors"
                >
                  <span className="text-slate-200">{account.email}</span>
                  <button
                    onClick={() => handleRemoveAccount(account.id)}
                    className="text-slate-400 hover:text-red-400 transition-colors p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 justify-center">
        <Button
          onClick={handleSendBatch}
          disabled={accounts.length === 0 || isLoading}
          size="lg"
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-8"
        >
          {isLoading ? (
            <>
              <span className="animate-spin mr-2">⏳</span>
              Sending...
            </>
          ) : (
            <>
              <Send className="w-4 h-4 mr-2" />
              Send Batch ({accounts.length})
            </>
          )}
        </Button>

        <Button
          onClick={handleReset}
          variant="outline"
          size="lg"
          className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white bg-transparent"
        >
          Reset All
        </Button>
      </div>

      {/* Stats Footer */}
      <div className="text-center text-sm text-slate-400 mt-8">
        <p>
          Total accounts processed: <span className="text-emerald-400 font-semibold">{sentBatches * batchSize}</span>
        </p>
      </div>
    </div>
  )
}
