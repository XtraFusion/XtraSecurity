import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "../auth/[...nextauth]/route";
import prisma from "@/lib/db";

export async function GET(req:Request){
    const session = await getServerSession(authOptions);
    
    if(!session || !session.user?.email){
        return NextResponse.json({error:"Unauthorized"},{status:401})
    }

    // Fetch fresh user data from DB
    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true,
            tier: true,
            // Add other fields needed by the frontend here
        }
    });

    if (!user) {
        return NextResponse.json({error:"User not found"},{status:404})
    }

    return NextResponse.json(user,{status:200})
}