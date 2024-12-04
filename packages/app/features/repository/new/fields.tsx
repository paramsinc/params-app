import { Input } from 'app/ds/Input'
import { env } from 'app/env'
import { Card } from 'app/ds/Form/layout'
import { slugify } from 'app/trpc/slugify'
import { TextArea } from 'app/ds/TextArea'

export const RepositorySlugField = ({
  slug,
  onChange,
  error,
  inputRef,
}: {
  slug: string
  onChange: (slug: string) => void
  error?: { message?: string }
  inputRef: any
}) => {
  return (
    <Card theme={error ? 'red' : undefined}>
      <Card.Label>Repo Slug</Card.Label>
      <Input
        onChangeText={(next) => onChange(slugify(next))}
        onChange={(e) => e.preventDefault()}
        value={slug}
        placeholder="repo-name"
        ref={inputRef}
      />
      <Card.Description>
        Lowercase letters, numbers, and dashes. Shown publicly on {env.APP_NAME}.
      </Card.Description>
    </Card>
  )
}

export const RepositoryDescriptionField = ({
  description,
  onChange,
  error,
  inputRef,
}: {
  description: string
  onChange: (description: string) => void
  error?: { message?: string }
  inputRef: any
}) => {
  return (
    <Card theme={error ? 'red' : undefined}>
      <Card.Label>Description</Card.Label>
      <TextArea
        onChangeText={onChange}
        value={description}
        placeholder="Describe your project in 1-2 sentences."
        ref={inputRef}
        styled
      />
      <Card.Description>
        Example: A scalable recommendation engine built with TensorFlow, featuring collaborative
        filtering, content-based filtering, and hybrid approaches. Includes pre-trained models and
        example datasets.
      </Card.Description>
    </Card>
  )
}

export const RepositoryGithubUrlField = ({
  url,
  onChange,
  error,
  inputRef,
}: {
  url: string
  onChange: (url: string) => void
  error?: { message?: string }
  inputRef: any
}) => {
  return (
    <Card theme={error ? 'red' : undefined}>
      <Card.Label>GitHub URL</Card.Label>
      <Input
        onChangeText={onChange}
        value={url}
        placeholder="https://github.com/username/repository"
        ref={inputRef}
      />
      <Card.Description>
        Enter the URL of the GitHub repository. If the project is nested in a monorepo, add the URL
        to the nested folder.
      </Card.Description>
    </Card>
  )
}
