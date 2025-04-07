import { useQueryClient } from '@tanstack/react-query';
import { QueryKeys } from 'librechat-data-provider';
import debounce from 'lodash/debounce';
import { Search, X } from 'lucide-react';
import { forwardRef, Ref, useCallback, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useSetRecoilState } from 'recoil';
import { useLocalize, useNewConvo } from '~/hooks';
import store from '~/store';
import { cn } from '~/utils';

type SearchBarProps = {
  isSmallScreen?: boolean;
};

const SearchBar = forwardRef((props: SearchBarProps, ref: Ref<HTMLDivElement>) => {
  const localize = useLocalize();
  const inputRef = useRef<HTMLInputElement>(null);
  const location = useLocation();
  const queryClient = useQueryClient();
  const { isSmallScreen } = props;

  const [text, setText] = useState('');
  const [showClearIcon, setShowClearIcon] = useState(false);

  const { newConversation } = useNewConvo();
  const clearConvoState = store.useClearConvoState();
  const setSearchQuery = useSetRecoilState(store.searchQuery);
  const setIsSearching = useSetRecoilState(store.isSearching);
  const setIsSearchTyping = useSetRecoilState(store.isSearchTyping);

  const clearSearch = useCallback(() => {
    if (location.pathname.includes('/search')) {
      newConversation({ disableFocus: true });
    }
  }, [newConversation, location.pathname]);

  const clearText = useCallback(() => {
    setShowClearIcon(false);
    setSearchQuery('');
    clearSearch();
    setText('');
  }, [setSearchQuery, clearSearch]);

  const handleKeyUp = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const { value } = e.target as HTMLInputElement;
    if (e.key === 'Backspace' && value === '') {
      clearText();
    }
  };

  const sendRequest = useCallback(
    (value: string) => {
      setSearchQuery(value);
      if (!value) {
        return;
      }
      queryClient.invalidateQueries([QueryKeys.messages]);
      clearConvoState();
    },
    [queryClient, clearConvoState, setSearchQuery],
  );

  const debouncedSendRequest = useMemo(
    () =>
      debounce((value: string) => {
        sendRequest(value);
      }, 350),
    [sendRequest, setIsSearchTyping],
  );

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setShowClearIcon(value.length > 0);
    setText(value);
    setSearchQuery(value);
    setIsSearchTyping(true);
    // debounce only the API call
    debouncedSendRequest(value);
  };

  return (
    <div
      ref={ref}
      className={cn(
        'cursor-text group relative mt-1 flex h-10 items-center gap-3 rounded-lg border-border-medium px-3 py-2 text-text-primary bg-beigetertiary dark:bg-darkbeige900 transition-colors duration-200',
        isSmallScreen === true ? 'mb-2 h-14 rounded-2xl' : '',
      )}
      onClick={() => inputRef.current?.focus()}
    >
      <Search className="absolute left-3 h-4 w-4 text-text-secondary group-focus-within:text-text-primary group-hover:text-text-primary" />
      <input
        ref={inputRef}
        type="text"
        className="m-0 mr-0 w-full border-none bg-transparent p-0 pl-7 text-sm leading-tight placeholder-text-secondary placeholder-opacity-100 focus-visible:outline-none group-focus-within:placeholder-text-primary group-hover:placeholder-text-primary"
        value={text}
        onChange={onChange}
        onKeyDown={(e) => {
          e.code === 'Space' ? e.stopPropagation() : null;
        }}
        aria-label={localize('com_nav_search_placeholder')}
        placeholder={localize('com_nav_search_placeholder')}
        onKeyUp={handleKeyUp}
        onFocus={() => setIsSearching(true)}
        onBlur={() => setIsSearching(true)}
        autoComplete="off"
        dir="auto"
      />
      <X
        className={cn(
          'absolute right-[7px] h-5 w-5 cursor-pointer transition-opacity duration-200',
          showClearIcon ? 'block' : 'hidden',
          isSmallScreen === true ? 'right-[16px]' : '',
        )}
        onClick={clearText}
      />
    </div>
  );
});

export default SearchBar;
