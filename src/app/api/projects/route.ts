import { NextRequest, NextResponse } from 'next/server'
import { db, schema, initDb } from '@/db'
import { eq } from 'drizzle-orm'

export async function GET(req: NextRequest) {
  try {
    await initDb() // Ensure tables exist
    const id = req.nextUrl.searchParams.get('id')
    if (id) {
      const project = await db.query.projects.findFirst({
        where: eq(schema.projects.id, parseInt(id)),
      })
      return NextResponse.json(project)
    }
    const allProjects = await db.query.projects.findMany({
      orderBy: (projects, { desc }) => [desc(projects.createdAt)],
    })
    return NextResponse.json(allProjects)
  } catch (error) {
    console.error('[API] GET Projects error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
export async function POST(req: NextRequest) {
  try {
    await initDb()
    const { name } = await req.json()
    if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 })

    const slug = name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '')
    
    // Check if slug exists
    const existing = await db.query.projects.findFirst({
      where: eq(schema.projects.slug, slug),
    })

    if (existing) {
      return NextResponse.json({ error: 'Project with this name already exists' }, { status: 400 })
    }

    const [project] = await db.insert(schema.projects).values({
      name,
      slug,
    }).returning()

    return NextResponse.json(project)
  } catch (error) {
    console.error('[API] POST Projects error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await initDb()
    const id = req.nextUrl.searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 })

    const body = await req.json()
    const { name, metrikaCounterId, metrikaToken, directToken } = body

    const updated = await db.update(schema.projects)
      .set({
        ...(name && { name }),
        ...(metrikaCounterId && { metrikaCounterId }),
        ...(metrikaToken && { metrikaToken }),
        ...(directToken && { directToken }),
        updatedAt: new Date(),
      })
      .where(eq(schema.projects.id, parseInt(id)))
      .returning()

    return NextResponse.json(updated[0])
  } catch (error) {
    console.error('[API] PATCH Projects error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
