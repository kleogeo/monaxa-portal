import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  const now = new Date()
  const today = now.toISOString().split('T')[0]
  const dayOfWeek = now.getDay()
  const dayOfMonth = now.getDate()

  // Fetch all active templates
  const { data: templates, error } = await supabase
    .from('task_templates')
    .select('*')
    .eq('is_active', true)

  if (error) return new Response(JSON.stringify({ error }), { status: 500 })

  let generated = 0
  const errors = []

  for (const t of templates) {
    // Check if already generated today
    if (t.last_generated_at) {
      const lastGen = new Date(t.last_generated_at).toISOString().split('T')[0]
      if (lastGen === today) continue
    }

    // Check if this template should fire today
    let shouldGenerate = false
    if (t.type === 'daily') {
      shouldGenerate = true
    } else if (t.type === 'weekly') {
      shouldGenerate = t.day_of_week === dayOfWeek
    } else if (t.type === 'monthly') {
      shouldGenerate = t.day_of_month === dayOfMonth
    }

    if (!shouldGenerate) continue

    // Create the task
    const { error: insertError } = await supabase.from('tasks').insert({
      title: t.title,
      description: t.description,
      type: t.type,
      priority: t.priority,
      assigned_to: t.assigned_to,
      estimated_hours: t.estimated_hours,
      created_by: t.created_by,
      status: 'open',
      due_date: today,
      source: `Auto-generated (${t.type} template)`,
    })

    if (insertError) {
      errors.push({ template: t.title, error: insertError })
      continue
    }

    // Update last_generated_at
    await supabase.from('task_templates')
      .update({ last_generated_at: now.toISOString() })
      .eq('id', t.id)

    generated++
  }

  return new Response(
    JSON.stringify({ success: true, generated, errors, date: today }),
    { headers: { 'Content-Type': 'application/json' } }
  )
})
