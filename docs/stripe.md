# Stripe

The project uses [Stripe](https://stripe.com) for payment collection and billing management. The integration is frontend-only — the backend manages subscriptions, webhooks, and the Stripe Customer Portal URL. The frontend collects card details via Stripe Elements, confirms payments via the Stripe.js SDK, and displays billing data from the API.

## Dependencies

- **@stripe/stripe-js**: Stripe.js SDK
- **@stripe/react-stripe-js**: React bindings

Configured via the `VITE_STRIPE_PUBLIC_KEY` environment variable (the Stripe publishable key).

## Initialization

`StripeProvider` in `src/application/stripe.tsx` lazy-loads Stripe.js and wraps its children with the `<Elements>` provider:

If loading fails after multiple retries, the error is reported to Sentry and shown as a toast. If no key is configured (development without Stripe), it returns `null` and the Elements context is inert.

`StripeProvider` is not mounted globally. It wraps only the components that need it: the onboarding payment page, the upgrade dialog, and the trial-ended modal.

## Card collection

Card details are collected using Stripe Elements rendered in `PaymentFormFields` (`src/components/payment-form.tsx`). The elements support light and dark themes.

The submission flow is orchestrated by `usePaymentMethodMutation` in `src/hooks/stripe.ts`:

1. `POST /v1/payment_methods` — creates a payment method record on the backend, which returns a Stripe PaymentIntent `client_secret`
2. `stripe.confirmCardPayment(clientSecret, { payment_method: { card } })` — confirms the card with Stripe
3. `POST /v1/payment_methods/{id}/confirm` — tells the backend that confirmation succeeded
4. Polls `GET /v1/account/organization` checking `has_payment_method` for a few seconds (the backend updates this field asynchronously via a Stripe webhook)

Stripe errors are classified by type: `validation_error` and `card_error` are shown as toast notifications, other errors are reported to Sentry.

## Payment form

`PaymentForm` in `src/components/payment-form.tsx` is the full payment form used across the app. It combines:

- Card input fields (Stripe Elements)
- Billing address (`AddressField` — custom component using Mapbox, not Stripe's `AddressElement`)
- Optional coupon code input (validated in real-time via `GET /v1/coupons/{code}`)
- Optional billing alert amount

On submit, it runs several API calls in sequence:

1. `PATCH /v1/organizations/{id}` — saves billing address
2. `usePaymentMethodMutation` — submits the card (see flow above)
3. `POST /v1/organizations/{id}/plan` — upgrades the plan (with optional coupon)
4. `PUT /v1/organizations/{id}/budget` — sets the spending alert
