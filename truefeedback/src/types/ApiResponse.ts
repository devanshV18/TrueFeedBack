import { Message } from "@/model/User";

export interface ApiResponse{
    success: boolean;
    message: string;
    isAcceptimgMessages?: boolean
    messages?: Array<Message>
}

