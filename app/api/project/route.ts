import prisma from "../../../lib/db"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")

  if (!id) {
    const data =  await prisma.project.findMany();
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })
  }

  const project = await prisma.project.findUnique({
    where: { id }, // ✅ works if your `id` is a String in Prisma schema
  })

  if (!project) {
    return new Response(JSON.stringify({ error: "Project not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    })
  }

  return new Response(JSON.stringify(project), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  })
}



export  async function POST(req: Request) {
  const { name, description, userId } = await req.json()

  if (!name || !description || !userId) {
    return new Response(JSON.stringify({ error: "Missing fields" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    })
  }

  const project = await prisma.project.create({
    data: {
      name,
      description,
      userId,
    },
  })

  return new Response(JSON.stringify(project), {
    status: 201,
    headers: { "Content-Type": "application/json" },
  })
}


export async function DELETE(req:Request){
    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")

    if (!id) {
        return new Response(JSON.stringify({ error: "Missing project ID" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
        })
    }

    const project = await prisma.project.delete({
        where: { id },
    })

    if (!project) {
        return new Response(JSON.stringify({ error: "Project not found" }), {
            status: 404,
            headers: { "Content-Type": "application/json" },
        })
    }

    return new Response(JSON.stringify({ message: "Project deleted successfully" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
    })
}

export async function PUT(req:Request){

    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")
    const { name, description, userId } = await req.json()

    if (!id || !name || !description || !userId) {
        return new Response(JSON.stringify({ error: "Missing fields" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
        })
    }

    const project = await prisma.project.update({
        where: { id },
        data: {
            name,
            description,
            userId,
        },
    })

    if (!project) {
        return new Response(JSON.stringify({ error: "Project not found" }), {
            status: 404,
            headers: { "Content-Type": "application/json" },
        })
    }

    return new Response(JSON.stringify(project), {
        status: 200,
        headers: { "Content-Type": "application/json" },
    })
}