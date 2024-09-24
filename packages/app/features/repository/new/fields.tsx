import { Input } from 'app/ds/Input'
import { View } from 'app/ds/View'
import { env } from 'app/env'
import { FormCard } from 'app/features/profile/new/layout'
import { slugify } from 'app/trpc/slugify'

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
    <FormCard theme={error ? 'red' : undefined}>
      <FormCard.Title>Repo Name</FormCard.Title>
      <View row gap="$1" ai="center">
        <Input
          onChangeText={(next) => onChange(slugify(next))}
          onChange={(e) => e.preventDefault()}
          value={slug}
          placeholder="repo-name"
          ref={inputRef}
        />
      </View>
      <FormCard.Description>
        Lowercase letters, numbers, and dashes. Shown publicly.
      </FormCard.Description>
    </FormCard>
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
    <FormCard theme={error ? 'red' : undefined}>
      <FormCard.Title>GitHub URL</FormCard.Title>
      <Input
        onChangeText={onChange}
        value={url}
        placeholder="https://github.com/username/repository"
        ref={inputRef}
      />
      <FormCard.Description>
        Enter the URL of the GitHub repository. If the project is nested in a monorepo,
        add the URL to the nested folder.
      </FormCard.Description>
    </FormCard>
  )
}
