import { HomeScreen } from 'app/features/home/screen'
import { GetStaticProps } from 'next'

export default HomeScreen

export const getStaticProps = (async () => {
  console.log('getStaticProps')
  //   read in a repo from github
  //   read in the templates folder in that repo
  // get the name of each folder in the templates folder
  // get the readme of each template

  const repo = `paramsinc/all`
  const mainBranch = `main`

  const templates: Array<{
    path: string
    name: string
    html_url: string
  }> = await fetch(
    `https://api.github.com/repos/${repo}/contents/templates?ref=main`
  ).then((res) => res.json())

  for (const template of templates) {
    const readmePath = `https://raw.githubusercontent.com/${repo}/${mainBranch}/templates/${template.name}/readme.md`
  }

  console.log(templates)

  return {
    props: {
      templates: templates.map((template) => {
        return {
          name: template.name,
          html_url: template.html_url,
        }
      }),
    },
    // in seconds - avoid hitting the rate limit
    revalidate: 10,
  }
}) satisfies GetStaticProps<React.ComponentProps<typeof HomeScreen>>
