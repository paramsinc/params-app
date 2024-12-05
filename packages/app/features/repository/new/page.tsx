import { Button, ButtonIcon } from 'app/ds/Button'
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
import { useEffect, useState } from 'app/react'
import { NewProfileForm } from 'app/features/profile/new/form'
import { NewProfileModal, NewProfileModalContent } from 'app/features/profile/new/modal'
import { imageLoader } from 'app/image/loader'
import useToast from 'app/ds/Toast'
import { useRouter } from 'app/navigation/use-router'
import { ProfileMembers } from 'app/features/profile/detail/ProfileMembers'
import { Badge } from 'app/ds/Badge'
import { env } from 'app/env'
import { Switch } from 'app/ds/Switch'
import {
  RepoAllowBookingForMainProfileField,
  RepoAllowBookingForMemberPersonalProfilesField,
} from 'app/features/repository/new/fields/allow-booking'
import { ProfilePicker } from 'app/features/profile/picker'
import {
  CreateProfileMemberModal,
  CreateProfileMemberModalContent,
  CreateProfileMemberModalTrigger,
} from 'app/features/profile/member/new/modal'

const { useMutation } = api.repo.createFromGithub

const Form = makeForm<{
  input: Parameters<ReturnType<typeof useMutation>['mutate']>[0] & {
    isPrivateRepo: boolean
  }
}>()

function Number({ children }: { children: number }) {
  return (
    <View box={30} bg="$color10" $theme-light={{ bg: '$color5' }} br="$rounded" center>
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
      <Form.RootProvider
        defaultValues={{
          input: {
            allow_booking_for_main_profile: true,
            allow_booking_for_member_personal_profiles: true,
          },
        }}
      >
        <Page.Root grow>
          <Scroll>
            <Page.Content gap="$3">
              <ProfilesGate>
                <Card.Title>Time to set up your Params repo</Card.Title>
                <Card.Description>
                  Create a repository, share the link, and {env.APP_NAME} lets people pay you for a
                  call to ask about your code.
                </Card.Description>
                <Transition>
                  <Card>
                    <Number>{1}</Number>
                    <Card.Title>Select your developer profile</Card.Title>
                    <Card.Description>
                      This profile will be the owner of the repo. Any members of this profile will
                      have access to edit the repo's details on {env.APP_NAME}.
                    </Card.Description>

                    <Card.Description>
                      If this repository belongs to a team, select or create a team profile below.
                    </Card.Description>
                    <ProfileField />
                  </Card>
                </Transition>
                <SelectedProfileGate>
                  <ReadyWithProfile>
                    <Transition>
                      <Card>
                        <Number>{2}</Number>
                        <Card.Title>Configure who can get booked for a call</Card.Title>
                        <WhoCanGetBooked />
                      </Card>
                    </Transition>
                  </ReadyWithProfile>
                  <ReadyWithProfile>
                    <Transition>
                      <Card>
                        <Number>{3}</Number>
                        <Card.Title>Pick the repo you want to use from GitHub.</Card.Title>
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
                                          You selected a private GitHub repo. Adding it to Params
                                          will make the code publicly accessible. Please proceed
                                          with caution.
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
                  </ReadyWithProfile>
                  <Form.Controller
                    name="input"
                    render={({ field }) => {
                      const { github_repo_name, github_repo_owner } = field.value ?? {}
                      return (
                        <MaybeReady ready={Boolean(github_repo_name && github_repo_owner)} gap="$3">
                          <Transition delay={50}>
                            <Card>
                              <Number>{4}</Number>
                              <Card.Title>Root Directory (optional)</Card.Title>
                              <Card.Description>
                                The directory within your project where your code is located. Leave
                                this field empty if your code is not located in a subdirectory.
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
                </SelectedProfileGate>
              </ProfilesGate>
            </Page.Content>
          </Scroll>
        </Page.Root>
      </Form.RootProvider>
    </UserGate>
  )
}

function ReadyWithProfile({ children }: { children: React.ReactElement }) {
  return <MaybeReady ready={useProfileId().profile_id != null}>{children}</MaybeReady>
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
        <Number>{5}</Number>
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
              $schema: 'https://params.com/params.json',
              docs: {
                main: 'README.md',
                sidebar: {
                  Introduction: 'README.md',
                  Installation: 'installation.md',
                },
                youtube: {
                  video_id: '0lnbdRweJtA',
                },
              },
              notebook_url: '',
            } satisfies Zod.infer<typeof paramsJsonShape>,
            null,
            2
          )}
        />
        <Card.Description>
          The <Text fontFamily="$mono">docs.main</Text> field should point to your readme file. For
          any other markdown files you want to include in your docs, place them in the{' '}
          <Text fontFamily="$mono">docs.sidebar</Text>.
        </Card.Description>
        <Card.Description>
          The Google Colab <Text fontFamily="$mono">notebook_url</Text> is optional.
        </Card.Description>
        <Card.Description>
          The <Text fontFamily="$mono">docs.youtube</Text> field is optional as well.
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
        ) : data?.paramsJson == null ? (
          <Text color="$yellow11">params.json file not found in your repo.</Text>
        ) : null}

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

function ProfilesGate({ children }: { children: React.ReactNode }) {
  const myProfiles = api.myProfiles.useQuery()

  if (!myProfiles.data) {
    return <ErrorCard error={myProfiles.error} />
  }

  return <>{children}</>
}

function useProfileId() {
  const { field } = Form.useController({
    name: 'input',
  })
  const myProfiles = api.myProfiles.useQuery()

  const {
    profile_id = myProfiles.data?.length === 1
      ? myProfiles.data[0]?.id
      : myProfiles.data?.length === 0
      ? null
      : undefined,
  } = field.value ?? {}

  return {
    profile_id,
    myProfiles: myProfiles.data,
    setProfileId: (next: string) =>
      field.onChange({
        ...field.value,
        profile_id: next,
      } satisfies typeof field.value),
  }
}

function ProfileField() {
  const { profile_id, setProfileId, myProfiles } = useProfileId()

  const [shouldShowMembers, setShouldShowMembers] = useState(true)

  const profile = myProfiles?.find((profile) => profile.id === profile_id)

  return (
    <View gap="$3">
      <View row="wrap" ai="center" gap="$2">
        <ProfilePicker profileId={profile_id ?? null} onChangeProfileId={setProfileId}>
          <Button>
            <Button.Text>{profile?.slug ? `@${profile.slug}` : `Select Profile`}</Button.Text>
            <ButtonIcon icon={Lucide.ChevronDown} />
          </Button>
        </ProfilePicker>
        {profile && (
          <Badge theme={profile.personal_profile_user_id ? 'purple' : 'pink'}>
            <Badge.Text>{profile.personal_profile_user_id ? 'Personal' : 'Team'}</Badge.Text>
          </Badge>
        )}
      </View>
      <View h={2} bg="$borderColor" />
      {/* <Button als="flex-start" onPress={() => setShouldShowMembers((s) => !s)}>
        <Button.Text>View Members</Button.Text>
        <ButtonIcon icon={shouldShowMembers ? Lucide.ChevronUp : Lucide.ChevronDown} />
      </Button> */}
      {profile && (
        <>
          <View gap="$3" display={shouldShowMembers ? 'flex' : 'none'}>
            <View row="wrap" ai="center" gap="$2" jbtwn>
              <Text>Profile Members</Text>

              <CreateProfileMemberModal>
                <CreateProfileMemberModalTrigger>
                  <Button>
                    <Button.Text>Add Member</Button.Text>
                  </Button>
                </CreateProfileMemberModalTrigger>

                <CreateProfileMemberModalContent profileId={profile.id} />
              </CreateProfileMemberModal>
            </View>
            <ProfileMembers profileSlug={profile.slug} />
          </View>
        </>
      )}
    </View>
  )
}

function SelectedProfileGate({ children }: { children: React.ReactNode }) {
  const { profile_id, myProfiles } = useProfileId()
  const profile = myProfiles?.find((profile) => profile.id === profile_id)
  const membersQuery = useProfileMembers()
  if (!profile) {
    return null
  }

  if (!membersQuery.data) {
    return <ErrorCard error={membersQuery.error} />
  }

  return <>{children}</>
}

function Submit() {
  const { toast } = useToast()
  const myProfiles = api.myProfiles.useQuery()
  const router = useRouter()
  const mutation = useMutation({
    onSuccess: ({ profile, repo }) => {
      toast({
        preset: 'done',
        title: 'Repository added!',
        message: 'Redirecting...',
      })
      router.push(`/@${profile.slug}/${repo.slug}`)
    },
  })
  const { field } = Form.useController({
    name: 'input',
  })
  const { profile_id } = useProfileId()

  const { github_repo_owner = '', github_repo_name = '' } = field.value ?? {}

  const selectedProfile = myProfiles.data?.find((profile) => profile.id === profile_id)

  return (
    <Card>
      <Number>{6}</Number>
      <Card.Title>Save</Card.Title>
      <Card.Description>
        Your repository is ready to be added to Params once the params.json is verified.
      </Card.Description>

      <ErrorCard error={mutation.error} />
      <ErrorCard error={myProfiles.error} />

      <Form.Submit>
        {({ handleSubmit }) => (
          <Button
            themeInverse
            loading={mutation.isPending}
            disabled={
              !github_repo_owner ||
              !github_repo_name ||
              !myProfiles.data ||
              profile_id === undefined
            }
            als="flex-start"
            onPress={handleSubmit(
              async ({
                input: {
                  github_repo_owner,
                  github_repo_name,
                  path_to_code,
                  allow_booking_for_main_profile,
                  allow_booking_for_member_personal_profiles,
                },
              }) => {
                if (!profile_id) {
                  return
                }
                await mutation.mutateAsync({
                  github_repo_owner,
                  github_repo_name,
                  path_to_code,
                  profile_id,
                  allow_booking_for_main_profile,
                  allow_booking_for_member_personal_profiles,
                })
              }
            )}
          >
            <Button.Text>Save Repo</Button.Text>
          </Button>
        )}
      </Form.Submit>
    </Card>
  )
}

function useProfileMembers() {
  const { profile_id, myProfiles } = useProfileId()
  const profile = myProfiles?.find((profile) => profile.id === profile_id)
  return api.profileMembersBySlug.useQuery(
    { profile_slug: profile?.slug ?? '' },
    { enabled: Boolean(profile_id) }
  )
}

function WhoCanGetBooked() {
  const { profile_id, myProfiles } = useProfileId()

  const profile = myProfiles?.find((profile) => profile.id === profile_id)

  const membersQuery = useProfileMembers()

  const allowBookingForMainProfile = Form.useController({
    name: 'input.allow_booking_for_main_profile',
  })

  const allowBookingForMemberPersonalProfiles = Form.useController({
    name: 'input.allow_booking_for_member_personal_profiles',
  })

  if (!profile) {
    return null
  }

  return (
    <>
      <RepoAllowBookingForMainProfileField
        profileSlug={profile.slug}
        value={allowBookingForMainProfile.field.value ?? false}
        onChange={allowBookingForMainProfile.field.onChange}
      />

      {profile.personal_profile_user_id == null && (
        <RepoAllowBookingForMemberPersonalProfilesField
          profileSlug={profile.slug}
          value={allowBookingForMemberPersonalProfiles.field.value ?? false}
          onChange={allowBookingForMemberPersonalProfiles.field.onChange}
        />
      )}
    </>
  )
}
