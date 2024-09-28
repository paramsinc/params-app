When building forms to create something new, reference:

- @packages/app/features/profile/new/form.tsx for the actual form
- @packages/app/features/profile/new/fields.tsx for the headless fields
- @packages/app/features/profile/new/modal.tsx for the modal that wraps the form itself

Similarly, when building forms to update something, reference:

- @packages/app/features/profile/update/form.tsx for the actual form
- Update form needs a modal the same way the create form does
- Notice that the update form has the option to delete the current item as well. It also has an onSuccess callback that gets passed to the form.

To see which mutations/queries are available reference @packages/app/trpc/api.ts, which is our tRPC API. Only pick from the available routes.

To see the fields used in the db, reference @packages/app/db/schema.ts. This part is extremely important. In order to understand the shape of the data, do the following:

1. Find the relevant mutation route from TRPC.
2. Reference its "input" type.
3. If if uses "pick" or select, then it's picking fields from the db schema.
4. Any form fields you create should be based on these inputs only.

The purpose of the modal is to build a compound set of react components that "modalize" any form. Refernece @packages/app/ds/Modal to see how it works under the hood, and the form examples above.

- The modal tends to do 2 things based on the form callbacks: close the modal, and show some sort of success toast for the form.

It's imperative to always show good errors based on network issues. You can use <ErrorCard /> for this, which comes from @packages/app/ds/ErrorCard.

Here are other files that serve as references for create and update forms.

The update form will almost always share the headless fields built with the new form. The purpose of those fields is to work for both create and update forms. However, it's important that they don't actually have any awareness of the form itself. Instead, they just receive a prop and a callback, along with possibly an error. They just dumb render. Sometimes the update form will have forms that the create doesn't have, and sometimes the create will have fields that the update doesn't have (one general example might be confirming Terms of Service).

All forms should generally have this pattern. First, you set up the makeForm based on the useMutation function.

Next, you initialize the provider. Finally, you render the fields.

Submit should always be wrapped inside of Form.Submit.

Update forms tend to be more complex than create forms, since they often need to fetch the current values to set defaults. Also, update forms should use handleDirtySubmit. If you do need to fetch the current values, be sure to 1) ignore the cache, so that we don't fetch stale values, and 2) avoid rendering the form provider until you have the current values.

It's important that the query that powers a form is not fetched outside of modal content, as this will fetch it before the modal is opened. We purposefully want to delay the rendering of the form until the modal is opened, and thus fetch the data only after the modal is opened.

We also split the form UI out from the modal so that it can be used in other contexts, like inline somewhere, or directly on a page.

All form states are using react-hook-form under the hook. Reference @packages/app/form/index.tsx to see it.

For UI components like Text or Button, etc, be sure to only import from app/ds' nested folders (aka @packages/app/ds/Text, @packages/app/ds/Button, etc). However, for forms, you will also find yourself using FormCard as basically the only UI component, with some exceptions.
