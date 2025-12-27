import { Router } from 'express';
import { generateOTP, sendOTPEmail } from './email-service';
import { db } from '../client/src/lib/firebase';
import { doc, setDoc, getDoc, deleteDoc } from 'firebase/firestore';

const router = Router();

// Store OTP temporarily (in production, use Redis or similar)
interface OTPData {
    otp: string;
    email: string;
    createdAt: number;
    expiresAt: number;
}

// Send OTP
router.post('/send-otp', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }

        // Generate OTP
        const otp = generateOTP();
        const now = Date.now();
        const expiresAt = now + (10 * 60 * 1000); // 10 minutes

        // Store OTP in Firestore
        const otpData: OTPData = {
            otp,
            email,
            createdAt: now,
            expiresAt
        };

        await setDoc(doc(db, 'otps', email), otpData);

        // Send OTP email
        const sent = await sendOTPEmail(email, otp);

        if (sent) {
            res.json({
                success: true,
                message: 'OTP sent successfully',
                expiresIn: 600 // seconds
            });
        } else {
            res.status(500).json({ error: 'Failed to send OTP email' });
        }
    } catch (error) {
        console.error('Send OTP error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Verify OTP
router.post('/verify-otp', async (req, res) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({ error: 'Email and OTP are required' });
        }

        // Get stored OTP
        const otpDoc = await getDoc(doc(db, 'otps', email));

        if (!otpDoc.exists()) {
            return res.status(400).json({ error: 'OTP not found or expired' });
        }

        const otpData = otpDoc.data() as OTPData;

        // Check if expired
        if (Date.now() > otpData.expiresAt) {
            await deleteDoc(doc(db, 'otps', email));
            return res.status(400).json({ error: 'OTP has expired' });
        }

        // Verify OTP
        if (otpData.otp !== otp) {
            return res.status(400).json({ error: 'Invalid OTP' });
        }

        // OTP is valid - delete it
        await deleteDoc(doc(db, 'otps', email));

        res.json({
            success: true,
            message: 'Email verified successfully'
        });
    } catch (error) {
        console.error('Verify OTP error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
