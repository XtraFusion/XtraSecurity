import { NextResponse } from "next/server";


export async function PUT(req:Request) {

    const { memberId, newRole } = await req.json();

    try {
    
        const roleUpdate = await prisma?.teamUser.updateMany({
            where:{id:memberId},
         data:{role:newRole}   
        })
        return NextResponse.json(roleUpdate, { status: 200 });
    } catch (error) {
        console.error("Error updating team member role:", error);
        throw error;
    }
}

