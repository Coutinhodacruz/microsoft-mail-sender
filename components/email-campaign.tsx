"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { X, Plus, LinkIcon, Code } from "lucide-react"
import { toast } from 'sonner';

interface Email {
  id: string
  email: string
}

export function EmailCampaign() {
  const [emails, setEmails] = useState<Email[]>([])
  const [singleEmail, setSingleEmail] = useState("")
  const [bulkEmails, setBulkEmails] = useState("")
  const [subject, setSubject] = useState("")
  const [content, setContent] = useState("")
  const [isSending, setIsSending] = useState(false)

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  const handleAddEmail = () => {
    if (singleEmail.trim() && isValidEmail(singleEmail)) {
      const newEmail: Email = {
        id: Date.now().toString(),
        email: singleEmail.trim(),
      }
      setEmails([...emails, newEmail])
      setSingleEmail("")
    }
  }

  const handleAddBulkEmails = () => {
    if (!bulkEmails.trim()) return

    // Split by comma, space, or newline and filter valid emails
    const emailList = bulkEmails
      .split(/[,\s\n]+/)
      .map((e) => e.trim())
      .filter((e) => e && isValidEmail(e))

    // Remove duplicates
    const existingEmails = new Set(emails.map((e) => e.email))
    const newEmails = emailList.filter((e) => !existingEmails.has(e))

    // Add new emails
    const formattedEmails = newEmails.map((email) => ({
      id: Math.random().toString(),
      email,
    }))

    setEmails([...emails, ...formattedEmails])
    setBulkEmails("")
  }

  const handleRemoveEmail = (id: string) => {
    setEmails(emails.filter((e) => e.id !== id))
  }

  const handleSend = async () => {
    if (emails.length === 0 || !subject.trim() || !content.trim()) {
      toast.error("Please add emails, subject, and content")
      return
    }

    setIsSending(true)
    
    try {
      // Send to each email individually for better tracking
      const emailPromises = emails.map(async (emailItem) => {
        try {
          const response = await fetch('/api/send-email', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              to: emailItem.email,
              subject: subject.trim(),
              text: content.trim().replace(/\s+\n\s+/g, '\n').replace(/\n{3,}/g, '\n\n').trim(),
              // Format HTML content with proper spacing
              html: content
                .trim()
                // Replace recipient name placeholder
                .replace(/\{\{recipientName\}\}/g, emailItem.email.split('@')[0])
                // Normalize line breaks and spacing
                .replace(/\s+\n\s+/g, '\n')
                .replace(/\n{3,}/g, '\n\n')
                // Convert double newlines to paragraphs, single newlines to <br>
                .replace(/\n\n/g, '</p><p>')
                .replace(/\n/g, '<br>')
            }),
          });

          if (!response.ok) {
            throw new Error(`Failed to send to ${emailItem.email}`);
          }

          return { success: true, email: emailItem.email };
        } catch (error) {
  console.error(`Error sending to ${emailItem.email}:`, error);
  const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
  return { success: false, email: emailItem.email, error: errorMessage };
}
      });

      const results = await Promise.all(emailPromises);
      const successCount = results.filter(r => r.success).length;
      const failedCount = results.length - successCount;

      if (failedCount > 0) {
        toast.warning(`Sent ${successCount} email(s) successfully, failed to send ${failedCount} email(s)`);
      } else {
        toast.success(`Successfully sent ${successCount} email(s)!`);
      }

      // Clear form on successful send
      setEmails([]);
    } catch (error) {
      console.error('Error sending emails:', error);
      toast.error('Failed to send emails. Please check the console for details.');
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-2xl">✉️</span>
          <h1 className="text-3xl font-bold text-slate-900">Email Campaign</h1>
        </div>
        <p className="text-slate-600">Add email addresses and send your campaign</p>
      </div>

      {/* Total Emails Counter */}
      <Card className="border-slate-200 bg-slate-100">
        <CardContent className="pt-6">
          <div className="flex justify-between items-center">
            <span className="text-slate-700 font-medium">Total Emails:</span>
            <span className="text-2xl font-bold text-blue-600">{emails.length}</span>
          </div>
        </CardContent>
      </Card>

      {/* Single Email Input */}
      <div className="space-y-2">
        <div className="flex gap-2">
          <Input
            type="email"
            placeholder="Enter a single email"
            value={singleEmail}
            onChange={(e) => setSingleEmail(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleAddEmail()}
            className="border-slate-300 bg-white text-slate-900"
          />
          <Button
            onClick={handleAddEmail}
            disabled={!singleEmail.trim()}
            className="bg-slate-900 text-white hover:bg-slate-800 px-3 rounded-lg"
          >
            <Plus className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Bulk Paste Section */}
      <div className="space-y-2">
        <label className="text-orange-500 font-semibold text-sm">Bulk paste (comma, space, or new line)</label>
        <textarea
          value={bulkEmails}
          onChange={(e) => setBulkEmails(e.target.value)}
          placeholder={`e.g.${"\n"}jane@example.com${"\n"}john@example.com, team@company.com more@company.com`}
          className="w-full min-h-32 p-4 border border-slate-300 rounded-lg bg-white text-slate-900 placeholder:text-slate-400 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-slate-400"
        />
        <div className="flex items-center gap-2">
          <Button
            onClick={handleAddBulkEmails}
            disabled={!bulkEmails.trim()}
            className="bg-white border border-slate-300 text-slate-700 hover:bg-slate-50"
          >
            <Code className="w-4 h-4 mr-2" />
            Add all
          </Button>
          <p className="text-sm text-slate-500">We'll remove duplicates and ignore invalid emails.</p>
        </div>
      </div>

      {/* Subject Input */}
      <div className="space-y-2">
        <label className="text-orange-500 font-semibold text-sm">Subject</label>
        <Input
          type="text"
          placeholder="Enter email subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="border-slate-300 bg-white text-slate-900"
        />
      </div>

      {/* Email Content */}
      <div className="space-y-2">
        <label className="font-semibold text-slate-900 text-sm">Email Content</label>
        <div className="relative">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Enter your email content here..."
            className="w-full min-h-40 p-4 border border-slate-300 rounded-lg bg-white text-slate-900 placeholder:text-slate-400 resize-none focus:outline-none focus:ring-2 focus:ring-slate-400"
          />
          <div className="absolute bottom-3 right-3 flex gap-2">
            <button 
              onClick={() => {
                const paragraphs = content
                  .split('\n\n')
                  .filter(p => p.trim() !== '');

                let htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Email Template</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333333;
      margin: 0;
      padding: 20px;
      background-color: #f8f9fa;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background: #ffffff;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.1);
    }
    h1 {
      color: #007BFF;
      font-size: 20px;
    }
    p {
      font-size: 15px;
      margin: 10px 0;
    }
    .button {
      display: inline-block;
      background-color: #007BFF;
      color: #ffffff !important;
      padding: 12px 24px;
      border-radius: 6px;
      text-decoration: none;
      font-weight: bold;
      margin-top: 20px;
    }
    .footer {
      margin-top: 30px;
      font-size: 12px;
      color: #666666;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Dear {{recipientName}},</h1>
`;

                // Convert paragraphs to HTML
                paragraphs.forEach(para => {
                  // Check if paragraph contains a URL
                  const urlMatch = para.match(/\b(https?:\/\/[^\s]+)\b/);

                  if (urlMatch) {
                    const url = urlMatch[0];
                    const text = para.replace(url, '').trim() || 'Click here';
                    htmlContent += `    <p style="text-align: center;">
      <a href="${url}" class="button" target="_blank">
        ${text}
      </a>
    </p>\n`;
                  } else {
                    // Regular paragraph
                    htmlContent += `    <p>${para.replace(/\n/g, '<br>')}</p>\n`;
                  }
                });

                // Add closing tags
                htmlContent += `    
    <div class="footer">
      © ${new Date().getFullYear()} .
    </div>
  </div>
</body>
</html>`;

                setContent(htmlContent);
                toast.success('Content converted to HTML template!');
              }}
              className="p-2 text-slate-400 hover:text-slate-600 bg-white rounded"
              title="Convert to HTML Template"
            >
              <Code className="w-5 h-5" />
            </button>
            <button className="p-2 text-slate-400 hover:text-slate-600 bg-white rounded">
              <LinkIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Email List */}
      {emails.length > 0 && (
        <Card className="border-slate-200 bg-white">
          <CardHeader>
            <CardTitle className="text-slate-900">Recipients ({emails.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {emails.map((email) => (
                <div
                  key={email.id}
                  className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-200 hover:border-slate-300 transition-colors"
                >
                  <span className="text-slate-700 text-sm">{email.email}</span>
                  <button
                    onClick={() => handleRemoveEmail(email.id)}
                    className="text-slate-400 hover:text-red-500 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Send Button */}
      <Button
        onClick={handleSend}
        disabled={isSending || emails.length === 0 || !subject.trim() || !content.trim()}
        className="w-full bg-slate-900 text-white hover:bg-slate-800 py-6 text-lg font-semibold"
      >
        {isSending ? "Sending..." : "Send Campaign"}
      </Button>
    </div>
  )
}
