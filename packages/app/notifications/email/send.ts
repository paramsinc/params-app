import { serverEnv } from 'app/env/env.server'
import { Resend } from 'resend'

const resend = new Resend(serverEnv.RESEND_KEY)

export async function sendEmailHTML({
  to,
  subject,
  html,
}: {
  to: string[]
  subject: string
  html: string
}) {
  return resend.emails.send({
    from: 'hey@params.com',
    to,
    subject,
    html,
  })
}
