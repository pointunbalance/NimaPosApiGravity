import { useI18n } from "../app/providers/I18nProvider";

type PageHeaderProps = {
  title: string;
  subtitle: string;
  actions?: React.ReactNode;
};

export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  const { messages } = useI18n();

  return (
    <header className="page-header">
      <div>
        <span className="eyebrow">{messages.shared.pageEyebrow}</span>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      {actions ? <div className="page-actions">{actions}</div> : null}
    </header>
  );
}
