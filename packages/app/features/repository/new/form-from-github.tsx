import { Button, ButtonText } from 'app/ds/Button'
import { ErrorCard } from 'app/ds/Error/card'
import { Input } from 'app/ds/Input'
import { Scroll } from 'app/ds/Scroll'
import { Text } from 'app/ds/Text'
import { View } from 'app/ds/View'

import { api } from 'app/trpc/client'
import { useState } from 'react'
import { Card } from 'app/ds/Form/layout'
import { GitHubRepoPicker } from './github-repo-picker'

const { useMutation } = api.repo.createFromGithub

export function NewRepositoryFromGithubForm({
  onDidCreateRepository,
  profileId,
}: {
  onDidCreateRepository: NonNullable<Parameters<typeof useMutation>['0']>['onSuccess']
  profileId: string
}) {
  const [selectedRepo, setSelectedRepo] = useState<{
    name: string
    owner: { login: string }
  } | null>(null)
  const [pathToCode, setPathToCode] = useState('')

  const mutation = useMutation({
    onSuccess: onDidCreateRepository,
  })

  return (
    <View grow>
      <Scroll>
        <View gap="$3" p="$3">
          <View gap="$3">
            <GitHubRepoPicker selectedRepo={selectedRepo} onSelectRepo={setSelectedRepo} />

            <Card>
              <Input
                placeholder="Path to code (optional)"
                value={pathToCode}
                onChangeText={setPathToCode}
              />
              <Text color="$color11">For example: all/templates</Text>
            </Card>

            <ErrorCard error={mutation.error} />
            <Button
              loading={mutation.isPending}
              disabled={!selectedRepo}
              onPress={async () => {
                if (!selectedRepo) return
                mutation.mutate({
                  profile_id: profileId,
                  github_repo_name: selectedRepo.name,
                  github_repo_owner: selectedRepo.owner.login,
                  path_to_code: pathToCode,
                })
              }}
              themeInverse
            >
              <ButtonText>Create Repository</ButtonText>
            </Button>
          </View>
        </View>
      </Scroll>
    </View>
  )
}
