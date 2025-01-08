import { OrganizationPlan } from 'src/api/model';
import { PaymentDialog } from 'src/components/payment-form';
import { createTranslate } from 'src/intl/translate';

const T = createTranslate('modules.serviceForm');

type ServiceFormPaymentDialogProps = {
  requiredPlan?: OrganizationPlan;
  onClose: () => void;
  submitForm: () => void;
};

export function ServiceFormPaymentDialog({
  requiredPlan,
  onClose,
  submitForm,
}: ServiceFormPaymentDialogProps) {
  return (
    <PaymentDialog
      open={requiredPlan !== undefined}
      onClose={onClose}
      plan={requiredPlan}
      onPlanChanged={() => {
        onClose();

        // re-render with new organization plan before submitting
        setTimeout(submitForm, 0);
      }}
      title={<T id="paymentDialog.title" />}
      description={
        <T
          id="paymentDialog.description"
          values={{
            plan: <span className="capitalize text-green">{requiredPlan}</span>,
            price: requiredPlan === 'starter' ? 0 : 79,
          }}
        />
      }
      submit={<T id="paymentDialog.submitButton" />}
    />
  );
}
