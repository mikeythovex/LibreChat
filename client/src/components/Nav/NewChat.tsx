export default function NewChat({
  index = 0,
  toggleNav,
  subHeaders,
  isSmallScreen,
}: {
  index?: number;
  toggleNav: () => void;
  subHeaders?: React.ReactNode;
  isSmallScreen: boolean;
}) {
  return (
    <div className="sticky left-0 right-0 top-0 z-50 mx-3 mb-3 bg-beigesecondary pt-3.5 dark:bg-darkbeige">
      {subHeaders != null ? subHeaders : null}
    </div>
  );
}