import { getServerSession } from "next-auth";
import { useSession } from "next-auth/react";
import { NextResponse } from "next/server";
import { authOptions } from "../auth/[...nextauth]/route";

export async function GET(req:Request){
    const session = await getServerSession(authOptions);
    console.log(session);
    if(!session){
        return NextResponse.json({error:"Unauthorized"},{status:401})
    }

    return NextResponse.json(session?.user,{status:200})


}