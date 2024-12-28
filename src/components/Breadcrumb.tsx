import { Link } from 'react-router-dom';

interface BreadcrumbItem {
  name: string;
  path: string;
  state?: any;
}

interface BreadcrumbProps {
  pageName: string;
  currentName: string;
  breadcrumbItems: BreadcrumbItem[];
}

const Breadcrumb = ({ pageName, currentName, breadcrumbItems }: BreadcrumbProps) => {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <h2 className="text-title-md2 font-semibold text-black dark:text-white">
        {pageName}
      </h2>
      <nav>
        <ol className="flex items-center gap-2">
          {breadcrumbItems.map((item, index) => (
            <li key={index} className="flex items-center gap-2">
              {index < breadcrumbItems.length - 1 ? (
                <>
                  <Link
                    to={item.path}
                    state={item.state}
                    className="text-body hover:text-primary"
                  >
                    {item.name}
                  </Link>
                  <span className="text-body">/</span>
                </>
              ) : (
                <span className="text-primary">{item.name}</span>
              )}
            </li>
          ))}
        </ol>
      </nav>
    </div>
  );
};

export default Breadcrumb;
