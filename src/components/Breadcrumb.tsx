import { Link } from 'react-router-dom';

interface BreadcrumbProps {
  pageName: string;
  parentPath?: string;
  parentName?: string;
  parentPath2?: string;
  parentName2?: string;
  currentName?: string;
}

const Breadcrumb = ({ pageName, parentPath, parentName, parentPath2, parentName2, currentName }: BreadcrumbProps) => {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-8">
        <h2 className="text-title-md2 font-semibold text-black dark:text-white">
          {pageName}
        </h2>

        {pageName.includes('Question Bank') && (
          <button className="inline-flex items-center justify-center rounded-md bg-primary py-2 px-6 text-center font-medium text-white hover:bg-opacity-90">
            Pagination
          </button>
        )}
      </div>

      <nav>
        <ol className="flex items-center gap-2">
          <li>
            <Link to="/" className="text-[#64748B] hover:text-primary">Home Page</Link>
          </li>

          {parentPath && parentName && (
            <>
              <span className="text-[#64748B]">/</span>
              <li>
                <Link to={parentPath} className="text-[#64748B] hover:text-primary">{parentName}</Link>
              </li>
            </>
          )}

          {parentPath2 && parentName2 && (
            <>
              <span className="text-[#64748B]">/</span>
              <li>
                <Link to={parentPath2} className="text-[#64748B] hover:text-primary">{parentName2}</Link>
              </li>
            </>
          )}

          {currentName && (
            <>
              <span className="text-[#64748B]">/</span>
              <li className="text-primary">{currentName}</li>
            </>
          )}
        </ol>
      </nav>
    </div>
  );
};

export default Breadcrumb;
