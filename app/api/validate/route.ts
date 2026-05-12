import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const { email, phone } = await req.json();

        // Support for multiple keys (Rotation)
        const emailApiKeys = [
            process.env.BIGDATACLOUD_API_KEY_1,
            process.env.BIGDATACLOUD_API_KEY_2
        ].filter(Boolean);
        
        // Pick one randomly
        const emailApiKey = emailApiKeys.length > 0 
            ? emailApiKeys[Math.floor(Math.random() * emailApiKeys.length)]
            : null;

        const phoneApiKey = process.env.VERIPHONE_API_KEY;

        // If keys are missing, we fail-open (allow the user)
        if (!emailApiKey || !phoneApiKey) {
            return NextResponse.json({ isValid: true, skipReason: 'no_keys' });
        }

        // Run both validations in parallel
        const [emailRes, phoneRes] = await Promise.allSettled([
            // Email Check (BigDataCloud)
            fetch(`https://api-bdc.net/data/email-verify?emailAddress=${email}&key=${emailApiKey}`, { 
                signal: AbortSignal.timeout(5000) 
            }).then(r => r.json()),

            // Phone Check (Veriphone)
            fetch(`https://api.veriphone.io/v2/verify?key=${phoneApiKey}&phone=${encodeURIComponent(phone)}`, { 
                signal: AbortSignal.timeout(5000) 
            }).then(r => r.json())
        ]);

        let emailValid = true;
        let phoneValid = true;
        let errorMessage = '';

        // Handle Email Result
        if (emailRes.status === 'fulfilled') {
            const data = emailRes.value;
            
            // Handle Quota/API Errors (Fail-Open)
            if (data.isValid === false) {
                emailValid = false;
                errorMessage = 'The email address provided is invalid or inactive.';
            }
        }

        // Handle Phone Result
        if (phoneRes.status === 'fulfilled') {
            const data = phoneRes.value;
            
            // Handle Quota/API Errors (Fail-Open)
            if (data.status === 'success') {
                if (data.phone_type !== 'mobile' && data.phone_type !== 'fixed_line_or_mobile') {
                    phoneValid = false;
                    errorMessage = 'Please provide a valid mobile number capable of receiving WhatsApp.';
                }
            }
        }

        return NextResponse.json({
            isValid: emailValid && phoneValid,
            error: errorMessage
        });

    } catch (error) {
        console.error('Validation API Error:', error);
        // Fail-open on any catastrophic failure
        return NextResponse.json({ isValid: true, skipReason: 'error' });
    }
}
