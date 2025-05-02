export default function NewChat({
  index = 0,
  toggleNav,
  subHeaders,
  isSmallScreen,
  headerButtons,
}: {
  index?: number;
  toggleNav: () => void;
  isSmallScreen?: boolean;
  subHeaders?: React.ReactNode;
  headerButtons?: React.ReactNode;
}) {
  return (
    <div className="sticky left-0 right-0 top-0 z-50 ml-2 mb-1 bg-surface-secondary pt-1 dark:bg-darkbeige">
      {subHeaders != null ? subHeaders : null}
    </>
  );
}
