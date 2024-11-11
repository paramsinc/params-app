import { Button, ButtonText } from 'app/ds/Button'
import { ErrorCard } from 'app/ds/Error/card'
import { Card } from 'app/ds/Form/layout'
import { Gradient } from 'app/ds/Gradient'
import { Lucide } from 'app/ds/Lucide'
import { Scroll } from 'app/ds/Scroll'
import { Text } from 'app/ds/Text'
import { View } from 'app/ds/View'
import { SignInWithGithub } from 'app/features/oauth/github/sign-in-with-github'
import { api } from 'app/trpc/client'

type GitHubRepo = {
  id: number
  name: string
  owner: { login: string }
}

export function GitHubRepoPicker({
  selectedRepo,
  onSelectRepo,
}: {
  selectedRepo: GitHubRepo | null
  onSelectRepo: (repo: GitHubRepo) => void
}) {
  const myReposQuery = api.github.myRepos.useQuery({
    limit: 100,
    page: 1,
  })

  if (!myReposQuery.data) {
    return <ErrorCard error={myReposQuery.error} />
  }

  if (myReposQuery.data.missing_github_integration) {
    return (
      <Card>
        <Text>Sync your GitHub account to create a new repo</Text>
        <SignInWithGithub>
          <Button>
            <ButtonText>Sign in with GitHub</ButtonText>
          </Button>
        </SignInWithGithub>
      </Card>
    )
  }

  return (
    <Card pb={0}>
      <Text>Select a GitHub Repository</Text>
      <View maxHeight={300} position="relative">
        <Scroll>
          <View flexWrap="wrap" gap="$2">
            {myReposQuery.data.repos.map((repo) => {
              const isSelected = selectedRepo?.id === repo.id
              return (
                <View
                  px="$2"
                  h={36}
                  bg="$backgroundStrong"
                  key={repo.id}
                  onPress={() => onSelectRepo(repo)}
                  row
                  ai="center"
                  br="$2"
                  bw={1}
                  cursor="pointer"
                  hoverStyle={{ bg: '$color1' }}
                  boc={isSelected ? '$color12' : '$borderColor'}
                >
                  <Text flex={1} userSelect="none" fontFamily="$mono">
                    {repo.name}
                  </Text>
                  <View>{isSelected && <Lucide.Check size={16} />}</View>
                </View>
              )
            })}
          </View>
        </Scroll>
        <Gradient
          top="auto"
          h={40}
          pointerEvents="none"
          gradient={(color) => `linear-gradient(0deg, ${color('background')}, transparent)`}
          zi={1}
        />
      </View>
    </Card>
  )
}
