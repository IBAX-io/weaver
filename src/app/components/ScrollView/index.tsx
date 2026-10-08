/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import React, { useEffect, useRef } from 'react';
import styled from 'styled-components';
import classNames from 'classnames';

export interface IScrollViewProps {
    className?: string;
    disableHorizontal?: boolean;
    disableVertical?: boolean;
    hideHorizontal?: boolean;
    hideVertical?: boolean;
    horizontalWheel?: boolean;
    children?: React.ReactNode;
}

const HORIZONTAL_WHEEL_SPEED = 8;

const StyledScrollView = styled.div`
    position: relative;
    width: 100%;
    height: 100%;
    overflow: auto;

    &.disable-vertical { overflow-y: hidden; }
    &.disable-horizontal { overflow-x: hidden; }

    /* Only hide the bar when the hidden axis is the only scrollable one */
    &.hide-scrollbar {
        scrollbar-width: none;
        &::-webkit-scrollbar { display: none; }
    }
`;

const ScrollView: React.FC<React.PropsWithChildren<IScrollViewProps>> = props => {
    const ref = useRef<HTMLDivElement>(null);

    // Vertical wheel scrolls horizontally. React's onWheel is passive, so preventDefault
    // only works on a listener registered with { passive: false }.
    useEffect(() => {
        const element = ref.current;
        if (!props.horizontalWheel || !element) {
            return undefined;
        }

        const onWheel = (e: WheelEvent) => {
            if (!e.deltaX) {
                e.preventDefault();
                element.scrollLeft += e.deltaY * HORIZONTAL_WHEEL_SPEED;
            }
        };
        element.addEventListener('wheel', onWheel, { passive: false });
        return () => element.removeEventListener('wheel', onWheel);
    }, [props.horizontalWheel]);

    const hideHorizontal = props.disableHorizontal || props.hideHorizontal;
    const hideVertical = props.disableVertical || props.hideVertical;

    return (
        <StyledScrollView
            ref={ref}
            className={classNames(props.className, {
                'disable-vertical': props.disableVertical,
                'disable-horizontal': props.disableHorizontal,
                'hide-scrollbar': hideHorizontal && hideVertical
                    || (hideHorizontal && props.disableVertical)
                    || (hideVertical && props.disableHorizontal)
            })}
        >
            {props.children}
        </StyledScrollView>
    );
};

export default ScrollView;
