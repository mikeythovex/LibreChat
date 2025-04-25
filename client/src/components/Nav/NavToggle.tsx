import { TooltipAnchor } from '~/components/ui';
import { useLocalize } from '~/hooks';
import { cn } from '~/utils';

export default function NavToggle({
  onToggle,
  navVisible,
  isHovering,
  setIsHovering,
  side = 'left',
  className = '',
  translateX = true,
}: {
  onToggle: () => void;
  navVisible: boolean;
  isHovering: boolean;
  setIsHovering: (isHovering: boolean) => void;
  side?: 'left' | 'right';
  className?: string;
  translateX?: boolean; 
}) {
  const localize = useLocalize();
  const transition = {
    transition: 'transform 0.3s ease, opacity 0.2s ease',
  };

  const rotationDegree = 15;
  const rotation = `${rotationDegree}deg`;
  const topBarRotation = side === 'right' ? `-${rotation}` : rotation;
  const bottomBarRotation = side === 'right' ? rotation : `-${rotation}`;

  return (
    <div
      className={cn(
        className,
        '-translate-y-1/2 transition-transform',
        navVisible ? 'rotate-0' : 'rotate-180',
        navVisible && translateX ? 'translate-x-[260px]' : 'translate-x-0 ',
      )}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
    </div>
  );
}
