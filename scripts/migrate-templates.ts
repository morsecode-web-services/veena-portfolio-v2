import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! // Usually need Service Role for bypassing RLS, but if RLS allows anon with full privileges it's fine.
);

async function migrate() {
    console.log("Checking if form_configs columns exist...");

    // Performance
    const performanceHtml = `<h2>Dear {{name}},</h2>
<p>Thank you for your interest in booking a performance. I'm honored by your inquiry.</p>
<p>I will review your message and respond within 24-48 hours with my availability and details.</p>
<p>In the meantime, feel free to explore my recent performances and repertoire at <a href="https://aishwaryamanikarnike.com">aishwaryamanikarnike.com</a></p>
<br>
<p>Warm regards,<br>
<strong>Aishwarya Manikarnike</strong><br>
<span style="color: gray; font-size: 12px;">'A'-Grade Veena Artist (AIR) | Vidwat Antima Rank-Holding Vocalist</span></p>`;

    // Collaboration
    const collaborationHtml = `<h2>Dear {{name}},</h2>
<p>Thank you for reaching out about a potential collaboration. I'm always excited to explore creative partnerships.</p>
<p>I will review your proposal and respond within 24-48 hours to discuss possibilities.</p>
<br>
<p>Looking forward to connecting,<br>
<strong>Aishwarya Manikarnike</strong></p>`;


    try {
        const pReq = await supabase.from('form_configs').update({
            auto_reply_subject: 'Thank you for your performance inquiry',
            auto_reply_message: performanceHtml
        }).eq('form_slug', 'performance');

        if (pReq.error) {
            console.error("Failed to update performance:", pReq.error.message);
        } else {
            console.log("Updated performance template successfully.");
        }

        const cReq = await supabase.from('form_configs').update({
            auto_reply_subject: 'Thank you for your collaboration inquiry',
            auto_reply_message: collaborationHtml
        }).eq('form_slug', 'collaboration');

        if (cReq.error) {
            console.error("Failed to update collaboration:", cReq.error.message);
        } else {
            console.log("Updated collaboration template successfully.");
        }
    } catch (err: any) {
         console.error("Exception:", err.message);
    }
}

migrate();
