/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import React from 'react';

import Dropdown from 'components/Dropdown';
import useOnClickOutside from 'components/Dropdown/useOnClickOutside';
import Button from './';

type ButtonComponent = React.ComponentType<React.PropsWithChildren<{
  onClick: (e: React.MouseEvent<any>) => void;
  disabled?: boolean;
  className?: string;
}>>;

export interface IDropdownContext {
  closeDropdown: () => void;
}

// Lets dropdown items (components/Dropdown/Item) close the menu that renders them
export const DropdownContext = React.createContext<IDropdownContext>({
  closeDropdown: () => undefined
});

interface Props {
  buttonComponent?: ButtonComponent;
  disabled?: boolean;
  className?: string;
  active?: boolean;
  content: React.ReactNode;
  align?: 'left' | 'right';
  menuWidth?: number;
}

const DropdownButton: React.FC<React.PropsWithChildren<Props>> = (props) => {
  const [active, setActive] = React.useState(false);
  const rootRef = React.useRef<HTMLDivElement>(null);

  const close = React.useCallback(() => setActive(false), []);
  const context = React.useMemo(() => ({ closeDropdown: close }), [close]);
  useOnClickOutside(rootRef, close);

  const Component = props.buttonComponent || Button;
  return (
    <DropdownContext.Provider value={context}>
      <div ref={rootRef} style={{ display: 'inline-block', position: 'relative' }}>
        <Component
          disabled={props.disabled}
          className={props.className}
          onClick={() => setActive(!active)}
        >
          {props.children}
        </Component>
        <Dropdown active={active} align={props.align} width={props.menuWidth}>
          {props.content}
        </Dropdown>
      </div>
    </DropdownContext.Provider>
  );
};

export default DropdownButton;
