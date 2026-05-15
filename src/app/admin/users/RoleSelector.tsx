'use client'

import { updateUserRole } from './actions'

export default function RoleSelector({ userId, currentRole }: { userId: string, currentRole: string }) {
  return (
    <form action={updateUserRole.bind(null, userId)}>
      <select 
        name="role" 
        defaultValue={currentRole} 
        onChange={(e) => e.target.form?.requestSubmit()}
        style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid var(--border)', backgroundColor: 'white' }}
      >
        <option value="student">Siswa</option>
        <option value="teacher">Guru</option>
        <option value="admin">Admin</option>
      </select>
    </form>
  )
}
