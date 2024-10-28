import { env } from 'app/env'
import { imageLoader } from 'app/image/loader'
import { repoBySlug } from 'app/trpc/api'
import { ImageResponse } from 'next/og'
import { encode } from 'js-base64'

export async function generateMarkdownBadge(profileSlug: string, repoSlug: string) {
  const baseUrl =
    process.env.NODE_ENV === 'production' ? `https://${env.URL}` : `http://localhost:3000`

  const badgeUrl = `${baseUrl}/api/og/repo/${profileSlug}/${repoSlug}`
  const linkUrl = `https://params.com/${profileSlug}/${repoSlug}`

  return `[![${repoSlug} by @${profileSlug}](${badgeUrl})](${linkUrl})`
}

export async function GET(request: Request) {
  const { pathname, searchParams } = new URL(request.url)
  const profileSlug = pathname.split('/')[4]
  const repoSlug = pathname.split('/')[5]
  const format = searchParams.get('format')

  if (!profileSlug || !repoSlug) {
    return new Response('Missing required parameters', { status: 400 })
  }

  if (format === 'markdown') {
    const markdown = await generateMarkdownBadge(profileSlug, repoSlug)
    return new Response(markdown, {
      headers: {
        'Content-Type': 'text/plain',
      },
    })
  }

  const baseUrl =
    process.env.NODE_ENV === 'production' ? `https://${env.URL}` : `http://localhost:3000`

  console.log('GET /api/og/repo/[profileSlug]/[repoSlug]', profileSlug, repoSlug)
  const [circularBook, circularBold, repo] = await Promise.all([
    fetch(baseUrl + '/fonts/CircularStd-Book.ttf').then((res) => res.arrayBuffer()),
    fetch(baseUrl + '/fonts/CircularStd-Bold.ttf').then((res) => res.arrayBuffer()),
    repoBySlug({ profile_slug: profileSlug, repo_slug: repoSlug }),
  ])
  const {
    profile: { image_vendor, image_vendor_id },
  } = repo
  const imageSrc =
    image_vendor && image_vendor_id
      ? imageLoader[image_vendor]({ src: image_vendor_id, width: 800 })
      : null
  try {
    const gradientString = `
      radial-gradient(at 27% 37%, #3B82F6 0px, transparent 50%),
      radial-gradient(at 97% 21%, #4ADE80 0px, transparent 50%),
      radial-gradient(at 52% 99%, #EF4444 0px, transparent 50%),
      radial-gradient(at 10% 29%, #8B5CF6 0px, transparent 50%),
      radial-gradient(at 97% 96%, #D4B996 0px, transparent 50%),
      radial-gradient(at 33% 50%, #93B1E5 0px, transparent 50%),
      radial-gradient(at 79% 53%, #F48FB1 0px, transparent 50%)
    `
    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#000',
            padding: '60px',
            fontFamily: 'CircularStd',
            fontSize: 36,
            color: 'white',
          }}
        >
          {/* Gradient background */}
          {gradientString.split('\n').map((r, i) => {
            return (
              <div
                key={i + 'gradient' + r}
                style={{
                  position: 'absolute',
                  width: '80%',
                  left: '0%',
                  height: '100%',
                  right: '0%',
                  top: '0%',
                  opacity: 0.35,
                  filter: 'blur(90px) saturate(200%)',
                  backgroundImage: r.trim(),
                  display: 'flex',
                  overflow: 'visible',
                }}
              />
            )
          })}

          {/* Content */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              flex: 1,
              justifyContent: 'space-between',
            }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  gap: '40px',
                  alignItems: 'center',
                  fontSize: '2em',
                }}
              >
                <div
                  style={{
                    borderRadius: 9999,
                    overflow: 'hidden',
                    width: 200,
                    height: 200,
                    display: 'flex',
                  }}
                >
                  {imageSrc && (
                    <img
                      src={imageSrc}
                      style={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        objectFit: 'cover',
                        transform: 'scaleX(-1)',
                      }}
                    />
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <div
                    style={{
                      // fontSize: 50,
                      color: '#fff',
                      fontFamily: 'monospace',
                      display: 'flex',
                      fontWeight: 700,
                      maxWidth: '80%',
                      whiteSpace: 'pre-wrap',
                      margin: 0,
                    }}
                  >
                    {repoSlug}
                  </div>
                  <span
                    style={{
                      // fontSize: 50,
                      fontFamily: 'monospace',
                      display: 'flex',
                      maxWidth: '80%',
                      whiteSpace: 'pre-wrap',
                      color: '#ffffff95',
                    }}
                  >
                    by @{profileSlug}
                  </span>
                </div>
              </div>
            </div>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-end',
                gap: 20,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  // gap: 40,
                  alignItems: 'center',
                  padding: 30,
                  borderRadius: 20,
                  background: '#ffffff20',
                  backdropFilter: 'blur(30px)',
                  // cool inset shadows for 3d effect
                  boxShadow: 'inset 0 0 10px 1px #ffffff10',
                  border: '1px solid #ffffff10',
                }}
              >
                <div style={{ display: 'flex', flex: 1, fontWeight: 700 }}>
                  Get expert advice from @{profileSlug}
                </div>

                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'row',
                    gap: 20,
                    background: 'white',
                    borderRadius: 9999,
                    alignItems: 'center',
                    height: 36 + 25 * 2,
                    padding: '0 20px',
                    alignSelf: 'flex-start',
                  }}
                >
                  <img
                    src="data:image/svg+xml;charset=utf-8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' class='lucide lucide-phone'><path d='M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z'/></svg>"
                    style={{ height: 38, width: 38 }}
                  />

                  <span
                    style={{
                      display: 'flex',
                      // fontSize: 24,
                      lineHeight: 32 + 10 * 2,
                      fontWeight: 'bold',
                      color: '#000',
                    }}
                  >
                    Book a Call
                  </span>
                </div>
              </div>
              <div
                style={{
                  color: '#999',
                  width: '100%',
                  display: 'flex',
                  justifyContent: 'flex-end',
                }}
              >
                params.com
              </div>
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
        fonts: [
          {
            name: 'CircularStd',
            data: circularBold,
            weight: 700,
          },
          {
            name: 'CircularStd',
            data: circularBook,
            weight: 400,
          },
        ],
      }
    )
  } catch (error) {
    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#0d1117',
            color: '#fff',
            fontSize: 32,
            fontFamily: 'CircularStd',
          }}
        >
          Repository not found
        </div>
      ),
      {
        width: 1200 * 2,
        height: 630 * 2,
        fonts: [
          {
            name: 'CircularStd',
            data: circularBold,
            weight: 700,
          },
        ],
      }
    )
  }
}

const phone = (
  <img
    src="data:image/svg+xml;charset=utf-8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' class='lucide lucide-phone'><path d='M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z'/></svg>"
    style={{ height: 24, width: 24 }}
  />
)
