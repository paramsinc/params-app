import {
  FormProvider,
  useForm,
  useWatch,
  useFormState,
  useFormContext,
  Path,
  ControllerProps,
  Controller,
  UseFormProps,
  UseFormReturn,
  FormProviderProps,
  useController,
  DeepPartialSkipArrayKey,
  UseControllerProps,
  useFieldArray,
  FieldArrayPath,
  UseFieldArrayProps,
} from 'react-hook-form'
import { Platform } from 'react-native'
import DevTool from './devtools'
import { Target, useScrollTo } from '@nandorojo/anchor'
import { useEffect, useImperativeHandle, useRef } from 'react'
import { ulid } from 'ulid'

const makeForm = <FormState extends object>() => {
  const Provider = (
    props: FormProviderProps<FormState> & {
      devtools?: boolean
    }
  ) => {
    return (
      <FormProvider<FormState> {...props}>
        {props.children}
        {Platform.select({
          web: props.devtools && <DevTool control={props.control} />,
        })}
      </FormProvider>
    )
  }
  function useDirtySubmit(form: UseFormReturn<FormState>) {
    const handleDirtySubmit: UseFormReturn<Partial<FormState>>['handleSubmit'] = (onSubmit) => {
      const {
        formState: { dirtyFields },
        getValues,
      } = form
      return form.handleSubmit((_, e) => {
        function getDirtyFields() {
          const values = getValues()
          const next = {} as Partial<FormState>
          for (const key in dirtyFields) {
            // @ts-expect-error
            next[key] = values[key]
          }
          console.log('[get-dirty-fields]', dirtyFields)
          return next
        }
        return onSubmit(getDirtyFields(), e)
      })
    }

    return handleDirtySubmit
  }
  return {
    Controller: function CustomController<Name extends Path<FormState> = Path<FormState>>({
      disableScrollToError: disableScrollToError,
      ...props
    }: ControllerProps<FormState, Name> & {
      disableScrollToError?: boolean
    }) {
      const { control } = useFormContext<FormState>()
      const controller = useController({ ...props, control })

      const { scrollTo } = useScrollTo()
      useImperativeHandle(!disableScrollToError ? controller.field.ref : undefined, () => {
        return {
          focus() {
            // could this lead to infinite loops?
            // if (
            //   controller.field.ref &&
            //   'focus' in controller.field.ref &&
            //   typeof controller.field.ref.focus === 'function'
            // ) {
            //   controller.field.ref?.focus?.()
            // }
            scrollTo(props.name)
          },
        }
      })

      const ctr = <Controller<FormState, Name> {...props} />
      return <>{!disableScrollToError ? <Target name={props.name}>{ctr}</Target> : ctr}</>
    },
    useFieldArray: <
      TFieldArrayName extends FieldArrayPath<FormState>,
      TKeyName extends string = 'id'
    >(
      props: UseFieldArrayProps<FormState, TFieldArrayName, TKeyName>
    ) =>
      useFieldArray<FormState, TFieldArrayName, TKeyName>({
        control: useFormContext<FormState>().control,
        ...props,
      }),
    FormProvider: Provider,
    useForm: (props?: UseFormProps<FormState>) => {
      const form = useForm<FormState>(props)

      return {
        ...form,
        handleDirtySubmit: useDirtySubmit(form),
      }
    },
    useWatch: () =>
      useWatch<FormState>({
        control: useFormContext<FormState>().control,
      }),
    Watch({
      render,
    }: {
      render: (props: DeepPartialSkipArrayKey<FormState>) => React.ReactElement
    }) {
      return <>{render(useWatch<FormState>())}</>
    },
    useFormContext: () => {
      const context = useFormContext<FormState>()

      return Object.assign({}, context, {
        handleDirtySubmit: useDirtySubmit(context),
      })
    },
    useController: <Name extends Path<FormState> = Path<FormState>>(
      props: UseControllerProps<FormState, Name>
    ) => {
      return useController({
        control: useFormContext<FormState>()?.control,
        ...props,
      })
    },
    Submit({
      children,
    }: {
      children: (
        props: Pick<
          ReturnType<typeof useFormState<FormState>>,
          'isDirty' | 'isValid' | 'isSubmitting' | 'isSubmitSuccessful' | 'submitCount' | 'errors'
        > & {
          hasErrored: boolean
        } & Pick<ReturnType<typeof useFormContext<FormState>>, 'handleSubmit' | 'reset'> & {
            handleDirtySubmit: UseFormReturn<Partial<FormState>>['handleSubmit']
          }
      ) => React.ReactNode
    }) {
      const { isDirty, isSubmitting, isSubmitSuccessful, submitCount, errors } =
        useFormState<FormState>()
      const form = useFormContext<FormState>()
      const { handleSubmit, reset } = useFormContext<FormState>()
      const handleDirtySubmit = useDirtySubmit(form)
      return (
        <>
          {children({
            isDirty,
            isValid: !Object.values(errors).length,
            isSubmitting,
            isSubmitSuccessful,
            submitCount,
            errors,
            hasErrored: Object.values(errors).length > 0,
            handleSubmit,
            handleDirtySubmit,
            reset,
            //  && submitCount > 0,
          })}
        </>
      )
    },
    RootProvider({
      children,
      devtools,
      ...formProps
    }: { children: React.ReactNode } & UseFormProps<FormState> & {
        devtools?: boolean
      }) {
      const form = useForm<FormState>(formProps)

      return (
        <Provider {...form}>
          {children}
          {Platform.select({
            web: devtools && __DEV__ && <DevTool control={form.control} />,
          })}
        </Provider>
      )
    },
    useIdempotencyKey({ watch }: UseFormReturn<FormState>, deps: Array<any> = []) {
      const idempotencyKey = useRef<string | undefined>()
      useEffect(() => {
        const { unsubscribe } = watch(() => {
          idempotencyKey.current = undefined
        })

        return () => {
          unsubscribe()
        }
      }, [watch])

      useEffect(() => {
        if (deps.length && idempotencyKey.current) {
          idempotencyKey.current = undefined
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, deps)

      return {
        getIdempotencyKeyOnSubmit(): string {
          idempotencyKey.current ??= ulid()

          return idempotencyKey.current
        },
      }
    },
  }
}

export type GetFormState<Form> = Form extends ReturnType<typeof makeForm>
  ? ReturnType<Form['useWatch']>
  : never

export { makeForm }
