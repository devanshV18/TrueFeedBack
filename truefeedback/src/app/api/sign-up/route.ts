import dbConnect from "@/lib/dbConnect";
import UserModel from "@/model/User";
import bcrypt from "bcryptjs";
import { sendVerificationEmail } from "@/helpers/sendVerificationEmail";
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    await dbConnect();

    try {
        const { username, email, password } = await request.json();

        // Check if a verified user already exists with the given username
        const existingUserVerifiedByUsername = await UserModel.findOne({
            username,
            isVerified: true
        });

        if (existingUserVerifiedByUsername) {
            return NextResponse.json({
                success: false,
                message: "Username is already taken"
            }, { status: 400 });
        }

        // Check if a user already exists with the given email
        const existingUserByEmail = await UserModel.findOne({ email });
        const verifyCode = Math.floor(100000 + Math.random() * 900000).toString(); // Ensure a 6-digit verification code

        if (existingUserByEmail) {
            if (existingUserByEmail.isVerified) {
                return NextResponse.json({
                    success: false,
                    message: "User already exists with this email"
                }, { status: 400 });
            } else {
                // Update the existing unverified user
                const hashedPassword = await bcrypt.hash(password, 10);
                existingUserByEmail.password = hashedPassword;
                existingUserByEmail.verifyCode = verifyCode;
                existingUserByEmail.verifyCodeExpiry = new Date(Date.now() + 3600000); // 1 hour expiry
                await existingUserByEmail.save();
            }
        } else {
            // Create a new user
            const hashedPassword = await bcrypt.hash(password, 10);
            const expiryDate = new Date();
            expiryDate.setHours(expiryDate.getHours() + 1);

            const newUser = new UserModel({
                username,
                email,
                password: hashedPassword,
                verifyCode: verifyCode,
                verifyCodeExpiry: expiryDate,
                isVerified: false,
                isAcceptingMessages: true,
                messages: []
            });

            await newUser.save();
        }

        // Send verification email
        const emailResponse = await sendVerificationEmail(email, username, verifyCode);

        if (!emailResponse.success) {
            return NextResponse.json({
                success: false,
                message: emailResponse.message
            }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            message: "User registered, verify your email"
        }, { status: 201 });

    } catch (error) {
        console.error('Error registering user', error);
        return NextResponse.json({
            success: false,
            message: "Error registering user"
        }, { status: 500 });
    }
}
