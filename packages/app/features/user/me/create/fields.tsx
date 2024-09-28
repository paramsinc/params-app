import { FormCard } from 'app/ds/Form/layout'
import { Input } from 'app/ds/Input'
import { View } from 'app/ds/View'
import { env } from 'app/env'
import useDebounce from 'app/helpers/use-debounce'
import { slugify } from 'app/trpc/slugify'
import { api } from 'app/trpc/client'

export const UserFirstNameField = ({
  firstName,
  onChange,
  error,
  inputRef,
}: {
  firstName: string
  onChange: (firstName: string) => void
  error?: { message?: string }
  inputRef: any
}) => {
  return (
    <FormCard theme={error ? 'red' : undefined}>
      <FormCard.Label>First Name</FormCard.Label>
      <Input
        onChangeText={onChange}
        value={firstName}
        placeholder="Enter your first name"
        ref={inputRef}
      />
    </FormCard>
  )
}

export const UserLastNameField = ({
  lastName,
  onChange,
  error,
  inputRef,
}: {
  lastName: string
  onChange: (lastName: string) => void
  error?: { message?: string }
  inputRef: any
}) => {
  return (
    <FormCard theme={error ? 'red' : undefined}>
      <FormCard.Label>Last Name</FormCard.Label>
      <Input
        onChangeText={onChange}
        value={lastName}
        placeholder="Enter your last name"
        ref={inputRef}
      />
    </FormCard>
  )
}

export const UserEmailField = ({
  email,
  onChange,
  error,
  inputRef,
}: {
  email: string
  onChange: (email: string) => void
  error?: { message?: string }
  inputRef: any
}) => {
  return (
    <FormCard theme={error ? 'red' : undefined}>
      <FormCard.Label>Email</FormCard.Label>
      <Input
        onChangeText={onChange}
        value={email}
        placeholder="Enter your email"
        keyboardType="email-address"
        ref={inputRef}
      />
    </FormCard>
  )
}
