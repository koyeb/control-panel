import { useRef, useState } from 'react';
import { FormProvider } from 'react-hook-form';

import { Button } from '@koyeb/design-system';
import { useInstancesQuery, useRegionsQuery } from 'src/api/hooks/catalog';
import { useOrganizationSummary } from 'src/api/hooks/session';
import { DatabaseDeployment, OrganizationPlan } from 'src/api/model';
import { Dialog } from 'src/components/dialog';
import { UpgradeDialog } from 'src/components/payment-form';
import { handleSubmit } from 'src/hooks/form';
import { createTranslate, Translate, TranslateEnum } from 'src/intl/translate';

import { DatabaseEngineSection } from './sections/01-database-engine.section';
import { InstanceSection } from './sections/02-instance.section';
import { DefaultRoleSection } from './sections/03-default-role.section';
import { ServiceNameSection } from './sections/04-service-name.section';
import { useDatabaseServiceForm } from './use-database-service-form';
import { useSubmitDatabaseServiceForm } from './use-submit-database-service-form';

const T = createTranslate('modules.databaseForm');

type DatabaseFormProps = {
  deployment?: DatabaseDeployment;
  onCostChanged: (cost: number) => void;
};

export function DatabaseForm(props: DatabaseFormProps) {
  const regionsQuery = useRegionsQuery();
  const instancesQuery = useInstancesQuery();
  useOrganizationSummary();

  if (regionsQuery.isPending || instancesQuery.isPending) {
    return null;
  }

  return <DatabaseForm_ {...props} />;
}

function DatabaseForm_({ deployment, onCostChanged }: DatabaseFormProps) {
  const form = useDatabaseServiceForm({ deployment, onCostChanged });
  const openDialog = Dialog.useOpen();

  const [requiredPlan, setRequiredPlan] = useState<OrganizationPlan>();
  const formRef = useRef<HTMLFormElement>(null);

  const onSubmit = useSubmitDatabaseServiceForm(form, (plan) => {
    setRequiredPlan(plan);
    openDialog('Upgrade', { plan });
  });

  return (
    <FormProvider {...form}>
      <form ref={formRef} className="col gap-8" onSubmit={handleSubmit(form, onSubmit)}>
        <div className="rounded-lg border">
          {deployment == undefined && <DatabaseEngineSection />}
          <InstanceSection />
          {deployment == undefined && <DefaultRoleSection />}
          <ServiceNameSection />
        </div>

        <Button type="submit" loading={form.formState.isSubmitting} className="self-start">
          {deployment ? <Translate id="common.save" /> : <Translate id="common.create" />}
        </Button>

        <UpgradeDialog
          plan={requiredPlan}
          onPlanChanged={() => {
            // re-render with new organization plan before submitting
            setTimeout(() => formRef.current?.requestSubmit(), 0);
          }}
          title={<T id="upgradeDialog.title" />}
          description={
            <T
              id="upgradeDialog.description"
              values={{
                plan: (
                  <span className="text-green">
                    {requiredPlan && <TranslateEnum enum="plans" value={requiredPlan} />}
                  </span>
                ),
              }}
            />
          }
          submit={<T id="upgradeDialog.submitButton" />}
        />
      </form>
    </FormProvider>
  );
}
