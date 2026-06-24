import { createElement } from 'react';
import { ImageResponse } from 'next/og';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { ParticipationCertificateImage } from '@/lib/certificates/ParticipationCertificateImage';
import type { CertificateImageProps } from '@/lib/certificates/ParticipationCertificateImage';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

function getLocalFont(filename: string): Buffer {
    const filePath = path.join(process.cwd(), 'public', 'fonts', filename);
    return fs.readFileSync(filePath);
}

function sanitiseName(raw: string): string {
    return raw
        .trim()
        .slice(0, 60)
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
}

function sanitiseCohortTitle(raw: string): string {
    return raw.length > 80 ? raw.slice(0, 77) + '...' : raw;
}

function sanitiseOutcomes(raw: string): string[] {
    return raw
        .split('|')
        .slice(0, 3)
        .map(o => o.trim())
        .filter(Boolean)
        .map(o => (o.length > 70 ? o.slice(0, 67) + '...' : o));
}

function formatDate(d: Date): string {
    return d.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });
}

/**
 * Generates a certificate PNG, uploads it to Supabase Storage, and updates the enrollment record.
 * @returns The public URL of the generated certificate.
 */
export async function generateAndUploadCertificate(enrollmentId: string): Promise<string> {
    // 1. Fetch enrollment details
    const { data: enrollment, error: enrollmentError } = await supabaseAdmin
        .from('enrollments')
        .select(`
            id,
            student_id,
            cohort_id,
            certificate_url,
            students(name),
            cohorts(title, month_name)
        `)
        .eq('id', enrollmentId)
        .single();

    if (enrollmentError || !enrollment) {
        throw new Error(`Enrollment not found: ${enrollmentError?.message}`);
    }

    // If it already exists, just return it
    if (enrollment.certificate_url) {
        return enrollment.certificate_url;
    }

    const studentName = (enrollment.students as any)?.name || 'Unknown Student';
    const cohortTitle = (enrollment.cohorts as any)?.title || 'Unknown Cohort';
    const monthName = (enrollment.cohorts as any)?.month_name || '';

    // 2. Fetch template config
    const { data: template } = await supabaseAdmin
        .from('cohort_certificate_templates')
        .select('background_url, fields_config')
        .eq('cohort_id', enrollment.cohort_id)
        .maybeSingle();

    if (!template) {
        throw new Error(`No certificate template found for cohort ${enrollment.cohort_id}`);
    }

    const backgroundUrl = template.background_url;
    const fieldsConfig = typeof template.fields_config === 'string'
        ? JSON.parse(template.fields_config)
        : template.fields_config;

    // 3. Prepare Image Properties
    const rawOutcomes = 'Raga exploration & ear training|Tala rhythm mastery|Live performance practice'; // Fallback or dynamic logic can go here

    const props: CertificateImageProps = {
        studentName: sanitiseName(studentName),
        cohortTitle: sanitiseCohortTitle(cohortTitle),
        monthName: monthName.slice(0, 20),
        learningOutcomes: sanitiseOutcomes(rawOutcomes),
        issuedDate: formatDate(new Date()),
        useRealSignature: false,
        backgroundUrl,
        fieldsConfig,
    };

    // 4. Load Fonts
    const georgiaRegular = getLocalFont('georgia.ttf');
    const georgiaBoldBuffer = getLocalFont('georgiab.ttf');
    const georgiaItalic = getLocalFont('georgiai.ttf');
    const arialRegular = getLocalFont('arial.ttf');

    // 5. Generate PNG
    const response = new ImageResponse(
        createElement(ParticipationCertificateImage, props),
        {
            width: 800,
            height: 1000,
            fonts: [
                { name: 'Playfair Display', data: georgiaRegular, weight: 400, style: 'normal' },
                { name: 'Playfair Display', data: georgiaBoldBuffer, weight: 700, style: 'normal' },
                { name: 'Playfair Display', data: georgiaItalic, weight: 400, style: 'italic' },
                { name: 'Inter', data: arialRegular, weight: 400, style: 'normal' }
            ]
        }
    );

    const arrayBuffer = await response.arrayBuffer();
    const originalBuffer = Buffer.from(arrayBuffer);

    // 6. Compress to optimized JPEG using Sharp to dramatically reduce file size
    const buffer = await sharp(originalBuffer)
        .jpeg({ quality: 65, mozjpeg: true, chromaSubsampling: '4:2:0' })
        .toBuffer();

    // 7. Upload to Supabase Storage
    const fileName = `${enrollment.cohort_id}/${enrollmentId}.jpg`;
    
    const { error: uploadError } = await supabaseAdmin.storage
        .from('certificates')
        .upload(fileName, buffer, {
            contentType: 'image/jpeg',
            upsert: true,
        });

    if (uploadError) {
        throw new Error(`Failed to upload certificate: ${uploadError.message}`);
    }

    const { data: { publicUrl } } = supabaseAdmin.storage
        .from('certificates')
        .getPublicUrl(fileName);

    // 7. Update database
    const { error: updateError } = await supabaseAdmin
        .from('enrollments')
        .update({
            certificate_url: publicUrl,
            // Only update certificate_sent_at when actually sent via Twilio!
        })
        .eq('id', enrollmentId);

    if (updateError) {
        throw new Error(`Failed to save certificate URL: ${updateError.message}`);
    }

    return publicUrl;
}
