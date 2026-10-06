/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import React, { useContext } from 'react';
import InteractionManager, { TReaction } from '../interaction';
import { ProtypoFormContext } from '../handlers/Form';

type TComponentConstructor<T> = React.ComponentType<T & IInteractiveComponentProps>;

export interface IVisibilityCondition {
    [key: string]: string;
}

export interface IInteractiveComponentReactions {
    show?: IVisibilityCondition[];
    hide?: IVisibilityCondition[];
}

export interface IInteractiveComponentProps extends IInteractiveComponentReactions {
    id: string;
}

const conditionContext: { [K in TReaction]: keyof IInteractiveComponentReactions } = {
    show: 'show',
    hide: 'hide'
};

const tryRegisterConditions = (props: IInteractiveComponentProps, interactionManager: InteractionManager) => {
    if (interactionManager) {
        Object.keys(conditionContext).forEach((reaction: TReaction) => {
            const dependentPropName = conditionContext[reaction];
            const dependentProp = props[dependentPropName];

            if (dependentProp && dependentProp.length) {
                interactionManager.registerReaction(props.id, reaction, dependentProp);
            }
        });
    }
};

export default function interactiveComponent<T>(Component: TComponentConstructor<T>) {
    const InteractiveComponent: React.FC<T & IInteractiveComponentProps> = props => {
        const context = useContext(ProtypoFormContext);
        const conditionMap = (context.conditionMap && context.conditionMap[props.id]) || {};
        tryRegisterConditions(props, context.interactionManager);

        if (false === conditionMap.show || true === conditionMap.hide) {
            return null;
        }
        else {
            return <Component {...props} />;
        }
    };

    return InteractiveComponent;
}
