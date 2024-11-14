import { Button } from 'app/ds/Button'
import { Card } from 'app/ds/Form/layout'
import { Modal } from 'app/ds/Modal'
import { Page } from 'app/ds/Page'
import { Scroll } from 'app/ds/Scroll'
import { View } from 'app/ds/View'
import { GitHubRepoPicker } from 'app/features/repository/new/github-repo-picker'
import { UserGate } from 'app/features/user/gate'
import { makeForm } from 'app/form'
import { MotiView } from 'moti'
import { api } from 'app/trpc/client'
import { Text } from 'app/ds/Text'
import { Lucide } from 'app/ds/Lucide'
import { styled } from 'app/ds/styled'
import { Input } from 'app/ds/Input'
import { Codeblock } from 'app/ds/Codeblock'
import { paramsJsonShape } from 'app/features/spec/params-json-shape'
import useDebounce from 'app/helpers/use-debounce'
import { ErrorCard } from 'app/ds/Error/card'
import { DropdownMenu } from 'app/ds/DropdownMenu'
import { useState } from 'app/react'
import { NewProfileForm } from 'app/features/profile/new/form'
import { NewProfileModal, NewProfileModalContent } from 'app/features/profile/new/modal'
import { imageLoader } from 'app/image/loader'
import useToast from 'app/ds/Toast'
import { useRouter } from 'app/navigation/use-router'

const { useMutation } = api.repo.createFromGithub

const Form = makeForm<{
  input: Parameters<ReturnType<typeof useMutation>['mutate']>[0] & {
    isPrivateRepo: boolean
  }
}>()

function Number({ children }: { children: number }) {
  return (
    <View box={30} bg="$color10" br="$rounded" center>
      <Text color="$color12" bold fontFamily="$mono">
        {children}
      </Text>
    </View>
  )
}

function Transition({ children, delay }: { children: React.ReactNode; delay?: number }) {
  return (
    <MotiView
      from={{ opacity: 0, scale: 0.98, translateY: 5 }}
      animate={{ opacity: 1, scale: 1, translateY: 0 }}
      delay={delay}
      style={{ transformOrigin: 'bottom' }}
    >
      {children}
    </MotiView>
  )
}

const MaybeReady = styled(View, {
  variants: {
    ready: {
      false: {
        pointerEvents: 'box-only',
        opacity: 0.7,
        cursor: 'not-allowed',
      },
    },
  } as const,
})

export function NewRepositoryPage() {
  return (
    <UserGate>
      <Form.RootProvider>
        <View grow>
          <Scroll centerContent>
            <Page.Content maw={800} gap="$3">
              <Card.Title>Time to set up your Params repo</Card.Title>
              <Transition>
                <Card>
                  <Number>{1}</Number>
                  <Card.Description>
                    To start, pick the repo you want to use from GitHub.
                  </Card.Description>
                  <Form.Controller
                    disableScrollToError
                    name="input"
                    render={({ field }) => {
                      const { github_repo_name, github_repo_owner, isPrivateRepo } =
                        field.value ?? {}
                      return (
                        <Modal>
                          {github_repo_name && github_repo_owner ? (
                            <>
                              <View
                                row
                                jbtwn
                                ai="center"
                                p="$2"
                                br="$3"
                                bg="$color2"
                                bw={1}
                                boc="$borderColor"
                                theme="green"
                                gap="$3"
                              >
                                <Lucide.CheckCircle size={16} color="$color10" />
                                <View flex={1}>
                                  <Text color="$color11">{`${github_repo_owner}/${github_repo_name}`}</Text>
                                  <Text>Repo selected</Text>
                                </View>
                                <Modal.Trigger>
                                  <Button>
                                    <Button.Text>Change</Button.Text>
                                  </Button>
                                </Modal.Trigger>
                              </View>
                              {isPrivateRepo && (
                                <View
                                  p="$2"
                                  theme="yellow"
                                  bg="$color2"
                                  bw={1}
                                  boc="$borderColor"
                                  row
                                  gap="$3"
                                  ai="center"
                                  br="$3"
                                >
                                  <Lucide.AlertTriangle color="$color10" size={16} />
                                  <Text flex={1} color="$color11">
                                    You selected a private GitHub repo. Adding it to Params will
                                    make the code publicly accessible. Please proceed with caution.
                                  </Text>
                                </View>
                              )}
                            </>
                          ) : (
                            <Modal.Trigger>
                              <Button themeInverse als="flex-start">
                                <Button.Text>Choose Github Repo</Button.Text>
                              </Button>
                            </Modal.Trigger>
                          )}

                          <Modal.Content>
                            <Modal.Backdrop />
                            <Modal.Dialog>
                              <Modal.Dialog.HeaderSmart title="Github Repo" />
                              <Scroll p="$3">
                                <View gap="$3">
                                  <Modal.Trigger>
                                    {({ onOpenChange }) => (
                                      <GitHubRepoPicker
                                        onSelectRepo={(next) => {
                                          field.onChange({
                                            ...field.value,
                                            github_repo_name: next.name,
                                            github_repo_owner: next.owner.login,
                                            isPrivateRepo: next.private,
                                          } satisfies typeof field.value)
                                          onOpenChange(false)
                                        }}
                                        selectedRepo={
                                          (github_repo_name &&
                                            github_repo_owner && {
                                              name: github_repo_name,
                                              owner: { login: github_repo_owner },
                                            }) ||
                                          null
                                        }
                                      />
                                    )}
                                  </Modal.Trigger>
                                </View>
                              </Scroll>
                            </Modal.Dialog>
                          </Modal.Content>
                        </Modal>
                      )
                    }}
                  />
                </Card>
              </Transition>
              <Form.Controller
                name="input"
                render={({ field }) => {
                  const { github_repo_name, github_repo_owner } = field.value ?? {}
                  return (
                    <MaybeReady ready={Boolean(github_repo_name && github_repo_owner)} gap="$3">
                      <Transition delay={50}>
                        <Card>
                          <Number>{2}</Number>
                          <Card.Title>Root Directory (optional)</Card.Title>
                          <Card.Description>
                            The directory within your project where your code is located. Leave this
                            field empty if your code is not located in a subdirectory.
                          </Card.Description>

                          <Input
                            value={field.value?.path_to_code ?? ''}
                            onChangeText={(next) => {
                              field.onChange({
                                ...field.value,
                                path_to_code: next,
                              } satisfies typeof field.value)
                            }}
                          />
                        </Card>
                      </Transition>

                      <Transition delay={100}>
                        <ParamsJson />
                      </Transition>
                    </MaybeReady>
                  )
                }}
              />
            </Page.Content>
          </Scroll>
        </View>
      </Form.RootProvider>
    </UserGate>
  )
}

function ParamsJson() {
  const mutation = useMutation()
  const {
    field: { value: { github_repo_owner = '', github_repo_name = '', path_to_code } = {} },
  } = Form.useController({
    name: 'input',
  })
  const paramsJsonQuery = api.github.paramsJson.useMutation()
  const { data } = paramsJsonQuery
  if (data?.missing_github_integration === true) {
    return null
  }
  return (
    <View gap="$3">
      <Card>
        <Number>{3}</Number>
        <Card.Title>
          Add a <Text fontFamily="$mono">params.json</Text> file to the root of your repo
        </Card.Title>
        {path_to_code ? (
          <Card.Description>
            Add the file to{' '}
            <Text fontFamily="$mono">{[path_to_code, 'params.json'].join('/')}</Text>
          </Card.Description>
        ) : null}
        <Card.Description>Example:</Card.Description>
        <Codeblock
          language={'json'}
          content={JSON.stringify(
            {
              docs: {
                main: 'readme.md',
                sidebar: {
                  Installation: 'installation.md',
                },
              },
            } satisfies Zod.infer<typeof paramsJsonShape>,
            null,
            2
          )}
        />
        <Card.Description>
          The <Text fontFamily="$mono">docs.main</Text> field should point to your readme file. For
          any other markdown files you want to include in your docs, place them in the{' '}
          <Text fontFamily="$mono">docs.sidebar</Text> (or leave it empty{' '}
          <Text fontFamily="$mono">{`{}`}</Text>).
        </Card.Description>
        <Card.Description>
          After you add the <Text fontFamily="$mono">params.json</Text> file and push it to your
          default branch, press refresh below.
        </Card.Description>
        <View h={2} bg="$color7" />

        {data?.paramsJson?.is_valid === true ? (
          <Card theme="green" row ai="center">
            <View flex={1} gap="$2">
              <Text>
                <Text fontFamily="$mono">params.json</Text> file detected!
              </Text>
              <Text>Continue to the submit step below.</Text>
            </View>

            <Modal>
              <Modal.Trigger>
                <Button als="flex-start">
                  <Button.Text>View</Button.Text>
                </Button>
              </Modal.Trigger>
              <Modal.Content>
                <Modal.Backdrop />
                <Modal.Dialog>
                  <Modal.Dialog.HeaderSmart title="params.json" />
                  <Scroll p="$3">
                    <Codeblock
                      language="json"
                      content={JSON.stringify(data.paramsJson.json, null, 2)}
                    />
                  </Scroll>
                </Modal.Dialog>
              </Modal.Content>
            </Modal>
          </Card>
        ) : data?.paramsJson?.is_valid === false ? (
          <>
            <Card theme="red">
              <Text>
                <Text fontFamily="$mono">params.json</Text> file detected, but it is invalid.
              </Text>
            </Card>
            <Codeblock language="json" content={data.paramsJson.invalid_json_string} />
          </>
        ) : (
          <></>
        )}

        <ErrorCard error={paramsJsonQuery.error} />

        <Button
          loading={paramsJsonQuery.isPending}
          onPress={() =>
            paramsJsonQuery.mutate({
              github_repo_owner,
              github_repo_name,
              path_to_code,
            })
          }
          disabled={!github_repo_owner || !github_repo_name}
          als="flex-start"
          themeInverse={data?.paramsJson?.is_valid !== true}
        >
          <Button.Text>Refresh params.json</Button.Text>
        </Button>
      </Card>
      <MaybeReady ready={data?.paramsJson?.is_valid === true}>
        <Submit />
      </MaybeReady>
    </View>
  )
}

function Submit() {
  const { toast } = useToast()
  const myProfiles = api.myProfiles.useQuery()
  const router = useRouter()
  const mutation = useMutation({
    onSuccess: ({ slug }) => {
      toast({
        preset: 'done',
        title: 'Repository added!',
      })
      router.push()
    },
  })
  const { field } = Form.useController({
    name: 'input',
  })

  const {
    github_repo_owner = '',
    github_repo_name = '',
    path_to_code,
    profile_id = myProfiles.data?.length === 1
      ? myProfiles.data[0]?.id
      : myProfiles.data?.length === 0
      ? null
      : undefined,
  } = field.value ?? {}

  const selectedProfile = myProfiles.data?.find((profile) => profile.id === profile_id)

  return (
    <Card>
      <Number>{4}</Number>
      <Card.Title>Save</Card.Title>
      <Card.Description>Your repository is ready to be added to Params.</Card.Description>

      <ErrorCard error={mutation.error} />
      <ErrorCard error={myProfiles.error} />

      {(myProfiles.data?.length ?? 0) > 0 && (
        <View ai="flex-start">
          <ProfilePicker
            profileId={profile_id ?? null}
            onChangeProfileId={(id) => {
              field.onChange({
                ...field.value,
                profile_id: id,
              } satisfies typeof field.value)
            }}
          >
            <Button als="flex-start">
              <Button.Text>{selectedProfile?.name ?? 'Select Profile'}</Button.Text>
              <Button.Icon icon={Lucide.ChevronDown} />
            </Button>
          </ProfilePicker>
        </View>
      )}

      <Button
        themeInverse
        loading={mutation.isPending}
        disabled={
          !github_repo_owner || !github_repo_name || !myProfiles.data || profile_id === undefined
        }
        als="flex-start"
        onPress={() =>
          mutation.mutate({
            github_repo_owner,
            github_repo_name,
            path_to_code,
            profile_id: profile_id!,
          })
        }
      >
        <Button.Text>Save</Button.Text>
      </Button>
    </Card>
  )
}

function ProfilePicker({
  profileId,
  onChangeProfileId,
  children,
}: {
  profileId: string | null
  onChangeProfileId: (profileId: string) => void
  children: React.ReactElement
}) {
  const myProfiles = api.myProfiles.useQuery()

  const [isCreatingProfile, setIsCreatingProfile] = useState(false)

  return (
    <DropdownMenu>
      <DropdownMenu.Trigger>{children}</DropdownMenu.Trigger>
      <DropdownMenu.Content>
        <DropdownMenu.Label>Select a profile</DropdownMenu.Label>
        <DropdownMenu.Group>
          {myProfiles.data?.map((profile) => {
            const loader = profile.image_vendor ? imageLoader[profile.image_vendor] : undefined
            return (
              <DropdownMenu.CheckboxItem
                key={profile.id}
                value={profile.id === profileId}
                onValueChange={(value) => onChangeProfileId(profile.id)}
              >
                <DropdownMenu.ItemTitle>{profile.name}</DropdownMenu.ItemTitle>
                {loader && !!profile.image_vendor_id && (
                  <DropdownMenu.ItemImage
                    source={loader({ src: profile.image_vendor_id, width: 100 })}
                  />
                )}
              </DropdownMenu.CheckboxItem>
            )
          })}
        </DropdownMenu.Group>
        <DropdownMenu.Separator />
        <DropdownMenu.Item key="create-new-profile" onSelect={() => setIsCreatingProfile(true)}>
          <DropdownMenu.ItemIcon icon={Lucide.Plus} />
          <DropdownMenu.ItemTitle>Create new profile</DropdownMenu.ItemTitle>
        </DropdownMenu.Item>
      </DropdownMenu.Content>

      <NewProfileModal open={isCreatingProfile} onOpenChange={setIsCreatingProfile}>
        <NewProfileModalContent
          onDidCreateProfile={({ profile }) => {
            onChangeProfileId(profile.id)
            setIsCreatingProfile(false)
          }}
        />
      </NewProfileModal>
    </DropdownMenu>
  )
}
