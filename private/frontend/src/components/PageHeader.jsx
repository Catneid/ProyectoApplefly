import "./PageHeader.css";

const PageHeader = ({ title, subtitle, action }) => (
  <div className="page-header">
    <div>
      <h1 className="page-header__title">{title}</h1>
      {subtitle && <p className="page-header__sub">{subtitle}</p>}
    </div>
    {action && <div className="page-header__action">{action}</div>}
  </div>
);

export default PageHeader;
