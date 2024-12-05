import { Button, ButtonIcon, ButtonText } from 'app/ds/Button'
import { ErrorCard } from 'app/ds/Error/card'
import { getErrorMessages } from 'app/ds/Error/error'
import { Card } from 'app/ds/Form/layout'
import { Gradient } from 'app/ds/Gradient'
import { Input } from 'app/ds/Input'
import { Lucide } from 'app/ds/Lucide'
import { Scroll } from 'app/ds/Scroll'
import { Text } from 'app/ds/Text'
import useToast from 'app/ds/Toast'
import { View } from 'app/ds/View'
import { SignInWithGithub } from 'app/features/oauth/github/sign-in-with-github'
import { useMemo, useState } from 'app/react'
import { api } from 'app/trpc/client'

type GitHubRepo = {
  name: string
  owner: { login: string }
}

export function GitHubRepoPicker({
  selectedRepo,
  onSelectRepo,
}: {
  selectedRepo: GitHubRepo | null
  onSelectRepo: (
    repo: GitHubRepo & {
      private: boolean
    }
  ) => void
}) {
  const myReposQuery = api.github.myRepos.useQuery({
    limit: 100,
    page: 1,
  })
  const [search, setSearch] = useState('')

  const searchedResult = useMemo(() => {
    if (!myReposQuery.data) return []
    if (myReposQuery.data?.missing_github_integration) return []
    if (!search) return myReposQuery.data.repos

    return myReposQuery.data.repos.filter(
      (repo) =>
        repo.name.includes(search) ||
        repo.owner.login.includes(search) ||
        `${repo.owner.login}/${repo.name}`.includes(search)
    )
  }, [myReposQuery.data, search])

  if (!myReposQuery.data) {
    return <ErrorCard error={myReposQuery.error} />
  }

  if (myReposQuery.data.missing_github_integration) {
    return (
      <>
        <Text>Sync your GitHub account to create a new repo</Text>
        <SignInWithGithub>
          <Button inverse>
            <ButtonIcon icon={Lucide.Github} />
            <ButtonText>Sign in with GitHub</ButtonText>
          </Button>
        </SignInWithGithub>
      </>
    )
  }

  return (
    <>
      <Text>Select a GitHub Repository</Text>
      <Input value={search} onChangeText={setSearch} placeholder="Search repositories" />
      <View height={300} position="relative">
        <Scroll>
          <View flexWrap="wrap" gap="$2">
            {searchedResult.map((repo) => {
              const isSelected =
                selectedRepo?.name === repo.name && selectedRepo?.owner.login === repo.owner.login
              return (
                <View
                  px="$2"
                  h={50}
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
                  <View flex={1}>
                    <Text flex={1} userSelect="none" fontFamily="$mono">
                      {repo.owner.login}/{repo.name}
                    </Text>
                    <Text>
                      {repo.private ? (
                        <Text color="$red11">Private</Text>
                      ) : (
                        <Text color="$green11">Public</Text>
                      )}
                    </Text>
                  </View>
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
      <SignOutOfGithub />
    </>
  )
}

function SignOutOfGithub() {
  const { toast } = useToast()
  const mutation = api.github.deleteIntegration.useMutation({
    onError(error, variables, context) {
      toast({
        preset: 'error',
        title: 'Failed to sign out of GitHub',
        message: getErrorMessages(error.message, '\n'),
      })
    },
  })
  return (
    <Button als="flex-start" onPress={() => mutation.mutate()} loading={mutation.isPending}>
      <Button.Text>Sign out of GitHub</Button.Text>
    </Button>
  )
}
