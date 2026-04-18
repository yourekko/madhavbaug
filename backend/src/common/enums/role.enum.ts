export enum Role {
  PATIENT = 'patient',
  DOCTOR = 'doctor',
  /** Platform operator: assignments, moderation, SEO, same API access as superadmin for this MVP */
  ADMIN = 'admin',
  /** Top-tier operator; use when you want a separate account from day-to-day `admin` */
  SUPERADMIN = 'superadmin',
}
