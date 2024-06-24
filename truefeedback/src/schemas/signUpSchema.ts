import {z} from 'zod'

export const usernameValidation = z.string().min(4,"Username must be atleast 4 characters").max(20, "Username cant be more than 20 characters").regex(/^[a-zA-Z0-9_]+$/,"Username should not contain special characters")

export const signUpSchema = z.object({
    username: usernameValidation,
    email: z.string().email({message: 'Invalid email address'}),
    password: z.string().min(6, {message: "Password should contain a minimum of 6 characters"})
})