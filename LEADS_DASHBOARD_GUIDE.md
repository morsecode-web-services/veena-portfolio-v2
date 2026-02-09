# Leads Dashboard Guide

## ✅ What's Been Built

A complete admin dashboard for managing contact form submissions at `/admin/leads`.

---

## Features

### 📊 View All Leads
- See all contact form submissions in one place
- Sortable table with all lead details
- Clean, professional UI

### 🔍 Advanced Filtering
- **Search**: Find leads by name, email, phone, or message content
- **Inquiry Type Filter**: performance, classes, collaboration, general
- **Status Filter**: new, contacted, converted, archived
- Clear all filters with one click

### 📝 Lead Details Modal
Click "View Details" on any lead to see:
- Full contact information (clickable email/phone links)
- Complete message text
- Status and inquiry type badges
- Submission timestamp
- Quick "Reply via Email" button (opens email client)

### ✅ Status Management
Update lead status directly from the table:
- **New** 🆕 - Just received
- **Contacted** 📧 - You've reached out
- **Converted** ✅ - Success! (booked/enrolled)
- **Archived** 📁 - Closed or not relevant

Changes save automatically to Supabase.

### 📥 Export to CSV
Export filtered leads to CSV for:
- Reporting
- Email marketing lists
- CRM import
- Backup

Includes: Date, Name, Email, Phone, Inquiry Type, Status, Message

---

## How to Use

### Access the Dashboard

1. Log in to admin: `yourdomain.com/admin/login`
2. Click **"Leads"** in the sidebar (Users icon)

### View and Filter Leads

**Search for specific people:**
```
Type in search box: "john" or "john@example.com" or "555-1234"
```

**Filter by inquiry type:**
```
Select dropdown: "Classes" → See only class inquiries
```

**Filter by status:**
```
Select dropdown: "New" → See uncontacted leads
```

**Combine filters:**
```
Type: Classes + Status: New = New class inquiries to follow up on
```

### Update Lead Status

**From table:**
1. Find the lead
2. Click the status dropdown in the "Status" column
3. Select new status
4. Saves automatically

**Workflow:**
1. New lead comes in → Status: **New** 🆕
2. You email them → Change to: **Contacted** 📧
3. They book/enroll → Change to: **Converted** ✅
4. Not interested → Change to: **Archived** 📁

### View Full Details

1. Click **"View Details"** button
2. Modal opens with:
   - Full contact info
   - Complete message
   - Timestamps
3. Click email/phone to contact directly
4. Click **"Reply via Email"** to open email client with pre-filled subject

### Export Data

1. Apply filters (optional - exports what you see)
2. Click **"Export CSV"** button (top right)
3. File downloads: `leads-2024-02-09.csv`
4. Open in Excel, Google Sheets, etc.

---

## Lead Lifecycle

### Typical Flow:

```
📥 Form Submitted
   ↓
🆕 Status: New (appears in dashboard)
   ↓
📧 You contact them → Status: Contacted
   ↓
✅ They book/enroll → Status: Converted
   OR
📁 Not interested → Status: Archived
```

### Best Practices:

**Daily:**
- Check for new leads (Status: New)
- Respond within 24-48 hours
- Update status after contacting

**Weekly:**
- Review contacted leads for follow-up
- Export converted leads for reporting

**Monthly:**
- Archive old unconverted leads
- Export all data for backup

---

## Dashboard Shortcuts

### Quick Filters

**See today's leads:**
```
Status: New → Most recent are at top
```

**See who needs follow-up:**
```
Status: Contacted → Review and follow up
```

**See successful conversions:**
```
Status: Converted → Track your wins! 🎉
```

**Find specific inquiry types:**
```
Type: Classes → See all class inquiries
Type: Performance → See all booking requests
```

### Power User Tips

**Bulk contact:**
1. Filter: Status = New
2. Export CSV
3. Import emails to email client
4. Send batch follow-up

**Track conversion rates:**
1. Export all leads
2. Count: Converted / Total
3. Analyze by inquiry type

**Find hot leads:**
1. Filter: Status = Contacted
2. Sort by date (oldest first)
3. Follow up on old contacts

---

## Color Coding

### Inquiry Types:
- 🟣 **Purple** = Performance
- 🔵 **Blue** = Classes
- 🟢 **Green** = Collaboration
- ⚫ **Gray** = General

### Statuses:
- 🟡 **Yellow** = New (needs attention!)
- 🔵 **Blue** = Contacted (in progress)
- 🟢 **Green** = Converted (success!)
- ⚫ **Gray** = Archived (closed)

---

## Data Privacy

### What's Stored:
- Name, email, phone, message
- Inquiry type, status
- Submission and update timestamps

### Security:
- ✅ Protected by admin authentication
- ✅ Only admins/editors can view
- ✅ Data stored securely in Supabase
- ✅ No public access

### GDPR Compliance:
- Users provide consent via form submission
- Data used only for responding to inquiries
- Can delete leads manually in Supabase dashboard if needed

---

## Troubleshooting

### No leads showing?

**Check:**
1. Leads table exists in Supabase
2. Contact form is working (submit a test)
3. RLS policies are correct (see TROUBLESHOOTING.md)

### Can't update status?

**Check:**
1. You're logged in as admin/editor
2. Supabase RLS allows authenticated updates
3. Browser console for errors

### Export not working?

**Check:**
1. At least one lead is displayed
2. Browser allows downloads
3. Try clearing filters first

---

## Navigation

From Leads Dashboard:
- **Dashboard/Events** → Manage upcoming performances
- **Blog** → Manage blog posts
- **Videos** → Manage music videos
- **Public Site** → View live website

---

## Mobile Responsive

Dashboard works on:
- ✅ Desktop (full table)
- ✅ Tablet (scrollable table)
- ✅ Mobile (touch-friendly, side menu)

---

## Future Enhancements (Not Yet Built)

Possible additions:
- Email templates for quick replies
- Notes field for each lead
- Tags/labels for custom categorization
- Bulk status updates
- Lead activity timeline
- Email integration (send from dashboard)
- Calendar integration for class scheduling

---

## Quick Reference

### Common Tasks:

| Task | Steps |
|------|-------|
| Check new leads | Go to /admin/leads, filter Status: New |
| Contact a lead | Click "View Details" → "Reply via Email" |
| Mark as contacted | Change status dropdown to "Contacted" |
| Export for reporting | Apply filters → Click "Export CSV" |
| Find class inquiries | Filter Type: Classes |
| Search specific person | Type name/email in search box |

---

## Support

Need help?
- Check: `TROUBLESHOOTING.md`
- Check: Supabase Dashboard → Logs
- Browser console (F12) for errors

---

**Location:** `/admin/leads`

**Access:** Admin/Editor role required

**Data Source:** Supabase `leads` table

**Updates:** Real-time with Supabase

Enjoy managing your leads! 🎵✨
