import { Link } from 'react-router-dom';

interface BreadcrumbProps {
  pageName: string;
  parentPath?: string;
  parentName?: string;
  parentPath2?: string;
  parentName2?: string;
  parentPath3?: string;
  parentName3?: string;
  parentPath4?: string;
  parentName4?: string;
  currentName?: string;
}

const Breadcrumb = ({
  pageName,
  parentPath,
  parentName,
  parentPath2,
  parentName2,
  parentPath3,
  parentName3,
  parentPath4,
  parentName4,
  currentName
}: BreadcrumbProps) => {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-8">
        <h2 className="text-title-md2 font-semibold text-black dark:text-white">
          {pageName}
        </h2>
      </div>

      <nav>
        <ol className="flex items-center gap-2">
          {parentPath && parentName && (
            <li>
              <Link to={parentPath} className="text-[#64748B] hover:text-primary">{parentName}</Link>
            </li>
          )}

          {parentPath2 && parentName2 && (
            <>
              <span className="text-[#64748B]">/</span>
              <li>
                <Link to={parentPath2} className="text-[#64748B] hover:text-primary">{parentName2}</Link>
              </li>
            </>
          )}

          {parentPath3 && parentName3 && (
            <>
              <span className="text-[#64748B]">/</span>
              <li>
                <Link to={parentPath3} className="text-[#64748B] hover:text-primary">{parentName3}</Link>
              </li>
            </>
          )}

          {parentPath4 && parentName4 && (
            <>
              <span className="text-[#64748B]">/</span>
              <li>
                <Link to={parentPath4} className="text-[#64748B] hover:text-primary">{parentName4}</Link>
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
