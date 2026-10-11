// Halaman tujuan bagi siswa yang belum/tidak boleh mengakses materi.
export function blockedStudentPath(status: string | null | undefined) {
  return status === "inactive" ? "/akun-nonaktif" : "/pending-approval";
}
