import { UpgradeDialog } from 'src/components/payment-form';
import { TranslateEnum, createTranslate } from 'src/intl/translate';
import { OrganizationPlan } from 'src/model';

const T = createTranslate('modules.serviceForm');

type ServiceFormUpgradeDialogProps = {
  plan?: OrganizationPlan;
  submitForm: () => void;
};

export function ServiceFormUpgradeDialog({ plan, submitForm }: ServiceFormUpgradeDialogProps) {
  return (
    <UpgradeDialog
      plan={plan}
      // re-render with new organization plan before submitting
      onPlanChanged={() => setTimeout(submitForm, 0)}
      title={<T id="upgradeDialog.title" />}
      description={
        <T
          id="upgradeDialog.description"
          values={{
            plan: <span className="text-green">{plan && <TranslateEnum enum="plans" value={plan} />}</span>,
          }}
        />
      }
      submit={<T id="upgradeDialog.submitButton" />}
    />
  );
}
