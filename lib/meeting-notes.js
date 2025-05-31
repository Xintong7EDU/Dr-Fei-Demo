export class MeetingNotesService {
  constructor(supabase) {
    this.supabase = supabase
  }

  async create(meetingId, content) {
    const { data, error } = await this.supabase
      .from('meeting_notes')
      .insert({ meeting_id: meetingId, note_content: content })
      .select()
      .single()

    if (error) throw error
    return data
  }

  async getById(noteId) {
    const { data, error } = await this.supabase
      .from('meeting_notes')
      .select('*')
      .eq('note_id', noteId)
      .maybeSingle()

    if (error) throw error
    return data
  }

  async getByMeetingId(meetingId) {
    const { data, error } = await this.supabase
      .from('meeting_notes')
      .select('*')
      .eq('meeting_id', meetingId)
      .maybeSingle()

    if (error) throw error
    return data
  }

  async update(noteId, content) {
    const { data, error } = await this.supabase
      .from('meeting_notes')
      .update({ note_content: content })
      .eq('note_id', noteId)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async delete(noteId) {
    const { error } = await this.supabase
      .from('meeting_notes')
      .delete()
      .eq('note_id', noteId)

    if (error) throw error
  }
}
